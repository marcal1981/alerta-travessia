import { HistoryEntry, IncomingSystem } from "@/types";
import { getFirebaseApp } from "./config";

/**
 * Camada de acesso ao Firestore para o histórico de travessias.
 * Enquanto o Firebase não estiver configurado (ver config.ts), estas funções operam
 * sobre um array em memória — suficiente para desenvolver e demonstrar o dashboard
 * e o painel Admin sem depender de credenciais reais.
 */

let memoryHistory: HistoryEntry[] = [];

export async function listHistory(): Promise<HistoryEntry[]> {
  const app = getFirebaseApp();
  if (!app) {
    return memoryHistory;
  }
  // Fase 2: const db = getFirestore(app); ler coleção "history" ordenada por data/hora.
  return memoryHistory;
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    memoryHistory = [entry, ...memoryHistory];
    return;
  }
  // Fase 2: gravar em Firestore (coleção "history"), disparado pela Cloud Function agendada.
  memoryHistory = [entry, ...memoryHistory];
}

/**
 * Log de alertas antecipados (Santos/Paraty/Oceano) — Etapa 1 da auto-calibração.
 *
 * Aqui só coletamos o dado: quando o `regionalWatchService.ts` detecta um sistema se
 * aproximando, registramos o quê/de onde/ETA previsto. NÃO fazemos nenhum ajuste
 * automático ainda — com histórico zerado, qualquer "calibração" agora seria só ruído.
 *
 * A Etapa 2 (comparar o ETA previsto com o que realmente aconteceu, e ajustar a
 * confiança de cada ponto de referência com base na taxa de acerto real) só faz
 * sentido depois de meses de dado acumulado — e precisa do Firebase configurado de
 * verdade (sem isso, este log se perde a cada recarregamento da página).
 */
export interface RegionalAlertLogEntry extends IncomingSystem {
  detectedAt: string;
  riskIndexAtDetection: number;
}

let memoryRegionalAlertLog: RegionalAlertLogEntry[] = [];

export async function logRegionalAlert(
  system: IncomingSystem,
  riskIndexAtDetection: number
): Promise<void> {
  const entry: RegionalAlertLogEntry = {
    ...system,
    detectedAt: new Date().toISOString(),
    riskIndexAtDetection,
  };
  const app = getFirebaseApp();
  if (!app) {
    memoryRegionalAlertLog = [entry, ...memoryRegionalAlertLog].slice(0, 500);
    return;
  }
  // Fase 2: gravar em Firestore (coleção "regional_alert_log").
  memoryRegionalAlertLog = [entry, ...memoryRegionalAlertLog].slice(0, 500);
}

export async function listRegionalAlertLog(): Promise<RegionalAlertLogEntry[]> {
  return memoryRegionalAlertLog;
}
