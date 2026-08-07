import { NextRequest, NextResponse } from "next/server";
import { computeAdminSessionToken } from "@/lib/adminAuth";

/**
 * Protege /admin com um cookie de sessão (login por formulário em /admin/login),
 * em vez de HTTP Basic Auth.
 *
 * BUG REAL CORRIGIDO: a versão anterior usava HTTP Basic Auth, que devolve
 * `401 + WWW-Authenticate` — isso faz o PRÓPRIO NAVEGADOR abrir um popup nativo de
 * login. O problema: o menu tem um `<Link href="/admin">`, e o Next.js faz prefetch
 * automático de todo link visível na tela — então o popup aparecia pra QUALQUER
 * visitante da página inicial, sem ele nunca ter clicado em "Admin". Redirect (em
 * vez de 401 com WWW-Authenticate) não dispara esse popup do navegador.
 *
 * DECISÃO MANTIDA: sem ADMIN_PASSWORD configurada, o acesso fica bloqueado por
 * padrão (falha segura), não aberto.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A própria página de login (e a API que ela chama) não pode exigir sessão —
  // senão ninguém consegue logar (loop de redirect).
  if (pathname === "/admin/login" || pathname === "/api/admin-login") {
    return NextResponse.next();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return new NextResponse(
      "Painel administrativo desabilitado: defina ADMIN_PASSWORD nas variáveis de ambiente para liberar o acesso.",
      { status: 503 }
    );
  }

  const cookie = request.cookies.get("admin_session")?.value;
  const expectedToken = cookie ? await computeAdminSessionToken(expectedPassword) : null;

  if (cookie && expectedToken && cookie === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
