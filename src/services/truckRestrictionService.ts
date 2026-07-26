import {
  CrossingDirection,
  LOW_TIDE_TRUCK_RESTRICTION_M,
  TruckRestrictionStatus,
  VehicleCategory,
} from "@/types";
import { getTideAt } from "./tideService";

/**
 * Motor de regras de restrição a caminhões — Resolução Semil nº 79/2023.
 *
 * IMPORTANTE: isto é uma regra FIXA da lei, não uma estimativa de IA. Por isso vive
 * num serviço separado do `riskEngine.ts` (MPT) e nunca deve ser misturado com o
 * Índice de Risco — são dois tipos de informação completamente diferentes:
 *   - MPT: "qual a chance de a travessia ser interrompida" (probabilístico)
 *   - Este serviço: "este veículo está autorizado a embarcar agora" (determinístico,
 *     baseado em lei + maré medida)
 *
 * LIMITAÇÃO CONHECIDA (documentada, não escondida): a resolução também muda o horário
 * em vésperas de feriado prolongado e no primeiro dia útil após o feriado. Isso exige
 * um calendário de feriados nacionais/estaduais, que ainda NÃO está implementado aqui.
 * A função abaixo cobre corretamente a semana regular (sem feriados). Ver TODO no
 * final do arquivo para como estender.
 */

interface WeeklyRestrictionWindow {
  /** 0 = domingo, 1 = segunda, ..., 6 = sábado (padrão JS Date.getDay()) */
  dayOfWeek: number;
  startHour: number; // inclusive, 0-23
  endHour: number; // exclusive; 24 = até a meia-noite
  direction: CrossingDirection | "ambos";
}

/**
 * Janelas em que caminhões de 3 eixos são RESTRITOS (fora delas, livres seg-qui).
 * Fonte: Resolução Semil 79/2023.
 */
const TRES_EIXOS_RESTRICTED_WINDOWS: WeeklyRestrictionWindow[] = [
  { dayOfWeek: 5, startHour: 10, endHour: 24, direction: "para_ilhabela" }, // sexta
  { dayOfWeek: 6, startHour: 8, endHour: 16, direction: "para_ilhabela" }, // sábado
  { dayOfWeek: 0, startHour: 8, endHour: 14, direction: "para_ilhabela" }, // domingo
  { dayOfWeek: 5, startHour: 14, endHour: 24, direction: "para_sao_sebastiao" }, // sexta
  { dayOfWeek: 6, startHour: 16, endHour: 24, direction: "para_sao_sebastiao" }, // sábado
  { dayOfWeek: 0, startHour: 10, endHour: 24, direction: "para_sao_sebastiao" }, // domingo
];

/**
 * Janelas em que caminhões de 4+ eixos são RESTRITOS.
 * Fonte: Resolução Semil 79/2023.
 */
const QUATRO_MAIS_EIXOS_RESTRICTED_WINDOWS: WeeklyRestrictionWindow[] = [
  { dayOfWeek: 1, startHour: 6, endHour: 20, direction: "ambos" }, // segunda
  { dayOfWeek: 2, startHour: 6, endHour: 20, direction: "ambos" }, // terça
  { dayOfWeek: 3, startHour: 6, endHour: 20, direction: "ambos" }, // quarta
  { dayOfWeek: 4, startHour: 6, endHour: 20, direction: "ambos" }, // quinta
  { dayOfWeek: 5, startHour: 6, endHour: 24, direction: "ambos" }, // sexta (dia todo)
  { dayOfWeek: 6, startHour: 6, endHour: 20, direction: "ambos" }, // sábado
  { dayOfWeek: 0, startHour: 6, endHour: 20, direction: "ambos" }, // domingo
];

function isWithinWindow(date: Date, direction: CrossingDirection, windows: WeeklyRestrictionWindow[]): boolean {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;

  return windows.some(
    (w) =>
      w.dayOfWeek === day &&
      (w.direction === "ambos" || w.direction === direction) &&
      hour >= w.startHour &&
      hour < w.endHour
  );
}

export function evaluateTruckRestriction(
  category: VehicleCategory,
  direction: CrossingDirection,
  at: Date = new Date()
): TruckRestrictionStatus {
  const reasons: string[] = [];

  if (category === "leve" || category === "vuc_toco") {
    // Sem restrição de horário nem de maré para essas categorias.
    return {
      category,
      direction,
      allowed: true,
      reasons: [],
      checkedAt: at.toISOString(),
    };
  }

  // Restrição de horário, conforme a categoria
  const scheduleWindows =
    category === "tres_eixos" ? TRES_EIXOS_RESTRICTED_WINDOWS : QUATRO_MAIS_EIXOS_RESTRICTED_WINDOWS;

  if (isWithinWindow(at, direction, scheduleWindows)) {
    reasons.push("Restrição de horário (Resolução Semil 79/2023)");
  }

  // Restrição de maré — vale para 3+ eixos, independente de dia/horário
  const tide = getTideAt(at.toISOString());
  if (tide && tide.heightM < LOW_TIDE_TRUCK_RESTRICTION_M) {
    reasons.push(`Maré abaixo de ${LOW_TIDE_TRUCK_RESTRICTION_M}m (${tide.heightM.toFixed(2)}m agora)`);
  }

  return {
    category,
    direction,
    allowed: reasons.length === 0,
    reasons,
    checkedAt: at.toISOString(),
  };
}

// TODO (Fase 2): calendário de feriados nacionais/estaduais de SP, para aplicar as
// janelas estendidas de "véspera de feriado prolongado" e "primeiro dia útil após".
// Sem isso, o app pode mostrar "livre" num dia que na prática está restrito por
// causa de um feriado — por isso este aviso fica também na interface, não só aqui.
