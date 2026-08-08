/** Deriva o valor do cookie de sessão do admin a partir da senha configurada, via
 * SHA-256 (Web Crypto — funciona tanto no Edge runtime do middleware quanto na rota
 * de login). O cookie nunca guarda a senha em texto puro; middleware e rota de login
 * recalculam o hash e comparam. */
export async function computeAdminSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`admin-session:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
