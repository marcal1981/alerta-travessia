import { WeatherReading, WeatherSourceConfig, WeatherSourceId } from "@/types";
import { OpenMeteoProvider } from "./providers/openMeteoProvider";
import { getTideAt } from "./tideService";

/**
 * Contrato que qualquer provedor meteorológico real deve implementar.
 * Fase 1: apenas o MockWeatherProvider está ativo.
 * Fase 2 (integração real): criar um arquivo por provedor (ex. openMeteoProvider.ts)
 * implementando esta mesma interface e registrar em `activeProvider` abaixo.
 */
export interface WeatherProvider {
  id: WeatherSourceId;
  fetchCurrent(): Promise<WeatherReading>;
}

/**
 * ATENÇÃO: dado simulado.
 * Este provedor existe apenas para permitir o desenvolvimento e demonstração da UI
 * enquanto a integração real (Open-Meteo / INMET / StormGlass / NOAA) não é conectada.
 * Nenhum valor aqui deve ser tratado como leitura meteorológica real.
 */
class MockWeatherProvider implements WeatherProvider {
  id: WeatherSourceId = "mock";

  async fetchCurrent(): Promise<WeatherReading> {
    // Variação leve e determinística por minuto, só para o dashboard não parecer estático.
    const t = Date.now() / 60000;
    const wobble = (amp: number, freq: number, phase = 0) =>
      amp * Math.sin(t * freq + phase);

    const visibilityKm = 12 - Math.max(0, wobble(6, 0.05, 0.8));
    const simulatedFog = visibilityKm < 3; // simula nevoeiro quando a visibilidade simulada cai muito

    return {
      source: "mock",
      timestamp: new Date().toISOString(),
      temperatureC: 24 + wobble(2, 0.05),
      pressureHpa: 1013 + wobble(3, 0.03, 1),
      humidityPct: 78 + wobble(6, 0.04, 2),
      windSpeedKmh: 22 + wobble(8, 0.07, 0.5),
      windGustKmh: 34 + wobble(10, 0.09, 1.2),
      windDirectionDeg: (140 + wobble(30, 0.02, 2)) % 360,
      waveHeightM: 1.4 + wobble(0.6, 0.06, 0.3),
      wavePeriodS: 7 + wobble(1.5, 0.04, 1.5),
      tideM: 0.8 + wobble(0.4, 0.03),
      isLowTideTruckRestriction: false, // sobrescrito por applyTide() em weatherService.ts
      visibilityKm,
      precipitationMm: Math.max(0, wobble(3, 0.08, 2.5)),
      weatherCode: simulatedFog ? 45 : 1,
      isFog: simulatedFog,
    };
  }
}

/**
 * Registro de fontes conhecidas. `configured` fica false até que a chave/endpoint real
 * seja adicionado nas variáveis de ambiente — o painel Admin lê este registro para
 * mostrar quais integrações já estão prontas.
 */
export const WEATHER_SOURCES: WeatherSourceConfig[] = [
  { id: "open-meteo", label: "Open-Meteo", enabled: true, configured: true },
  { id: "inmet", label: "INMET", enabled: false, configured: false },
  { id: "noaa", label: "NOAA", enabled: false, configured: false },
  { id: "stormglass", label: "StormGlass", enabled: false, configured: false },
  { id: "windy", label: "Windy", enabled: false, configured: false },
  { id: "windfinder", label: "Windfinder", enabled: false, configured: false },
  { id: "mock", label: "Simulado (desenvolvimento)", enabled: true, configured: true },
];

// Ponto único de troca: quando outro provedor real estiver pronto (INMET, StormGlass...),
// registrar aqui seguindo o mesmo padrão do OpenMeteoProvider.
const primaryProvider: WeatherProvider = new OpenMeteoProvider();
const fallbackProvider: WeatherProvider = new MockWeatherProvider();

export async function getCurrentWeather(): Promise<WeatherReading> {
  try {
    const reading = await primaryProvider.fetchCurrent();
    return applyTide(reading);
  } catch (err) {
    // Se a API real falhar (rede indisponível, mudança de contrato, etc.), cai para o
    // simulado em vez de quebrar o dashboard — mas o `source` no retorno deixa isso visível.
    console.error("Open-Meteo indisponível, usando dado simulado:", err);
    const reading = await fallbackProvider.fetchCurrent();
    return applyTide(reading);
  }
}

/**
 * Maré é calculada localmente (sem chamada de API — ver tideService.ts) e mesclada em
 * cima do que o provedor meteorológico retornou, sobrescrevendo o `tideM: null` padrão.
 * Se a tábua de maré carregada não cobrir o instante atual (ex. amostra de teste
 * cobrindo só 2 dias), a maré simplesmente permanece `null` — nunca inventamos valor.
 */
function applyTide(reading: WeatherReading): WeatherReading {
  const tide = getTideAt(reading.timestamp);
  if (!tide) return reading;
  return {
    ...reading,
    tideM: tide.heightM,
    isLowTideTruckRestriction: tide.isLowTideTruckRestriction,
  };
}
