/**
 * Utilitários de data/hora no fuso de São Paulo.
 *
 * BUG REAL RECORRENTE que este arquivo existe pra evitar: `new Date().toISOString()`
 * sempre converte para UTC. Como o Brasil está 3h atrás, a partir das 21h no horário
 * de São Paulo a data/hora em UTC já "virou" — qualquer código que use
 * `toISOString().slice(...)` pra comparar contra uma série horária que a API já
 * devolve no fuso de SP (`timezone=America/Sao_Paulo`) vai comparar hora errada a
 * partir das 21h, e em alguns casos (busca por `startsWith`) simplesmente nunca bater,
 * caindo silenciosamente num índice de fallback errado.
 *
 * Encontrado repetido em 4 lugares (openMeteoProvider, regionalWatchService,
 * forecastSnapshotService, timelineForecastService) — centralizado aqui pra corrigir
 * uma vez só e não reintroduzir o mesmo bug num quinto lugar no futuro.
 */

/** Data de hoje no fuso de São Paulo, formato "YYYY-MM-DD". */
export function getSaoPauloDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  return `${map.year}-${map.month}-${map.day}`;
}

/** Data+hora de agora no fuso de São Paulo, formato "YYYY-MM-DDTHH" — para comparar
 * contra séries horárias de APIs que já retornam horário local (ex. Open-Meteo com
 * `timezone=America/Sao_Paulo`). */
export function getSaoPauloHourString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  // Intl pode devolver "24" à meia-noite em algumas implementações — normaliza pra "00".
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}`;
}

/** Hora atual (0-23) no fuso de São Paulo. */
export function getSaoPauloCurrentHour(date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).format(date);
  // Intl pode devolver "24" à meia-noite em algumas implementações — normaliza pra 0.
  return Number(hour) % 24;
}

/** Data de hoje formatada para exibição (ex. "Sáb, 01/08"), no fuso de São Paulo. */
export function getSaoPauloDisplayDate(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" })
    .format(date)
    .replace(".", "");
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const [year, month, day] = getSaoPauloDateString(date).split("-");
  return `${capitalizedWeekday}, ${day}/${month}`;
}
