import { IncomingSystem } from "@/types";

/**
 * Monitor Regional — observa 3 pontos de referência distantes e estima se uma
 * tempestade/vento forte/mar agitado detectado lá está se deslocando em direção à
 * travessia.
 *
 *  - Santos (SO, ~97km): frentes frias nesta costa se deslocam de Sul/Sudoeste para
 *    Nordeste — padrão climatológico bem documentado. Confiança alta.
 *  - Paraty (NE, ~95km): mesma faixa de litoral costuma ser atingida pela mesma
 *    instabilidade que chega em São Sebastião/Ilhabela, mas não necessariamente por um
 *    sistema que "viaja" de um pro outro — é mais um sinal de que a região toda está
 *    instável. Por isso confiança baixa (marcado explicitamente na UI).
 *  - Ponto oceânico (L, ~100km em alto-mar): ciclones extratropicais se formam no
 *    próprio oceano e avançam pra costa perpendicular a ela — fenômeno real, distinto
 *    dos outros dois, sinalizado por vento forte + onda alta no ponto (não chuva).
 *    Confiança alta.
 *
 * DELIBERADAMENTE não usa isto para nevoeiro: neblina se forma localmente por
 * temperatura/umidade do próprio lugar, não "viaja" como uma célula de chuva.
 *
 * O resultado deste serviço nunca altera o índice de risco "Agora" — só os horizontes
 * futuros de previsão (ver `riskEngine.ts`), e sempre com o motivo explícito na UI.
 */

interface ReferencePoint {
  label: string;
  latitude: number;
  longitude: number;
  checkMarine: boolean; // true só para o ponto oceânico (usa altura de onda, não chuva)
  confidence: "alta" | "baixa";
}

const REFERENCE_POINTS: ReferencePoint[] = [
  { label: "Santos", latitude: -23.9535, longitude: -46.3346, checkMarine: false, confidence: "alta" },
  { label: "Paraty", latitude: -23.22, longitude: -44.7204, checkMarine: false, confidence: "baixa" },
  { label: "Oceano (100km a leste)", latitude: -23.8139, longitude: -44.4049, checkMarine: true, confidence: "alta" },
];

const CROSSING_LATITUDE = -23.813915;
const CROSSING_LONGITUDE = -45.386843;

// Mesmo limiar oficial usado pelo Departamento Hidroviário pra paralisar a travessia.
// Confirmado via 2 notícias independentes citando a Semil em ocorrências reais:
// "acima do limite de segurança para a operação, que é de 25 nós" (Band Vale, 29/07/2025)
// e "a travessia é interrompida quando os ventos alcançam cerca de 46 km/h" (Informa.life).
// 25 nós ≈ 46,3 km/h — os dois números batem entre si. Substitui a estimativa anterior (39km/h).
const STRONG_WIND_THRESHOLD_KMH = 46;
const HEAVY_RAIN_THRESHOLD_MM = 4;
const HIGH_WAVE_THRESHOLD_M = 2.5; // "mar agitado" / ressaca, consistente com avisos da Marinha
const DIRECTION_TOLERANCE_DEG = 50; // quão alinhado o vento precisa estar com a rota até a travessia

interface OpenMeteoSimpleCurrent {
  current: {
    precipitation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
}

interface OpenMeteoMarineCurrent {
  hourly: {
    time: string[];
    wave_height: number[];
  };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Direção (graus, 0=Norte) de um ponto A até um ponto B. */
function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const theta = (Math.atan2(y, x) * 180) / Math.PI;
  return (theta + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

async function fetchSimpleCurrent(point: ReferencePoint): Promise<OpenMeteoSimpleCurrent> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.latitude));
  url.searchParams.set("longitude", String(point.longitude));
  url.searchParams.set(
    "current",
    ["precipitation", "wind_speed_10m", "wind_direction_10m", "weather_code"].join(",")
  );
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo (${point.label}) respondeu ${res.status}`);
  return res.json();
}

async function fetchWaveHeight(point: ReferencePoint): Promise<number | null> {
  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.set("latitude", String(point.latitude));
  url.searchParams.set("longitude", String(point.longitude));
  url.searchParams.set("hourly", "wave_height");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data: OpenMeteoMarineCurrent = await res.json();

  const nowIso = new Date().toISOString().slice(0, 13);
  let idx = data.hourly.time.findIndex((t) => t.startsWith(nowIso));
  if (idx === -1) idx = 0;
  return data.hourly.wave_height[idx] ?? null;
}

export async function checkIncomingSystems(): Promise<IncomingSystem | null> {
  const matches: IncomingSystem[] = [];

  for (const point of REFERENCE_POINTS) {
    try {
      const data = await fetchSimpleCurrent(point);
      const c = data.current;

      const distanceKm = haversineKm(point.latitude, point.longitude, CROSSING_LATITUDE, CROSSING_LONGITUDE);
      const bearingToCrossing = bearingDeg(point.latitude, point.longitude, CROSSING_LATITUDE, CROSSING_LONGITUDE);
      // Direção pra ONDE o vento está soprando (oposto de "de onde vem", que é o padrão meteorológico).
      const windBlowingToward = (c.wind_direction_10m + 180) % 360;
      const aligned = angleDiff(bearingToCrossing, windBlowingToward) <= DIRECTION_TOLERANCE_DEG;

      if (!aligned) continue;

      const isHeavyRain = c.precipitation >= HEAVY_RAIN_THRESHOLD_MM;
      const isStrongWind = c.wind_speed_10m >= STRONG_WIND_THRESHOLD_KMH;

      let isHighWave = false;
      if (point.checkMarine) {
        const waveHeight = await fetchWaveHeight(point);
        isHighWave = waveHeight != null && waveHeight >= HIGH_WAVE_THRESHOLD_M;
      }

      if (!isHeavyRain && !isStrongWind && !isHighWave) continue;

      const etaHours = Math.max(0.5, distanceKm / Math.max(c.wind_speed_10m, 10));

      matches.push({
        type: isHeavyRain ? "chuva_forte" : "vento_forte",
        sourceLabel: point.label,
        distanceKm: Math.round(distanceKm),
        etaHours: Math.round(etaHours * 10) / 10,
        confidence: point.confidence,
      });
    } catch (err) {
      console.error(`Falha ao monitorar ${point.label}:`, err);
      continue;
    }
  }

  if (matches.length === 0) return null;

  // Prioriza o alerta de confiança alta com ETA mais próximo (mais urgente e mais confiável).
  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "alta" ? -1 : 1;
    return a.etaHours - b.etaHours;
  });

  return matches[0];
}
