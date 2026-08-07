import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  increment,
  getFirestore,
  limit,
  orderBy,
  query,
  getDocs,
} from "firebase/firestore";
import { ForecastSnapshot, HistoryEntry, IncomingSystem } from "@/types";
import { getFirebaseApp } from "./config";

/**
 * Camada de acesso ao Firestore para o histórico de travessias, alertas regionais e
 * retratos de previsão.
 *
 * Enquanto o Firebase não estiver configurado (ver config.ts), estas funções operam
 * sobre um array em memória — suficiente para desenvolver e demonstrar sem depender
 * de credenciais reais. Quando configurado, gravam e leem do Firestore de verdade.
 */

let memoryHistory: HistoryEntry[] = [];

export async function listHistory(): Promise<HistoryEntry[]> {
  const app = getFirebaseApp();
  if (!app) return memoryHistory;

  const db = getFirestore(app);
  const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as HistoryEntry);
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    memoryHistory = [entry, ...memoryHistory];
    return;
  }
  const db = getFirestore(app);
  await addDoc(collection(db, "history"), entry);
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
  const db = getFirestore(app);
  await addDoc(collection(db, "regional_alert_log"), entry);
}

export async function listRegionalAlertLog(): Promise<RegionalAlertLogEntry[]> {
  const app = getFirebaseApp();
  if (!app) return memoryRegionalAlertLog;

  const db = getFirestore(app);
  const q = query(collection(db, "regional_alert_log"), orderBy("detectedAt", "desc"), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as RegionalAlertLogEntry);
}

/**
 * Retratos da previsão horária, guardados ao longo do tempo — a base real pra medir
 * "quão precisa é a previsão feita X horas antes", comparando cada retrato com o que
 * de fato aconteceu depois (ver `forecastSnapshotService.ts` para a lógica de captura).
 *
 * LIMITAÇÃO HONESTA: sem o Firebase configurado, isto se perde a cada recarregamento
 * de página — ou seja, na prática só acumula dado de verdade útil depois que o
 * Firebase estiver configurado e em uso constante. O código já está pronto pra isso;
 * só falta a configuração real (`src/firebase/config.ts`).
 */
let memoryForecastSnapshots: ForecastSnapshot[] = [];

export async function logForecastSnapshot(snapshot: ForecastSnapshot): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    memoryForecastSnapshots = [snapshot, ...memoryForecastSnapshots].slice(0, 200);
    return;
  }
  const db = getFirestore(app);
  await addDoc(collection(db, "forecast_snapshots"), snapshot);
}

export async function listForecastSnapshots(): Promise<ForecastSnapshot[]> {
  const app = getFirebaseApp();
  if (!app) return memoryForecastSnapshots;

  const db = getFirestore(app);
  const q = query(collection(db, "forecast_snapshots"), orderBy("fetchedAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ForecastSnapshot);
}

/**
 * Contador de acessos — migrado de arquivo local para Firestore (quando configurado).
 *
 * Motivo real da migração: um usuário reportou que o contador zerava depois de
 * atualizações que exigiam apagar toda a pasta do projeto na Hostinger antes de
 * extrair os arquivos novos (necessário durante uma investigação de cache) — como o
 * contador vivia num arquivo dentro dessa mesma pasta, ele se perdia junto. O
 * Firestore vive fora da pasta do projeto, então sobrevive a qualquer redeploy,
 * mesmo um "apagar tudo e subir do zero".
 *
 * `increment()` do Firestore garante que dois acessos simultâneos nunca se percam um
 * ao contar o outro por cima (incremento atômico no servidor, não "lê, soma, grava"
 * no cliente, que teria essa falha de concorrência).
 */
let memoryVisitCount = 0;

export async function incrementVisitCount(): Promise<number> {
  const app = getFirebaseApp();
  if (!app) {
    memoryVisitCount += 1;
    return memoryVisitCount;
  }
  const db = getFirestore(app);
  const ref = doc(db, "meta", "visit_count");
  await setDoc(ref, { count: increment(1) }, { merge: true });
  const snap = await getDoc(ref);
  return (snap.data()?.count as number) ?? 0;
}

export async function getVisitCount(): Promise<number> {
  const app = getFirebaseApp();
  if (!app) return memoryVisitCount;

  const db = getFirestore(app);
  const ref = doc(db, "meta", "visit_count");
  const snap = await getDoc(ref);
  return (snap.data()?.count as number) ?? 0;
}
