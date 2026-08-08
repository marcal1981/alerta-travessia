"use client";

import { useEffect, useState } from "react";
import {
  CROSSING_DIRECTION_LABELS,
  CrossingDirection,
  VEHICLE_CATEGORY_LABELS,
  VehicleCategory,
} from "@/types";
import { evaluateTruckRestriction } from "@/services/truckRestrictionService";
import clsx from "clsx";

const CATEGORIES: VehicleCategory[] = ["leve", "vuc_toco", "tres_eixos", "quatro_mais_eixos"];

export function TruckSchedulePanel() {
  const [direction, setDirection] = useState<CrossingDirection>("para_ilhabela");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Janela de Embarque por Categoria</p>
        <div className="flex gap-2">
          {(Object.keys(CROSSING_DIRECTION_LABELS) as CrossingDirection[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs transition",
                direction === d
                  ? "border-tide bg-tide/10 text-tide"
                  : "border-white/10 text-mist-500 hover:text-mist-100"
              )}
            >
              {CROSSING_DIRECTION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const status = now ? evaluateTruckRestriction(category, direction, now) : null;
          return (
            <div
              key={category}
              className={clsx(
                "rounded-xl border p-4",
                status?.allowed
                  ? "border-signal-low/30 bg-signal-low/5"
                  : "border-signal-critical/30 bg-signal-critical/5"
              )}
            >
              <p className="text-sm font-medium text-mist-100">{VEHICLE_CATEGORY_LABELS[category]}</p>
              <p
                className={clsx(
                  "mt-2 font-display text-lg font-semibold",
                  status?.allowed ? "text-signal-low" : "text-signal-critical"
                )}
              >
                {!status ? "…" : status.allowed ? "Liberado" : "Restrito"}
              </p>
              {status && status.reasons.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {status.reasons.map((reason) => (
                    <li key={reason} className="text-xs text-mist-500">
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
              {/* Aviso de PBT máximo movido pra dentro do card da categoria que ele
                  realmente afeta (4+ eixos é a única que costuma aproximar desse
                  limite) — antes vivia numa box própria genérica ("Limite sempre
                  válido"), aplicada visualmente a todas as categorias por igual. */}
              {category === "quatro_mais_eixos" && (
                <p className="mt-2 text-xs text-mist-500">Proibido acima de 40t (PBT).</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-lg border border-white/[0.06] bg-navy-900/60 p-3 text-xs leading-relaxed text-mist-500">
        Baseado na Resolução Semil nº 79/2023 e na maré medida agora. Antes de despachar
        cargas, confirme no canal oficial (0800 77 33 711).
      </p>
    </div>
  );
}
