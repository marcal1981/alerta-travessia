import { NextResponse } from "next/server";
import { OfficialQueueStatus } from "@/types";

/**
 * Rota de servidor que busca a página oficial do Departamento Hidroviário (Semil) e
 * extrai o tempo de espera da travessia São Sebastião-Ilhabela.
 *
 * IMPORTANTE: isso é feito no servidor (Next.js Route Handler), não no navegador,
 * porque a página do governo provavelmente não libera CORS para chamadas diretas do
 * navegador do usuário. Rodar no servidor evita esse bloqueio.
 *
 * LIMITAÇÃO CONHECIDA (documentada, não escondida): não existe uma API JSON oficial e
 * documentada para este dado — isto funciona lendo o texto (HTML) da página pública,
 * que pode mudar de estrutura a qualquer momento sem aviso. Se o Departamento
 * Hidroviário mudar o layout do site, esta extração pode parar de funcionar até ser
 * ajustada. Por isso este endpoint sempre retorna algo utilizável mesmo em caso de
 * falha (nulls + `source: "unavailable"`), nunca lança erro pro cliente.
 *
 * PRÓXIMO PASSO IDEAL: pedir ao DH acesso oficial a um endpoint estável (JSON), em vez
 * de depender de leitura de HTML — isso é um ótimo item concreto pra propor na
 * conversa institucional com a Semil.
 */

const OFFICIAL_PAGE_URL =
  "https://semil.sp.gov.br/travessias/travessias-automoveis/sao-sebastiao-ilhabela/";

export const revalidate = 60; // cache de 60s no servidor, evita sobrecarregar o site do governo

export async function GET() {
  try {
    const res = await fetch(OFFICIAL_PAGE_URL, {
      headers: { "User-Agent": "AlertaTravessiaIA/1.0 (+monitoramento informativo)" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(unavailableStatus(), { status: 200 });
    }

    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Padrão observado: "Tempo de Espera 30 minutos" aparece uma vez por terminal,
    // na ordem São Sebastião, depois Ilhabela.
    const waitMatches = [...text.matchAll(/Tempo de Espera\s+(\d+)\s+minutos?/gi)];
    const waitTimeSaoSebastiaoMin = waitMatches[0] ? Number(waitMatches[0][1]) : null;
    const waitTimeIlhabelaMin = waitMatches[1] ? Number(waitMatches[1][1]) : null;

    // Padrão observado no resumo do topo: "SÃO SEBASTIÃO 30 min ... ILHABELA 30 min ... 3"
    // (o último número é a quantidade de balsas em operação nesta travessia)
    const summaryMatch = text.match(
      /SÃO SEBASTIÃO\s+(\d+)\s*min[\s\S]{0,80}?ILHABELA\s+(\d+)\s*min[\s\S]{0,20}?(\d+)/i
    );
    const ferriesInOperation = summaryMatch ? Number(summaryMatch[3]) : null;

    const systemUnstableWarning = /instabilidade/i.test(text);

    const status: OfficialQueueStatus = {
      waitTimeSaoSebastiaoMin,
      waitTimeIlhabelaMin,
      ferriesInOperation,
      systemUnstableWarning,
      fetchedAt: new Date().toISOString(),
      source: "semil-scrape",
    };

    return NextResponse.json(status);
  } catch (err) {
    console.error("Falha ao ler a página oficial do DH:", err);
    return NextResponse.json(unavailableStatus(), { status: 200 });
  }
}

function unavailableStatus(): OfficialQueueStatus {
  return {
    waitTimeSaoSebastiaoMin: null,
    waitTimeIlhabelaMin: null,
    ferriesInOperation: null,
    systemUnstableWarning: false,
    fetchedAt: new Date().toISOString(),
    source: "unavailable",
  };
}
