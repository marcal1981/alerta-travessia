"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentWeather } from "@/services/weatherService";
import { runMpt } from "@/services/riskEngine";
import { getOfficialStatus } from "@/services/officialStatusService";
import { checkIncomingSystems } from "@/services/regionalWatchService";
import { getOfficialQueueStatus } from "@/services/officialQueueService";
import { logRegionalAlert } from "@/firebase/firestore";
import { MptResult, OfficialQueueStatus, OfficialStatus, WeatherReading } from "@/types";

interface CrossingRiskState {
  weather: WeatherReading | null;
  mpt: MptResult | null;
  officialStatus: OfficialStatus | null;
  queueStatus: OfficialQueueStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 60_000; // atualização automática a cada minuto

export function useCrossingRisk(): CrossingRiskState {
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  const [mpt, setMpt] = useState<MptResult | null>(null);
  const [officialStatus, setOfficialStatus] = useState<OfficialStatus | null>(null);
  const [queueStatus, setQueueStatus] = useState<OfficialQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [reading, status, incomingSystem, queue] = await Promise.all([
        getCurrentWeather(),
        getOfficialStatus(),
        checkIncomingSystems(),
        getOfficialQueueStatus(),
      ]);
      setWeather(reading);
      setOfficialStatus(status);
      setQueueStatus(queue);
      const result = runMpt(reading, undefined, false, incomingSystem);
      setMpt(result);
      if (incomingSystem) {
        logRegionalAlert(incomingSystem, result.riskIndex).catch((err) =>
          console.error("Falha ao registrar alerta regional:", err)
        );
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { weather, mpt, officialStatus, queueStatus, loading, error, refresh: load };
}
