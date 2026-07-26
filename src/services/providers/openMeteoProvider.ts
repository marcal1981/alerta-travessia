import { WeatherReading } from "@/types";
import { WeatherProvider } from "../weatherService";

/**
 * Coordenadas do canal entre os terminais de São Sebastião e Ilhabela — ponto médio
 * entre as coordenadas reais dos dois terminais (Google Places), não mais uma
 * estimativa aproximada.
 */
const LATITUDE = -23.813915;
const LONGITUDE = -45.386843;

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

// Códigos WMO (padrão usado pelo Open-Meteo) para nevoeiro/neblina.
// 45 = Nevoeiro · 48 = Nevoeiro com deposição de gelo (raro no litoral SP, mantido por completude).
const FOG_CODES = new Set([45, 48]);

interface OpenMeteoCurrentResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    visibility?: number;
    weather_code: number;
  };
}

interface OpenMeteoMarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_period: number[];
  };
}

/**
 * Provedor real via Open-Meteo — sem necessidade de API key.
 * Combina duas APIs públicas do mesmo provedor:
 *  - /v1/forecast: temperatura, pressão, umidade, vento, chuva, visibilidade
 *  - /v1/marine: altura e período de onda
 *
 * Limitação conhecida: Open-Meteo não oferece dado de maré (tábua de marés).
 * `tideM` fica `null` até integrarmos uma fonte específica para isso
 * (ex. tábua de marés da Marinha do Brasil / DHN).
 */
export class OpenMeteoProvider implements WeatherProvider {
  id = "open-meteo" as const;

  async fetchCurrent(): Promise<WeatherReading> {
    const forecastUrl = new URL(FORECAST_URL);
    forecastUrl.searchParams.set("latitude", String(LATITUDE));
    forecastUrl.searchParams.set("longitude", String(LONGITUDE));
    forecastUrl.searchParams.set(
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "pressure_msl",
        "wind_speed_10m",
        "wind_gusts_10m",
        "wind_direction_10m",
        "precipitation",
        "visibility",
        "weather_code",
      ].join(",")
    );
    forecastUrl.searchParams.set("wind_speed_unit", "kmh");
    forecastUrl.searchParams.set("timezone", "America/Sao_Paulo");

    const marineUrl = new URL(MARINE_URL);
    marineUrl.searchParams.set("latitude", String(LATITUDE));
    marineUrl.searchParams.set("longitude", String(LONGITUDE));
    marineUrl.searchParams.set("hourly", "wave_height,wave_period");
    marineUrl.searchParams.set("timezone", "America/Sao_Paulo");
    marineUrl.searchParams.set("forecast_days", "1");

    const [forecastRes, marineRes] = await Promise.all([
      fetch(forecastUrl.toString()),
      fetch(marineUrl.toString()),
    ]);

    if (!forecastRes.ok) {
      throw new Error(`Open-Meteo forecast API respondeu ${forecastRes.status}`);
    }
    if (!marineRes.ok) {
      throw new Error(`Open-Meteo marine API respondeu ${marineRes.status}`);
    }

    const forecast: OpenMeteoCurrentResponse = await forecastRes.json();
    const marine: OpenMeteoMarineResponse = await marineRes.json();

    // A marine API só retorna série horária (sem endpoint "current"); pegamos a
    // leitura da hora mais próxima de agora.
    const nowIso = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
    let marineIdx = marine.hourly.time.findIndex((t) => t.startsWith(nowIso));
    if (marineIdx === -1) marineIdx = 0;

    const c = forecast.current;

    return {
      source: "open-meteo",
      timestamp: c.time,
      temperatureC: c.temperature_2m,
      pressureHpa: c.pressure_msl,
      humidityPct: c.relative_humidity_2m,
      windSpeedKmh: c.wind_speed_10m,
      windGustKmh: c.wind_gusts_10m,
      windDirectionDeg: c.wind_direction_10m,
      waveHeightM: marine.hourly.wave_height[marineIdx] ?? 0,
      wavePeriodS: marine.hourly.wave_period[marineIdx] ?? 0,
      tideM: null, // Open-Meteo não cobre maré — sobrescrito por applyTide() em weatherService.ts
      isLowTideTruckRestriction: false, // idem — placeholder até applyTide() calcular de verdade
      visibilityKm: c.visibility != null ? c.visibility / 1000 : 10,
      precipitationMm: c.precipitation,
      weatherCode: c.weather_code,
      isFog: FOG_CODES.has(c.weather_code),
    };
  }
}
