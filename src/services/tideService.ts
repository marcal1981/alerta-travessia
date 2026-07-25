import { LOW_TIDE_TRUCK_RESTRICTION_M, TideExtreme } from "@/types";
import { SAMPLE_TIDE_EXTREMES } from "@/data/sampleTideExtremes";

/**
 * TideService — calcula a altura de maré para qualquer instante, interpolando entre
 * os pontos de maré alta/baixa da tábua oficial da Marinha (CHM).
 *
 * Maré é um fenômeno astronômico determinístico: uma vez com a tábua oficial do ano,
 * não é preciso nenhuma chamada de API para "saber a maré agora" — é só matemática
 * sobre uma tabela local. Por isso este serviço não faz nenhuma requisição de rede.
 *
 * A curva entre dois extremos de maré é aproximada por uma função coseno (padrão
 * usado em oceanografia para o "método da interpolação harmônica simplificada"),
 * que é bem mais fiel à forma real da maré do que uma reta.
 *
 * FONTE DE DADOS: ver `src/data/sampleTideExtremes.ts` — atualmente contém apenas uma
 * AMOSTRA DE TESTE (2025), não os dados oficiais do ano corrente. Ver o aviso lá.
 */

export interface TideReading {
  heightM: number;
  trend: "subindo" | "descendo";
  isLowTideTruckRestriction: boolean; // true quando abaixo do limiar oficial de 0,5m
  nextExtreme: TideExtreme | null;
}

function findSurroundingExtremes(
  extremes: TideExtreme[],
  atIso: string
): [TideExtreme, TideExtreme] | null {
  const at = new Date(atIso).getTime();
  const sorted = [...extremes].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = new Date(sorted[i].timestamp).getTime();
    const t2 = new Date(sorted[i + 1].timestamp).getTime();
    if (at >= t1 && at <= t2) {
      return [sorted[i], sorted[i + 1]];
    }
  }
  return null;
}

/** Interpolação em cosseno entre dois extremos de maré — aproxima bem a curva senoidal real da maré. */
function interpolateTide(prev: TideExtreme, next: TideExtreme, atIso: string): number {
  const t1 = new Date(prev.timestamp).getTime();
  const t2 = new Date(next.timestamp).getTime();
  const at = new Date(atIso).getTime();

  const fraction = (at - t1) / (t2 - t1); // 0 a 1
  const angle = fraction * Math.PI; // 0 a π
  const cosFactor = (1 - Math.cos(angle)) / 2; // 0 a 1, suave

  return prev.heightM + (next.heightM - prev.heightM) * cosFactor;
}

export function getTideAt(
  atIso: string = new Date().toISOString(),
  extremes: TideExtreme[] = SAMPLE_TIDE_EXTREMES
): TideReading | null {
  const surrounding = findSurroundingExtremes(extremes, atIso);
  if (!surrounding) return null; // fora do intervalo de dados disponíveis

  const [prev, next] = surrounding;
  const heightM = interpolateTide(prev, next, atIso);

  return {
    heightM: Math.round(heightM * 100) / 100,
    trend: next.kind === "alta" ? "subindo" : "descendo",
    isLowTideTruckRestriction: heightM < LOW_TIDE_TRUCK_RESTRICTION_M,
    nextExtreme: next,
  };
}
