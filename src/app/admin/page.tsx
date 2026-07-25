"use client";

import { useEffect, useState } from "react";
import { DEFAULT_WEIGHTS } from "@/services/riskEngine";
import { WEATHER_SOURCES } from "@/services/weatherService";
import { listRegionalAlertLog, RegionalAlertLogEntry } from "@/firebase/firestore";
import { AlgorithmWeights, OperationalStatus } from "@/types";

/**
 * Painel Admin — Fase 1.
 * Cobre os módulos pedidos no brief que fazem sentido sem um backend de autenticação
 * real ainda conectado: Status Oficial (manual), Pesos do Algoritmo e Integrações/APIs.
 * Usuários, Alertas (cadastro) e Logs dependem de Firebase Auth + Firestore configurados
 * (ver src/firebase/config.ts) — a estrutura de dados já existe em src/types/index.ts,
 * faltando apenas ligar esta tela às coleções reais quando o projeto Firebase existir.
 */
export default function AdminPage() {
  const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [status, setStatus] = useState<OperationalStatus>("operando");
  const [reason, setReason] = useState("");
  const [regionalLog, setRegionalLog] = useState<RegionalAlertLogEntry[]>([]);

  useEffect(() => {
    listRegionalAlertLog().then(setRegionalLog);
  }, []);

  const weightFields: { key: keyof AlgorithmWeights; label: string }[] = [
    { key: "windSpeed", label: "Velocidade do vento" },
    { key: "windGust", label: "Rajadas" },
    { key: "waveHeight", label: "Altura das ondas" },
    { key: "wavePeriod", label: "Período das ondas" },
    { key: "visibility", label: "Visibilidade" },
    { key: "precipitation", label: "Precipitação" },
    { key: "officialAlertBoost", label: "Alerta meteorológico oficial vigente" },
    { key: "fogBoost", label: "Nevoeiro/neblina detectado (causa histórica dominante)" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-mist-100">Painel Administrativo</h1>
      <p className="mt-1 text-sm text-mist-500">
        Alterações aqui não são persistidas nesta demonstração (sem Firebase configurado).
      </p>

      <section className="glass-panel mt-8 p-6">
        <p className="eyebrow">Status Oficial da Travessia</p>
        <p className="mt-1 text-xs text-mist-500">
          Módulo independente da previsão do MPT — nunca misturar com o Índice de Risco.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["operando", "parcial", "interrompida"] as OperationalStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                status === s
                  ? "border-tide bg-tide/10 text-tide"
                  : "border-white/10 text-mist-500 hover:text-mist-100"
              }`}
            >
              {s === "operando" ? "Operando" : s === "parcial" ? "Operação Parcial" : "Interrompida"}
            </button>
          ))}
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (opcional)"
          className="mt-4 w-full rounded-lg border border-white/10 bg-navy-900/60 px-4 py-2 text-sm text-mist-100 placeholder:text-mist-700"
        />
      </section>

      <section className="glass-panel mt-6 p-6">
        <p className="eyebrow">Pesos do Algoritmo (MPT)</p>
        <div className="mt-4 space-y-4">
          {weightFields.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist-300">{f.label}</span>
                <span className="font-mono text-mist-500">{weights[f.key].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.01}
                value={weights[f.key]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [f.key]: parseFloat(e.target.value) }))
                }
                className="mt-1 w-full accent-tide"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel mt-6 p-6">
        <p className="eyebrow">Integrações e APIs</p>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {WEATHER_SOURCES.map((source) => (
            <li key={source.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-mist-300">{source.label}</span>
              <span
                className={
                  source.configured ? "text-signal-low" : "text-mist-700"
                }
              >
                {source.configured ? "Conectado" : "Não configurado"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel mt-6 p-6">
        <p className="eyebrow">Histórico de Alertas Regionais (Santos/Paraty/Oceano)</p>
        <p className="mt-1 text-xs text-mist-500">
          Coleta de dados pra futura auto-calibração — ainda sem ajuste automático (Etapa
          1). Perde-se ao recarregar até o Firebase estar configurado.
        </p>
        {regionalLog.length === 0 ? (
          <p className="mt-4 text-sm text-mist-500">Nenhum alerta registrado ainda nesta sessão.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-mist-500">
                  <th className="pb-2 pr-4">Detectado em</th>
                  <th className="pb-2 pr-4">Origem</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4">ETA</th>
                  <th className="pb-2 pr-4">Confiança</th>
                  <th className="pb-2">IRT no momento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {regionalLog.map((entry, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-mist-300">
                      {new Date(entry.detectedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-4 text-mist-300">{entry.sourceLabel}</td>
                    <td className="py-2 pr-4 text-mist-300">
                      {entry.type === "chuva_forte" ? "Chuva forte" : "Vento forte / mar agitado"}
                    </td>
                    <td className="py-2 pr-4 font-mono text-mist-300">{entry.etaHours}h</td>
                    <td className="py-2 pr-4 text-mist-300">{entry.confidence}</td>
                    <td className="py-2 font-mono text-mist-300">{entry.riskIndexAtDetection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-panel mt-6 p-6">
        <p className="eyebrow">Usuários, Alertas cadastrados e Logs</p>
        <p className="mt-3 text-sm text-mist-500">
          Disponível assim que a autenticação (Firebase Auth) e o Firestore estiverem
          configurados em produção. As coleções e tipos já estão definidos em{" "}
          <code className="font-mono text-mist-300">src/types/index.ts</code> e{" "}
          <code className="font-mono text-mist-300">src/firebase/firestore.ts</code>.
        </p>
      </section>
    </div>
  );
}
