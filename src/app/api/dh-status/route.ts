import { NextResponse } from "next/server";
import { OfficialQueueStatus } from "@/types";
import { logError } from "@/lib/logger";

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

    // Padrão observado no resumo do topo (formato antigo/alternativo):
    // "SÃO SEBASTIÃO 30 min ... ILHABELA 30 min ... 3"
    const summaryMatch = text.match(
      /SÃO SEBASTIÃO\s+(\d+)\s*min[\s\S]{0,80}?ILHABELA\s+(\d+)\s*min[\s\S]{0,20}?(\d+)/i
    );

    // Padrão real observado na página específica da travessia: número por EXTENSO, não
    // dígito — ex: "A frota conta com quatro embarcações em operação". A versão anterior
    // deste código só procurava dígito (\d+), por isso nunca capturava nada aqui.
    const NUMBER_WORDS: Record<string, number> = {
      uma: 1, um: 1, duas: 2, dois: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
      seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
    };
    const fleetMatch = text.match(
      /(\d+|um|uma|dois|duas|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez)\s+embarca[çc][õo]es?\s+em\s+opera[çc][ãa]o/i
    );
    const fleetWord = fleetMatch?.[1]?.toLowerCase();
    const ferriesInOperation = fleetWord
      ? /^\d+$/.test(fleetWord)
        ? Number(fleetWord)
        : NUMBER_WORDS[fleetWord] ?? null
      : summaryMatch
      ? Number(summaryMatch[3])
      : null;

    // Padrão alternativo observado em notícias oficiais da Semil: em vez de contar
    // embarcações, às vezes reportam % da capacidade operacional — ex: "opera com 49%
    // da sua capacidade operacional". Métrica diferente (percentual, não contagem),
    // por isso fica num campo separado — não dá pra converter um no outro sem saber
    // a frota total do dia.
    const capacityMatch = text.match(/opera\s+com\s+(\d+)%\s+da\s+(?:sua\s+)?capacidade\s+operacional/i);
    const capacityPercent = capacityMatch ? Number(capacityMatch[1]) : null;

    const systemUnstableWarning = /instabilidade/i.test(text);

    const status: OfficialQueueStatus = {
      waitTimeSaoSebastiaoMin,
      waitTimeIlhabelaMin,
      ferriesInOperation,
      capacityPercent,
      systemUnstableWarning,
      fetchedAt: new Date().toISOString(),
      source: "semil-scrape",
    };

    return NextResponse.json(status);
  } catch (err) {
    logError("dhStatus", err);
    return NextResponse.json(unavailableStatus(), { status: 200 });
  }
}

function unavailableStatus(): OfficialQueueStatus {
  return {
    waitTimeSaoSebastiaoMin: null,
    waitTimeIlhabelaMin: null,
    ferriesInOperation: null,
    capacityPercent: null,
    systemUnstableWarning: false,
    fetchedAt: new Date().toISOString(),
    source: "unavailable",
  };
}
