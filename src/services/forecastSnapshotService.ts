import { ForecastSnapshot } from "@/types";
import { fetchTodayWindTimeline } from "./timelineForecastService";
import { logForecastSnapshot } from "@/firebase/firestore";
import { getSaoPauloDateString } from "@/lib/saoPauloTime";
import { logError } from "@/lib/logger";

/**
 * Captura um "retrato" da previsão horária atual, no máximo 1 vez por hora — várias
 * capturas no mesmo dia, cada uma vinda de um momento diferente, é exatamente o que
 * permite depois medir "o que o modelo previu 3h/6h/9h antes de cada hora real".
 *
 * Isso substitui a necessidade da Single Runs API (que não cobre nosso período
 * histórico) — construindo nosso PRÓPRIO arquivo de "o que foi previsto quando",
 * daqui pra frente.
 */

let lastSnapshotAt: number | null = null;
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

export async function maybeCaptureForecastSnapshot(): Promise<void> {
  const now = Date.now();
  if (lastSnapshotAt != null && now - lastSnapshotAt < MIN_INTERVAL_MS) return;

  try {
    const points = await fetchTodayWindTimeline();
    // Bug real corrigido: usava toISOString() (UTC) — ver src/lib/saoPauloTime.ts.
    const todayDate = getSaoPauloDateString();
    const snapshot: ForecastSnapshot = {
      fetchedAt: new Date().toISOString(),
      hourlyGustKmh: points.map((p) => ({
        hour: `${todayDate}T${String(p.hour).padStart(2, "0")}:00`,
        gustKmh: p.windGustKmh,
      })),
    };
    await logForecastSnapshot(snapshot);
    lastSnapshotAt = now;
  } catch (err) {
    logError("forecastSnapshotService", err);
  }
}
