"use client";

import { CamerasPanel } from "@/components/CamerasPanel";
import { useCrossingRisk } from "@/hooks/useCrossingRisk";
import { StatusPanel } from "@/components/StatusPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { ForecastCards } from "@/components/ForecastCards";
import { WeatherPanel } from "@/components/WeatherPanel";
import { AIExplanation } from "@/components/AIExplanation";

export default function DashboardPage() {
  const { weather, mpt, officialStatus, queueStatus, loading, error } = useCrossingRisk();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-mist-100">Painel Principal</h1>
          <p className="text-sm text-mist-500">Atualização automática a cada minuto.</p>
        </div>
        {error && <p className="text-sm text-signal-critical">{error}</p>}
      </div>

      <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-signal-watch/30 bg-signal-watch/10 px-4 py-2.5 text-xs text-mist-100">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal-watch" />
        Estimativa de IA — não substitui o comunicado oficial do Departamento Hidroviário.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusPanel status={officialStatus} queueStatus={queueStatus} />
        <div className="instrument-panel flex items-center justify-center p-4 lg:col-span-2">
          {mpt ? <RiskGauge index={mpt.riskIndex} /> : <p className="text-sm text-mist-500">Calculando índice de risco…</p>}
        </div>
      </div>

      <section className="mt-6">
        <p className="eyebrow mb-3">Previsão</p>
        {mpt && <ForecastCards forecast={mpt.forecast} />}
      </section>

      <section className="mt-6">
        <WeatherPanel reading={weather} />
      </section>

      <section className="mt-6">
        <AIExplanation mpt={mpt} />
      </section>

      <section className="mt-6">
        <CamerasPanel />
      </section>

      {loading && !weather && (
        <p className="mt-6 text-center text-sm text-mist-500">Carregando dados…</p>
      )}
    </div>
  );
}
