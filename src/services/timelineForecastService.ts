/**
 * Linha do Tempo Preditiva — busca a previsão real de vento hora a hora do dia atual
 * (00h a 23h), direto do Open-Meteo, e identifica a janela mais crítica do dia.
 *
 * Diferente dos antigos cartões de previsão (extrapolação matemática simples), isto
 * usa a previsão horária REAL do modelo meteorológico — mais preciso, porque reflete
 * o que o modelo realmente espera pro resto do dia, não só uma projeção da tendência
 * atual.
 */

import { getSaoPauloDateString } from "@/lib/saoPauloTime";

export interface TimelinePoint {
  hour: number; // 0-23
  windSpeedKmh: number;
  windGustKmh: number;
}

export interface CriticalWindow {
  startHour: number;
  endHour: number;
  maxWindKmh: number;
}

// Mesmo limiar oficial confirmado via notícias reais (25 nós ≈ 46km/h) — ver
// regionalWatchService.ts e historico-paralisacoes-balsa.md.
export const CRITICAL_WIND_THRESHOLD_KMH = 46;

const LATITUDE = -23.813915;
const LONGITUDE = -45.386843;

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
  };
}

export async function fetchTodayWindTimeline(): Promise<TimelinePoint[]> {
  // Bug real corrigido: usava toISOString() (UTC) — a partir das 21h no horário de SP
  // isso já buscava a previsão do dia seguinte. Ver src/lib/saoPauloTime.ts.
  const today = getSaoPauloDateString();

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LATITUDE));
  url.searchParams.set("longitude", String(LONGITUDE));
  url.searchParams.set("hourly", "wind_speed_10m,wind_gusts_10m");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("start_date", today);
  url.searchParams.set("end_date", today);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo (linha do tempo) respondeu ${res.status}`);
  const data: OpenMeteoHourlyResponse = await res.json();

  return data.hourly.time.map((t, i) => ({
    hour: Number(t.slice(11, 13)),
    windSpeedKmh: data.hourly.wind_speed_10m[i],
    windGustKmh: data.hourly.wind_gusts_10m[i],
  }));
}

/** Encontra a maior janela contínua de horas com RAJADA acima do limiar crítico.
 * Usa rajada (não vento sustentado) porque o backtest contra fechamentos reais mostrou
 * que o vento sustentado costuma ficar bem abaixo dos limiares nos fechamentos de
 * verdade — é a rajada que se comporta de forma consistente com o que realmente fecha
 * a travessia. */
export function findCriticalWindow(
  points: TimelinePoint[],
  thresholdKmh: number = CRITICAL_WIND_THRESHOLD_KMH
): CriticalWindow | null {
  let bestWindow: CriticalWindow | null = null;
  let currentStart: number | null = null;
  let currentMax = 0;

  const closeWindow = (endHour: number) => {
    if (currentStart == null) return;
    const window: CriticalWindow = { startHour: currentStart, endHour, maxWindKmh: currentMax };
    if (!bestWindow || window.maxWindKmh > bestWindow.maxWindKmh) bestWindow = window;
    currentStart = null;
    currentMax = 0;
  };

  for (const p of points) {
    if (p.windGustKmh >= thresholdKmh) {
      if (currentStart == null) currentStart = p.hour;
      currentMax = Math.max(currentMax, p.windGustKmh);
    } else {
      closeWindow(p.hour);
    }
  }
  closeWindow(24);

  return bestWindow;
}
