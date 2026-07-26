"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CRITICAL_WIND_THRESHOLD_KMH,
  CriticalWindow,
  TimelinePoint,
  fetchTodayWindTimeline,
  findCriticalWindow,
} from "@/services/timelineForecastService";

// Mesmas cores de zona usadas no medidor de risco principal (RiskGauge) — mantém a
// linguagem visual consistente entre os dois instrumentos.
const ZONE_COLORS = {
  baixo: "#2DD4A7",
  atencao: "#F4B740",
  alto: "#F97316",
  critico: "#E23744",
};

// Limiares em km/h que definem as faixas de cor do gráfico (não são um novo cálculo de
// risco — são só os mesmos patamares usados no restante do app, incluindo o limiar
// oficial de fechamento confirmado via notícias reais).
const THRESHOLDS = { baixo: 20, atencao: 35, alto: CRITICAL_WIND_THRESHOLD_KMH };

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`;
}

export function PredictiveTimelineChart() {
  const [points, setPoints] = useState<TimelinePoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [criticalWindow, setCriticalWindow] = useState<CriticalWindow | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTodayWindTimeline()
      .then((data) => {
        if (cancelled) return;
        setPoints(data);
        setCriticalWindow(findCriticalWindow(data));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao buscar previsão.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const domainMax = points ? Math.max(60, Math.ceil(Math.max(...points.map((p) => p.windGustKmh)) / 10) * 10 + 10) : 60;

  // Gradiente vertical: a cor muda pela ALTURA do valor no eixo Y, não pela posição no
  // tempo — reproduz o efeito de "faixas de risco" do desenho de referência.
  const stop = (thresholdKmh: number) => `${(100 - (thresholdKmh / domainMax) * 100).toFixed(1)}%`;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-mist-100">Linha do Tempo Preditiva — Hoje</h2>
        <p className="mt-1 text-xs text-mist-500">Alteração climática — Fonte: Open-Meteo, hora a hora</p>
      </div>

      {error && <p className="text-sm text-signal-critical">{error}</p>}

      {criticalWindow && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-signal-critical/40 bg-signal-critical/10 px-4 py-3 text-sm text-mist-100">
          <span className="mt-0.5 text-signal-critical">⚠</span>
          <span>
            <strong className="font-semibold text-signal-critical">Risco crítico de fechamento</strong>
            <br />
            Ventos acima de {CRITICAL_WIND_THRESHOLD_KMH}km/h previstos entre{" "}
            {formatHour(criticalWindow.startHour)} e {formatHour(criticalWindow.endHour)} (pico de{" "}
            {criticalWindow.maxWindKmh.toFixed(0)}km/h).
          </span>
        </div>
      )}
      {points && !criticalWindow && (
        <div className="mb-4 rounded-lg border border-signal-low/30 bg-signal-low/10 px-4 py-2.5 text-sm text-mist-100">
          Nenhuma janela crítica de vento prevista para hoje.
        </div>
      )}

      <div className="h-[280px] w-full">
        {!points ? (
          <div className="flex h-full items-center justify-center text-sm text-mist-500">
            Carregando previsão do dia…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="windRiskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ZONE_COLORS.critico} stopOpacity={0.9} />
                  <stop offset={stop(THRESHOLDS.alto)} stopColor={ZONE_COLORS.critico} stopOpacity={0.9} />
                  <stop offset={stop(THRESHOLDS.alto)} stopColor={ZONE_COLORS.alto} stopOpacity={0.8} />
                  <stop offset={stop(THRESHOLDS.atencao)} stopColor={ZONE_COLORS.alto} stopOpacity={0.8} />
                  <stop offset={stop(THRESHOLDS.atencao)} stopColor={ZONE_COLORS.atencao} stopOpacity={0.7} />
                  <stop offset={stop(THRESHOLDS.baixo)} stopColor={ZONE_COLORS.atencao} stopOpacity={0.7} />
                  <stop offset={stop(THRESHOLDS.baixo)} stopColor={ZONE_COLORS.baixo} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={ZONE_COLORS.baixo} stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "#8A93A6", fontSize: 11 }}
                interval={2}
              />
              <YAxis
                domain={[0, domainMax]}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "#8A93A6", fontSize: 11 }}
                width={32}
              />
              <Tooltip
                contentStyle={{ background: "#111A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelFormatter={(h) => formatHour(Number(h))}
                formatter={(value: number) => [`${value.toFixed(1)} km/h`, "Vento"]}
              />

              {criticalWindow && (
                <ReferenceArea
                  x1={criticalWindow.startHour}
                  x2={criticalWindow.endHour}
                  fill={ZONE_COLORS.critico}
                  fillOpacity={0.15}
                  stroke={ZONE_COLORS.critico}
                  strokeOpacity={0.4}
                />
              )}

              {/* Linhas de limiar — mesma linguagem operacional do medidor de risco principal */}
              <ReferenceLine
                y={THRESHOLDS.baixo}
                stroke={ZONE_COLORS.baixo}
                strokeDasharray="4 3"
                label={{ value: "Operando", position: "insideBottomLeft", fill: ZONE_COLORS.baixo, fontSize: 11, fontWeight: 600 }}
              />
              <ReferenceLine
                y={THRESHOLDS.atencao}
                stroke={ZONE_COLORS.alto}
                strokeDasharray="4 3"
                label={{ value: "Alerta", position: "insideBottomLeft", fill: ZONE_COLORS.alto, fontSize: 11, fontWeight: 600 }}
              />
              <ReferenceLine
                y={THRESHOLDS.alto}
                stroke={ZONE_COLORS.critico}
                strokeDasharray="4 3"
                label={{ value: "Risco de Interrupção", position: "insideBottomLeft", fill: ZONE_COLORS.critico, fontSize: 11, fontWeight: 600 }}
              />

              <Area
                type="monotone"
                dataKey="windSpeedKmh"
                stroke="#F5F7FA"
                strokeWidth={2}
                fill="url(#windRiskGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
