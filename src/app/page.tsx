"use client";

import { CamerasPanel } from "@/components/CamerasPanel";
import { useCrossingRisk } from "@/hooks/useCrossingRisk";
import { StatusPanel } from "@/components/StatusPanel";
import { RiskGauge } from "@/components/RiskGauge";
import { PredictiveTimelineChart } from "@/components/PredictiveTimelineChart";
import { WeatherPanel } from "@/components/WeatherPanel";
import { TruckSchedulePanel } from "@/components/TruckSchedulePanel";

export default function HomePage() {
  const { weather, mpt, officialStatus, queueStatus, loading, error } = useCrossingRisk();

  /**
   * Observação prática (ainda não confirmada em documento oficial, tratada aqui como
   * heurística, não regra oficial confirmada): o Departamento Hidroviário parece
   * zerar o tempo de espera dos dois lados (0min/0min) quando a travessia está de
   * fato PARADA — não quando está fluindo sem fila. Sem essa checagem, o medidor de
   * risco (calculado só com dado meteorológico) podia mostrar "Operando" mesmo com a
   * travessia interrompida de verdade, porque ele nunca olhava pro tempo de espera.
   *
   * Se algum dia aparecer um contra-exemplo (0min/0min num dia de operação normal,
   * sem fila), esta regra precisa ser revista — está documentada aqui de propósito
   * pra facilitar essa revisão futura.
   */
  const isLikelyStopped =
    queueStatus?.waitTimeSaoSebastiaoMin === 0 && queueStatus?.waitTimeIlhabelaMin === 0;
  const displayedRiskIndex = isLikelyStopped ? 100 : mpt?.riskIndex;

  // Mesma sobreposição aplicada ao Status Oficial exibido — sem isso, o painel podia
  // dizer "Operando" (valor manual do Admin, nunca atualizado sozinho) ao mesmo tempo
  // que o medidor de risco já mostrava "Risco de Interrupção", uma contradição visível
  // que um usuário real reportou. Não altera o valor real guardado no Admin, só o que
  // é mostrado nesta tela quando esse sinal forte está presente.
  const displayedOfficialStatus =
    isLikelyStopped && officialStatus
      ? {
          ...officialStatus,
          status: "interrompida" as const,
          reason: "Tempo de espera zerado nos dois lados (Departamento Hidroviário)",
        }
      : officialStatus;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {error && <p className="mb-4 text-sm text-signal-critical">{error}</p>}

      <div className="mb-6 flex items-center gap-2 rounded-md border border-signal-watch/20 bg-signal-watch/5 px-3 py-1.5 text-[11px] text-mist-300">
        <span className="h-1 w-1 shrink-0 rounded-full bg-signal-watch" />
        Estimativa de IA — não substitui o comunicado oficial do Departamento Hidroviário.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusPanel status={displayedOfficialStatus} queueStatus={queueStatus} />
        <div className="instrument-panel flex flex-col items-center justify-center p-4 lg:col-span-2">
          {displayedRiskIndex != null ? (
            <RiskGauge index={displayedRiskIndex} />
          ) : (
            <p className="text-sm text-mist-500">Calculando índice de risco…</p>
          )}
          {isLikelyStopped && (
            <p className="mt-2 text-center text-xs text-signal-critical">
              Tempo de espera zerado nos dois lados — sinal de travessia interrompida
              (Departamento Hidroviário), sobrepondo o cálculo meteorológico.
            </p>
          )}
        </div>
      </div>

      <section className="mt-6">
        <PredictiveTimelineChart />
      </section>

      {/* Box independente do texto do Motor Preditivo (MPT) — fixada logo abaixo
          da Linha do Tempo, separada do cabeçalho do gráfico. */}
      {mpt?.explanation && (
        <section className="mt-4">
          <div className="glass-panel p-4">
            <p className="text-sm text-mist-300">{mpt.explanation}</p>
          </div>
        </section>
      )}

      <section className="mt-6">
        <WeatherPanel reading={weather} />
      </section>

      {/* Movido pra home de propósito: o menu de navegação fica completamente
          escondido no celular (classe `hidden ... md:flex`, sem menu hambúrguer
          substituindo) — então quem acessa pelo celular nunca conseguia chegar em
          /caminhoes de outra forma. Isso resolve o problema de raiz pro
          caminhoneiro, em vez de depender de um menu que não aparece nessa tela. */}
      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-mist-100">
          Janela de Embarque para Caminhões
        </h2>
        <div className="mt-4">
          <TruckSchedulePanel />
        </div>
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
