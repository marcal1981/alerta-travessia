"use client";

import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CRITICAL_WIND_THRESHOLD_KMH,
  CriticalWindow,
  TimelinePoint,
  fetchTodayWindTimeline,
  findCriticalWindow,
} from "@/services/timelineForecastService";
import { getSaoPauloDisplayDate } from "@/lib/saoPauloTime";

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

const TIMELINE_REFRESH_MS = 20 * 60_000; // mesma cadência do resto do app

export function PredictiveTimelineChart() {
  const [points, setPoints] = useState<TimelinePoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [criticalWindow, setCriticalWindow] = useState<CriticalWindow | null>(null);

  const [displayDate, setDisplayDate] = useState<string>(() => getSaoPauloDisplayDate());

  useEffect(() => {
    let cancelled = false;

    function load() {
      setDisplayDate(getSaoPauloDisplayDate());
      fetchTodayWindTimeline()
        .then((data) => {
          if (cancelled) return;
          setPoints(data);
          setCriticalWindow(findCriticalWindow(data));
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao buscar previsão.");
        });
    }

    load();
    // Bug real corrigido: antes, este gráfico buscava a previsão só 1x ao carregar a
    // página e nunca mais — se o modelo atualizasse depois mostrando uma nova janela
    // crítica, o aviso de texto ficava desatualizado mesmo com o desenho já mudado.
    const id = setInterval(load, TIMELINE_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const domainMax = points ? Math.max(60, Math.ceil(Math.max(...points.map((p) => p.windGustKmh)) / 10) * 10 + 10) : 60;

  // Percentual de cada limiar dentro do viewport do gráfico (não da caixa da curva) —
  // é isso que corrige o bug de cor, combinado com gradientUnits="userSpaceOnUse".
  const stop = (thresholdKmh: number) => `${(100 - (thresholdKmh / domainMax) * 100).toFixed(1)}%`;

  // Mesmo mapeamento de pixel usado no gradiente (y1=8, y2=250) — para posicionar as
  // palavras de zona (Operando/Alerta/Risco de Interrupção) direto nas faixas de cor.
  const PLOT_TOP = 8;
  const PLOT_BOTTOM = 250;
  const valueToY = (v: number) => PLOT_BOTTOM - (v / domainMax) * (PLOT_BOTTOM - PLOT_TOP);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-mist-100">Linha do Tempo Preditiva — {displayDate}</h2>
        <p className="mt-1 text-xs text-mist-500">
          Rajada de vento prevista (km/h) — Fonte: Open-Meteo, hora a hora
        </p>
      </div>

      {error && <p className="text-sm text-signal-critical">{error}</p>}

      {criticalWindow && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-signal-critical/40 bg-signal-critical/10 px-4 py-3 text-sm text-mist-100">
          <span className="mt-0.5 text-signal-critical">⚠</span>
          <span>
            <strong className="font-semibold text-signal-critical">Risco crítico de fechamento</strong>
            <br />
            Rajadas acima de {CRITICAL_WIND_THRESHOLD_KMH}km/h previstas entre{" "}
            {formatHour(criticalWindow.startHour)} e {formatHour(criticalWindow.endHour)} (pico de{" "}
            {criticalWindow.maxWindKmh.toFixed(0)}km/h).
          </span>
        </div>
      )}
      {points && !criticalWindow && (
        <div className="mb-4 rounded-lg border border-signal-low/30 bg-signal-low/10 px-4 py-2.5 text-sm text-mist-100">
          Nenhuma janela crítica de rajada prevista para hoje.
        </div>
      )}

      <div className="h-[280px] w-full">
        {!points ? (
          <div className="flex h-full items-center justify-center text-sm text-mist-500">
            Carregando previsão do dia…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 2, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "#8A93A6", fontSize: 9 }}
                interval={2}
              />
              <YAxis
                domain={[0, domainMax]}
                width={1}
                axisLine={false}
                tickLine={false}
                ticks={[0, THRESHOLDS.baixo, THRESHOLDS.atencao, THRESHOLDS.alto, domainMax]}
                tick={(props: { x: number; y: number; payload: { value: number } }) => (
                  <text
                    x={props.x + 8}
                    y={props.y}
                    dy={-4}
                    fontSize={9}
                    fontFamily="var(--font-mono, monospace)"
                    fill="#8A93A6"
                    fillOpacity={0.7}
                    textAnchor="start"
                  >
                    {props.payload.value}km
                  </text>
                )}
              />
              {/* position.y fixo trava o tooltip numa faixa superior sempre visível —
                  antes ele seguia o ponto do dado e em picos altos acabava tampando
                  a própria curva. Só o eixo x continua acompanhando o cursor. */}
              <Tooltip
                position={{ y: 4 }}
                wrapperStyle={{ zIndex: 20 }}
                contentStyle={{
                  background: "#111A2E",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
                itemStyle={{ padding: 0, fontSize: 11 }}
                labelStyle={{ fontSize: 11, marginBottom: 2 }}
                labelFormatter={(h) => formatHour(Number(h))}
                formatter={(value: number) => [`${value.toFixed(1)} km/h`, "Rajada"]}
              />

              {/* Faixas de cor FIXAS por valor real do eixo Y (não pelo pico do dia) —
                  corrige um bug real: a técnica anterior (gradiente com objectBoundingBox,
                  o padrão do SVG) usa a caixa delimitadora da PRÓPRIA curva como referência
                  (100% do gradiente = maior valor do dia), então num dia com pico de
                  42km/h, a cor vermelha aparecia bem antes do limiar real de 46km/h.
                  userSpaceOnUse ancora no viewport do gráfico inteiro, não na curva. */}
              <defs>
                <linearGradient id="windRiskGradient" gradientUnits="userSpaceOnUse" x1="0" y1={8} x2="0" y2={250}>
                  <stop offset="0%" stopColor={ZONE_COLORS.critico} />
                  <stop offset={stop(THRESHOLDS.alto)} stopColor={ZONE_COLORS.critico} />
                  <stop offset={stop(THRESHOLDS.alto)} stopColor={ZONE_COLORS.alto} />
                  <stop offset={stop(THRESHOLDS.atencao)} stopColor={ZONE_COLORS.alto} />
                  <stop offset={stop(THRESHOLDS.atencao)} stopColor={ZONE_COLORS.atencao} />
                  <stop offset={stop(THRESHOLDS.baixo)} stopColor={ZONE_COLORS.atencao} />
                  <stop offset={stop(THRESHOLDS.baixo)} stopColor={ZONE_COLORS.baixo} />
                  <stop offset="100%" stopColor={ZONE_COLORS.baixo} />
                </linearGradient>
              </defs>

              {criticalWindow && (
                <ReferenceArea
                  x1={criticalWindow.startHour}
                  x2={criticalWindow.endHour}
                  fill={ZONE_COLORS.critico}
                  fillOpacity={0.2}
                  stroke={ZONE_COLORS.critico}
                  strokeOpacity={0.5}
                />
              )}

              {/* Linhas de limiar — sem rótulo de texto embutido (a legenda acima do
                  gráfico já explica cada cor); texto dentro do SVG era o que causava
                  a deformação em telas estreitas. */}
              <ReferenceLine y={THRESHOLDS.baixo} stroke={ZONE_COLORS.baixo} strokeDasharray="4 3" />
              <ReferenceLine y={THRESHOLDS.atencao} stroke={ZONE_COLORS.alto} strokeDasharray="4 3" />
              <ReferenceLine y={THRESHOLDS.alto} stroke={ZONE_COLORS.critico} strokeDasharray="4 3" />

              <Area
                type="monotone"
                dataKey="windGustKmh"
                stroke="#F5F7FA"
                strokeWidth={1.5}
                fill="url(#windRiskGradient)"
                fillOpacity={0.22}
              />

              {/* Palavras de zona direto na faixa de cor — pra quem bater o olho já
                  entender o gráfico sem precisar olhar a legenda em separado.
                  x=8 alinha exatamente com os números "km" do eixo. OPERANDO fica
                  afastada da linha verde (dentro da própria zona); ALERTA e RISCO DE
                  INTERRUPÇÃO ficam ACIMA de suas linhas (dentro da própria zona que
                  representam), com espaço suficiente pra não colidir com o número "km"
                  vizinho. Opacidade reduzida (0.75) — reforço visual leve, não "manchete". */}
              <text x={8} y={valueToY(THRESHOLDS.baixo - 6)} fontSize={9} fontWeight={600} fill="#F5F7FA" fillOpacity={0.75} textAnchor="start">
                OPERANDO
              </text>
              <text x={8} y={valueToY(THRESHOLDS.atencao + 5)} fontSize={9} fontWeight={600} fill="#F5F7FA" fillOpacity={0.75} textAnchor="start">
                ALERTA
              </text>
              <text x={8} y={valueToY(THRESHOLDS.alto + 5)} fontSize={9} fontWeight={600} fill="#F5F7FA" fillOpacity={0.75} textAnchor="start">
                RISCO DE INTERRUPÇÃO
              </text>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legenda movida para abaixo do gráfico — antes ficava no cabeçalho, disputando
          espaço visual com o título; texto expandido para deixar explícito que a
          faixa se refere à intensidade da rajada de vento. */}
      <div className="mt-4 flex flex-col gap-1.5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: ZONE_COLORS.baixo }} />
          <span className="text-mist-300">Operando com rajadas até {THRESHOLDS.baixo}km/h</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: ZONE_COLORS.alto }} />
          <span className="text-mist-300">Alerta com rajadas até {THRESHOLDS.atencao}km/h</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: ZONE_COLORS.critico }} />
          <span className="text-mist-300">Risco de Interrupção com rajadas acima de {THRESHOLDS.alto}km/h</span>
        </span>
      </div>
    </div>
  );
}
