import { NextRequest, NextResponse } from "next/server";
import { computeAdminSessionToken } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ error: "Admin não configurado." }, { status: 503 });
  }

  // Bug real de segurança corrigido: só havia um delay fixo de 300ms, que não
  // impede brute-force de verdade (um script com uns poucos processos em paralelo
  // ainda tentaria milhares de senhas por hora). 5 tentativas por IP a cada 5min é
  // suficiente pra alguém digitar errado algumas vezes, mas encarece muito um
  // ataque de força bruta real.
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (body.username !== expectedUser || body.password !== expectedPassword) {
    // Delay pequeno e fixo — não elimina timing attack, mas encarece um brute-force
    // trivial feito por script sem paralelismo. Não substitui rate limiting real.
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = await computeAdminSessionToken(expectedPassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h — força re-login periódico em vez de sessão eterna
  });
  return response;
}
