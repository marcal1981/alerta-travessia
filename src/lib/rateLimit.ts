/**
 * Rate limiter simples em memória, por chave (normalmente IP).
 *
 * LIMITAÇÃO CONHECIDA: o estado vive na memória do processo Node. Funciona bem pra
 * esta hospedagem (uma instância Node só, na Hostinger), mas não protegeria contra
 * abuso distribuído entre múltiplas instâncias, e reseta a cada reinício do processo.
 * Suficiente pra impedir um script simples de martelar um endpoint; não é defesa
 * contra um ataque distribuído de verdade — isso exigiria um store compartilhado
 * (Redis, Firestore) se algum dia for necessário.
 */
const hits = new Map<string, number[]>();

/** true = permitido, false = limitado. `windowMs` é a janela deslizante em ms. */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    hits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Limpeza oportunista pra não crescer sem limite com IPs que só aparecem 1x.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > windowMs)) hits.delete(k);
    }
  }

  return true;
}

/** IP do cliente a partir dos headers — Hostinger/proxies costumam setar
 * x-forwarded-for; sem isso, cai num valor fixo (rate limit vira global, não por
 * IP, mas ainda impede abuso ilimitado). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
