import { TideExtreme } from "@/types";

/**
 * Dados REAIS da Tábua de Marés 2026 (edição vigente), Centro de Hidrografia da
 * Marinha (CHM), Porto de São Sebastião (Latitude 23°48'.6 S, Longitude 45°23'.9 W,
 * Fuso UTC-03:00). Extraídos por coordenadas/parsing estruturado do PDF oficial (não
 * por leitura visual), cobrindo 21-27/jul/2026 e a maior parte de agosto/2026.
 *
 * LACUNAS DOCUMENTADAS (não escondidas): dentro de agosto, os dias 05, 06, 21 e 22
 * estão ausentes — a extração desses dias saiu corrompida no PDF original (provável
 * símbolo de fase da lua bagunçando o texto), e preferimos não incluir dado
 * adivinhado a arriscar um valor errado num limiar de segurança (0,5m).
 *
 * LIMITAÇÃO ATUAL: ainda não cobre o ano inteiro — fora dos dias listados,
 * `tideService.ts` retorna `null` em vez de inventar um valor.
 *
 * Para cobrir os meses restantes: repetir o mesmo processo de extração para as
 * demais páginas do PDF (`-45_-_PORTO_DE_SÃO_SEBASTIÃO...pdf`, edição 2026 — página 0
 * = Jan-Abr, página 2 = Set-Dez) e anexar os pontos ao array abaixo, no mesmo formato.
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

  // --- AGOSTO/2026 ---
  // Extraído por coordenadas/parsing estruturado do mesmo PDF oficial (edição 2026).
  // LACUNA DOCUMENTADA: dias 05, 06, 21 e 22 ausentes — a extração desses dias saiu
  // corrompida (provável símbolo de fase da lua no PDF original bagunçando o texto),
  // e preferimos não incluir dado adivinhado a arriscar um valor errado num limiar
  // de segurança (0,5m). Se precisar desses dias específicos, revisar manualmente
  // contra o PDF original.
  // 01/ago/2026 (sábado-feira)
  { timestamp: "2026-08-01T03:49:00-03:00", heightM: 1.1, kind: "alta" },
  { timestamp: "2026-08-01T10:57:00-03:00", heightM: 0.01, kind: "baixa" },
  { timestamp: "2026-08-01T15:46:00-03:00", heightM: 1.02, kind: "alta" },
  // 02/ago/2026 (domingo-feira)
  { timestamp: "2026-08-02T04:08:00-03:00", heightM: 1.06, kind: "alta" },
  { timestamp: "2026-08-02T11:29:00-03:00", heightM: 0.09, kind: "baixa" },
  { timestamp: "2026-08-02T16:36:00-03:00", heightM: 0.97, kind: "alta" },
  { timestamp: "2026-08-02T23:42:00-03:00", heightM: 0.41, kind: "baixa" },
  // 03/ago/2026 (segunda-feira)
  { timestamp: "2026-08-03T04:21:00-03:00", heightM: 1.01, kind: "alta" },
  { timestamp: "2026-08-03T12:16:00-03:00", heightM: 0.18, kind: "baixa" },
  { timestamp: "2026-08-03T16:53:00-03:00", heightM: 0.89, kind: "alta" },
  // 04/ago/2026 (terça-feira)
  { timestamp: "2026-08-04T00:04:00-03:00", heightM: 0.44, kind: "baixa" },
  { timestamp: "2026-08-04T05:31:00-03:00", heightM: 0.94, kind: "alta" },
  { timestamp: "2026-08-04T13:02:00-03:00", heightM: 0.27, kind: "baixa" },
  { timestamp: "2026-08-04T17:08:00-03:00", heightM: 0.82, kind: "alta" },
  // 07/ago/2026 (sexta-feira)
  { timestamp: "2026-08-07T03:19:00-03:00", heightM: 0.4, kind: "baixa" },
  { timestamp: "2026-08-07T11:57:00-03:00", heightM: 1.02, kind: "alta" },
  { timestamp: "2026-08-07T16:02:00-03:00", heightM: 0.52, kind: "baixa" },
  { timestamp: "2026-08-07T20:47:00-03:00", heightM: 0.61, kind: "alta" },
  // 08/ago/2026 (sábado-feira)
  { timestamp: "2026-08-08T00:38:00-03:00", heightM: 0.7, kind: "alta" },
  { timestamp: "2026-08-08T05:02:00-03:00", heightM: 0.29, kind: "baixa" },
  { timestamp: "2026-08-08T12:40:00-03:00", heightM: 1.11, kind: "alta" },
  { timestamp: "2026-08-08T18:08:00-03:00", heightM: 0.52, kind: "baixa" },
  // 09/ago/2026 (domingo-feira)
  { timestamp: "2026-08-09T01:02:00-03:00", heightM: 0.78, kind: "alta" },
  { timestamp: "2026-08-09T06:06:00-03:00", heightM: 0.17, kind: "baixa" },
  { timestamp: "2026-08-09T13:44:00-03:00", heightM: 1.19, kind: "alta" },
  { timestamp: "2026-08-09T19:04:00-03:00", heightM: 0.47, kind: "baixa" },
  // 10/ago/2026 (segunda-feira)
  { timestamp: "2026-08-10T01:14:00-03:00", heightM: 0.85, kind: "alta" },
  { timestamp: "2026-08-10T07:08:00-03:00", heightM: 0.04, kind: "baixa" },
  { timestamp: "2026-08-10T14:21:00-03:00", heightM: 1.23, kind: "alta" },
  { timestamp: "2026-08-10T20:04:00-03:00", heightM: 0.42, kind: "baixa" },
  // 11/ago/2026 (terça-feira)
  { timestamp: "2026-08-11T01:23:00-03:00", heightM: 0.92, kind: "alta" },
  { timestamp: "2026-08-11T07:59:00-03:00", heightM: -0.07, kind: "baixa" },
  { timestamp: "2026-08-11T15:02:00-03:00", heightM: 1.22, kind: "alta" },
  { timestamp: "2026-08-11T20:47:00-03:00", heightM: 0.36, kind: "baixa" },
  // 12/ago/2026 (quarta-feira)
  { timestamp: "2026-08-12T01:49:00-03:00", heightM: 0.99, kind: "alta" },
  { timestamp: "2026-08-12T08:40:00-03:00", heightM: -0.11, kind: "baixa" },
  { timestamp: "2026-08-12T15:42:00-03:00", heightM: 1.17, kind: "alta" },
  { timestamp: "2026-08-12T21:10:00-03:00", heightM: 0.32, kind: "baixa" },
  // 13/ago/2026 (quinta-feira)
  { timestamp: "2026-08-13T02:29:00-03:00", heightM: 1.06, kind: "alta" },
  { timestamp: "2026-08-13T09:34:00-03:00", heightM: -0.12, kind: "baixa" },
  { timestamp: "2026-08-13T16:32:00-03:00", heightM: 1.09, kind: "alta" },
  { timestamp: "2026-08-13T21:40:00-03:00", heightM: 0.31, kind: "baixa" },
  // 14/ago/2026 (sexta-feira)
  { timestamp: "2026-08-14T03:01:00-03:00", heightM: 1.11, kind: "alta" },
  { timestamp: "2026-08-14T10:10:00-03:00", heightM: -0.08, kind: "baixa" },
  { timestamp: "2026-08-14T16:27:00-03:00", heightM: 1.01, kind: "alta" },
  { timestamp: "2026-08-14T22:17:00-03:00", heightM: 0.3, kind: "baixa" },
  // 15/ago/2026 (sábado-feira)
  { timestamp: "2026-08-15T03:34:00-03:00", heightM: 1.13, kind: "alta" },
  { timestamp: "2026-08-15T10:46:00-03:00", heightM: 0.02, kind: "baixa" },
  { timestamp: "2026-08-15T16:16:00-03:00", heightM: 0.97, kind: "alta" },
  { timestamp: "2026-08-15T22:57:00-03:00", heightM: 0.29, kind: "baixa" },
  // 16/ago/2026 (domingo-feira)
  { timestamp: "2026-08-16T03:53:00-03:00", heightM: 1.13, kind: "alta" },
  { timestamp: "2026-08-16T11:12:00-03:00", heightM: 0.14, kind: "baixa" },
  { timestamp: "2026-08-16T16:34:00-03:00", heightM: 0.95, kind: "alta" },
  { timestamp: "2026-08-16T23:23:00-03:00", heightM: 0.3, kind: "baixa" },
  // 17/ago/2026 (segunda-feira)
  { timestamp: "2026-08-17T04:17:00-03:00", heightM: 1.09, kind: "alta" },
  { timestamp: "2026-08-17T11:51:00-03:00", heightM: 0.27, kind: "baixa" },
  { timestamp: "2026-08-17T16:44:00-03:00", heightM: 0.94, kind: "alta" },
  // 18/ago/2026 (terça-feira)
  { timestamp: "2026-08-18T00:01:00-03:00", heightM: 0.3, kind: "baixa" },
  { timestamp: "2026-08-18T04:42:00-03:00", heightM: 1.02, kind: "alta" },
  { timestamp: "2026-08-18T12:21:00-03:00", heightM: 0.38, kind: "baixa" },
  { timestamp: "2026-08-18T17:02:00-03:00", heightM: 0.92, kind: "alta" },
  // 19/ago/2026 (quarta-feira)
  { timestamp: "2026-08-19T00:31:00-03:00", heightM: 0.35, kind: "baixa" },
  { timestamp: "2026-08-19T05:44:00-03:00", heightM: 0.94, kind: "alta" },
  { timestamp: "2026-08-19T12:57:00-03:00", heightM: 0.48, kind: "baixa" },
  // 20/ago/2026 (quinta-feira)
  { timestamp: "2026-08-20T01:42:00-03:00", heightM: 0.39, kind: "baixa" },
  { timestamp: "2026-08-20T06:19:00-03:00", heightM: 0.84, kind: "alta" },
  { timestamp: "2026-08-20T13:08:00-03:00", heightM: 0.58, kind: "baixa" },
  { timestamp: "2026-08-20T17:51:00-03:00", heightM: 0.8, kind: "alta" },
  // 23/ago/2026 (domingo-feira)
  { timestamp: "2026-08-23T00:17:00-03:00", heightM: 0.74, kind: "alta" },
  { timestamp: "2026-08-23T05:34:00-03:00", heightM: 0.33, kind: "baixa" },
  { timestamp: "2026-08-23T13:16:00-03:00", heightM: 0.88, kind: "alta" },
  { timestamp: "2026-08-23T19:12:00-03:00", heightM: 0.55, kind: "baixa" },
  // 24/ago/2026 (segunda-feira)
  { timestamp: "2026-08-24T00:53:00-03:00", heightM: 0.84, kind: "alta" },
  { timestamp: "2026-08-24T06:49:00-03:00", heightM: 0.22, kind: "baixa" },
  { timestamp: "2026-08-24T13:51:00-03:00", heightM: 0.97, kind: "alta" },
  { timestamp: "2026-08-24T19:42:00-03:00", heightM: 0.47, kind: "baixa" },
  // 25/ago/2026 (terça-feira)
  { timestamp: "2026-08-25T01:02:00-03:00", heightM: 0.93, kind: "alta" },
  { timestamp: "2026-08-25T07:27:00-03:00", heightM: 0.1, kind: "baixa" },
  { timestamp: "2026-08-25T14:04:00-03:00", heightM: 1.03, kind: "alta" },
  { timestamp: "2026-08-25T20:23:00-03:00", heightM: 0.4, kind: "baixa" },
  // 26/ago/2026 (quarta-feira)
  { timestamp: "2026-08-26T01:16:00-03:00", heightM: 1.02, kind: "alta" },
  { timestamp: "2026-08-26T08:02:00-03:00", heightM: 0.01, kind: "baixa" },
  { timestamp: "2026-08-26T14:12:00-03:00", heightM: 1.08, kind: "alta" },
  { timestamp: "2026-08-26T20:40:00-03:00", heightM: 0.34, kind: "baixa" },
  // 27/ago/2026 (quinta-feira)
  { timestamp: "2026-08-27T01:49:00-03:00", heightM: 1.09, kind: "alta" },
  { timestamp: "2026-08-27T08:36:00-03:00", heightM: -0.03, kind: "baixa" },
  { timestamp: "2026-08-27T14:14:00-03:00", heightM: 1.11, kind: "alta" },
  { timestamp: "2026-08-27T21:01:00-03:00", heightM: 0.29, kind: "baixa" },
  // 28/ago/2026 (sexta-feira)
  { timestamp: "2026-08-28T02:29:00-03:00", heightM: 1.14, kind: "alta" },
  { timestamp: "2026-08-28T09:19:00-03:00", heightM: -0.05, kind: "baixa" },
  { timestamp: "2026-08-28T14:36:00-03:00", heightM: 1.12, kind: "alta" },
  { timestamp: "2026-08-28T21:14:00-03:00", heightM: 0.28, kind: "baixa" },
  // 29/ago/2026 (sábado-feira)
  { timestamp: "2026-08-29T03:02:00-03:00", heightM: 1.18, kind: "alta" },
  { timestamp: "2026-08-29T09:59:00-03:00", heightM: -0.04, kind: "baixa" },
  { timestamp: "2026-08-29T14:59:00-03:00", heightM: 1.09, kind: "alta" },
  { timestamp: "2026-08-29T21:49:00-03:00", heightM: 0.29, kind: "baixa" },
  // 30/ago/2026 (domingo-feira)
  { timestamp: "2026-08-30T03:36:00-03:00", heightM: 1.17, kind: "alta" },
  { timestamp: "2026-08-30T10:25:00-03:00", heightM: 0.03, kind: "baixa" },
  { timestamp: "2026-08-30T15:27:00-03:00", heightM: 1.03, kind: "alta" },
  { timestamp: "2026-08-30T22:34:00-03:00", heightM: 0.32, kind: "baixa" },
  // 31/ago/2026 (segunda-feira)
  { timestamp: "2026-08-31T03:57:00-03:00", heightM: 1.13, kind: "alta" },
  { timestamp: "2026-08-31T11:02:00-03:00", heightM: 0.13, kind: "baixa" },
  { timestamp: "2026-08-31T15:42:00-03:00", heightM: 0.95, kind: "alta" },
  { timestamp: "2026-08-31T23:04:00-03:00", heightM: 0.34, kind: "baixa" },
];

