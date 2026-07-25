import { TideExtreme } from "@/types";

/**
 * Dados REAIS da Tábua de Marés 2026 (edição vigente), Centro de Hidrografia da
 * Marinha (CHM), Porto de São Sebastião (Latitude 23°48'.6 S, Longitude 45°23'.9 W,
 * Fuso UTC-03:00). Extraídos por coordenadas de texto do PDF oficial (não por leitura
 * visual), cobrindo 21 a 27 de julho de 2026.
 *
 * LIMITAÇÃO ATUAL: cobre só essa janela de dias, não o ano inteiro — fora desse
 * intervalo, `tideService.ts` retorna `null` em vez de inventar um valor.
 *
 * Para cobrir o ano todo: repetir o mesmo processo de extração por coordenadas para
 * os demais meses do PDF (`45_-_PORTO_DE_SÃO_SEBASTIÃO...pdf`, edição 2026, 3 páginas,
 * 4 meses por página) e anexar os pontos ao array abaixo, no mesmo formato.
 */
export const SAMPLE_TIDE_EXTREMES: TideExtreme[] = [
  // 21/jul/2026 (terça-feira)
  { timestamp: "2026-07-21T01:14:00-03:00", heightM: 0.42, kind: "baixa" },
  { timestamp: "2026-07-21T06:31:00-03:00", heightM: 0.93, kind: "alta" },
  { timestamp: "2026-07-21T13:46:00-03:00", heightM: 0.42, kind: "baixa" },
  { timestamp: "2026-07-21T18:27:00-03:00", heightM: 0.81, kind: "alta" },
  // 22/jul/2026 (quarta-feira)
  { timestamp: "2026-07-22T02:06:00-03:00", heightM: 0.42, kind: "baixa" },
  { timestamp: "2026-07-22T07:17:00-03:00", heightM: 0.85, kind: "alta" },
  { timestamp: "2026-07-22T14:29:00-03:00", heightM: 0.52, kind: "baixa" },
  { timestamp: "2026-07-22T19:44:00-03:00", heightM: 0.78, kind: "alta" },
  // 23/jul/2026 (quinta-feira) — hoje
  { timestamp: "2026-07-23T03:02:00-03:00", heightM: 0.42, kind: "baixa" },
  { timestamp: "2026-07-23T09:02:00-03:00", heightM: 0.80, kind: "alta" },
  { timestamp: "2026-07-23T15:57:00-03:00", heightM: 0.57, kind: "baixa" },
  { timestamp: "2026-07-23T20:19:00-03:00", heightM: 0.74, kind: "alta" },
  // 24/jul/2026 (sexta-feira) — dia com só 3 extremos na tábua oficial (normal, ocorre
  // porque o dia lunar tem ~24h50min e um extremo às vezes "escorrega" p/ o dia seguinte)
  { timestamp: "2026-07-24T04:57:00-03:00", heightM: 0.39, kind: "baixa" },
  { timestamp: "2026-07-24T12:01:00-03:00", heightM: 0.83, kind: "alta" },
  { timestamp: "2026-07-24T18:06:00-03:00", heightM: 0.58, kind: "baixa" },
  // 25/jul/2026 (sábado)
  { timestamp: "2026-07-25T00:29:00-03:00", heightM: 0.76, kind: "alta" },
  { timestamp: "2026-07-25T06:01:00-03:00", heightM: 0.31, kind: "baixa" },
  { timestamp: "2026-07-25T12:46:00-03:00", heightM: 0.88, kind: "alta" },
  { timestamp: "2026-07-25T18:59:00-03:00", heightM: 0.53, kind: "baixa" },
];

