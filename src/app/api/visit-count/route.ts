import { NextRequest, NextResponse } from "next/server";
import { incrementVisitCount, getVisitCount } from "@/firebase/firestore";
import { logError } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Contador de acessos — agora vive no Firestore (ver `firebase/firestore.ts`), não
 * mais em arquivo local. Um usuário relatou o contador zerando após precisar apagar
 * toda a pasta do projeto na Hostinger durante uma investigação de cache; como o
 * Firestore vive fora dessa pasta, sobrevive a qualquer redeploy, mesmo "apagar tudo
 * e subir do zero". Sem Firebase configurado, cai para contagem em memória (reseta
 * a cada reinício do processo — mesmo comportamento já usado em outras partes do
 * projeto, como o histórico de alertas regionais).
 */

export async function GET() {
  const count = await getVisitCount();
  return NextResponse.json({ count });
}

export async function POST(request: NextRequest) {
  // Bug real de segurança corrigido: não havia nenhum limite — um script simples
  // podia inflar o contador indefinidamente. 1 incremento por IP a cada 15s é
  // generoso pra uma visita real (ninguém recarrega a página várias vezes por
  // segundo por acidente), mas barra abuso trivial.
  const ip = getClientIp(request);
  if (!checkRateLimit(`visit-count:${ip}`, 1, 15_000)) {
    const count = await getVisitCount().catch(() => 0);
    return NextResponse.json({ count });
  }

  try {
    const count = await incrementVisitCount();
    return NextResponse.json({ count });
  } catch (err) {
    logError("visitCount", err);
    const count = await getVisitCount().catch(() => 0);
    return NextResponse.json({ count });
  }
}
