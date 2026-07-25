import { OfficialQueueStatus, OfficialStatus } from "@/types";
import clsx from "clsx";

const STATUS_META: Record<OfficialStatus["status"], { label: string; color: string; dot: string }> = {
  operando: { label: "Operando", color: "text-signal-low", dot: "bg-signal-low" },
  parcial: { label: "Operação Parcial", color: "text-signal-watch", dot: "bg-signal-watch" },
  interrompida: { label: "Interrompida", color: "text-signal-critical", dot: "bg-signal-critical" },
};

export function StatusPanel({
  status,
  queueStatus,
}: {
  status: OfficialStatus | null;
  queueStatus?: OfficialQueueStatus | null;
}) {
  const meta = status ? STATUS_META[status.status] : null;

  return (
    <div className="glass-panel flex flex-col justify-between p-6">
      <div>
        <p className="eyebrow">Status Oficial</p>
        <div className="mt-3 flex items-center gap-2.5">
          <span className={clsx("h-2.5 w-2.5 rounded-full", meta?.dot, meta && "animate-pulseRing")} />
          <span className={clsx("font-display text-2xl font-semibold", meta?.color ?? "text-mist-500")}>
            {meta?.label ?? "Carregando..."}
          </span>
        </div>
        {status?.reason && (
          <p className="mt-2 text-sm text-mist-500">{status.reason}</p>
        )}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="eyebrow">Tempo de Espera</p>
          <div className="mt-2 flex items-baseline gap-6">
            <div>
              <span className="font-mono text-3xl font-bold text-mist-100">
                {queueStatus?.waitTimeSaoSebastiaoMin ?? "—"}
              </span>
              <span className="ml-1 text-sm text-mist-500">min</span>
              <p className="text-xs text-mist-500">São Sebastião</p>
            </div>
            <div>
              <span className="font-mono text-3xl font-bold text-mist-100">
                {queueStatus?.waitTimeIlhabelaMin ?? "—"}
              </span>
              <span className="ml-1 text-sm text-mist-500">min</span>
              <p className="text-xs text-mist-500">Ilhabela</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-6 text-xs text-mist-500">
        Fonte: {status?.updatedBy === "api-oficial" ? status.source ?? "API oficial" : "Atualização manual do administrador"}
        {status?.updatedAt && (
          <> · {new Date(status.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>
        )}
      </p>
    </div>
  );
}
