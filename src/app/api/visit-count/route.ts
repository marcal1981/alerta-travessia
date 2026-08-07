import { NextRequest, NextResponse } from "next/server";
import { incrementVisitCount, getVisitCount } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import { logError } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Contador de acessos — vive no Firestore (ver `firebase/firestore.ts`), não em
 * arquivo local. Um usuário relatou o contador zerando após precisar apagar toda a
 * pasta do projeto na Hostinger durante uma investigação de cache; como o Firestore
 * vive fora dessa pasta, sobrevive a qualquer redeploy, mesmo "apagar tudo e subir do
 * zero". Sem Firebase configurado, cai para contagem em memória (reseta a cada
 * reinício do processo, o que inclui todo deploy) — `persisted` no retorno expõe esse
 * estado pro Admin, em vez de deixar o reset acontecer silenciosamente sem explicação.
 */

export async function GET() {
  const count = await getVisitCount();
  return NextResponse.json({ count, persisted: isFirebaseConfigured() });
}

export async function POST(request: NextRequest) {
  // Bug real de segurança corrigido: não havia nenhum limite — um script simples
  // podia inflar o contador indefinidamente. 1 incremento por IP a cada 15s é
  // generoso pra uma visita real (ninguém recarrega a página várias vezes por
  // segundo por acidente), mas barra abuso trivial.
  const ip = getClientIp(request);
  const persisted = isFirebaseConfigured();
  if (!checkRateLimit(`visit-count:${ip}`, 1, 15_000)) {
    const count = await getVisitCount().catch(() => 0);
    return NextResponse.json({ count, persisted });
  }

  try {
    const count = await incrementVisitCount();
    return NextResponse.json({ count, persisted });
  } catch (err) {
    logError("visitCount", err);
    const count = await getVisitCount().catch(() => 0);
    return NextResponse.json({ count, persisted });
  }
}
