/**
 * Logger centralizado. Hoje só encaminha pro console, mas concentra num lugar só
 * onde plugar um serviço de monitoramento real (Sentry, Logtail etc.) no futuro —
 * sem precisar caçar e trocar `console.error` espalhado em 9 arquivos diferentes.
 *
 * Mantém os erros no console de propósito (não silencia): num app sem serviço de
 * monitoramento externo ainda, o log do servidor é a única visibilidade real que
 * existe quando algo falha em produção.
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
