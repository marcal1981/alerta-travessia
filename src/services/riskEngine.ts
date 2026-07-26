import {
  AlgorithmWeights,
  ForecastPoint,
  IncomingSystem,
  MptResult,
  RiskFactor,
  WeatherReading,
  classifyRisk,
} from "@/types";

/**
 * MPT — Motor Preditivo de Travessias.
 *
 * Responsabilidade: transformar leituras meteorológicas em um Índice de Risco da
 * Travessia (IRT, 0-100) explicável, mais uma projeção para 30min / 1h / 2h / 3h.
 *
 * Este é o algoritmo de Fase 1: uma combinação ponderada e transparente de variáveis,
 * pensada para já ter os "pesos do algoritmo" editáveis pelo Admin (ver /admin).
 * Fase 2 pode evoluir para um modelo estatístico/ML treinado com o histórico real,
 * mantendo esta mesma assinatura de função para não quebrar a UI.
 *
 * IMPORTANTE: a saída deste módulo é sempre uma ESTIMATIVA PROBABILÍSTICA.
 * Nunca deve ser apresentada como equivalente ao Status Oficial da travessia.
 */

export const DEFAULT_WEIGHTS: AlgorithmWeights = {
  windSpeed: 0.12,
  windGust: 0.2,
  waveHeight: 0.2,
  wavePeriod: 0.08,
  visibility: 0.08,
  precipitation: 0.07,
  officialAlertBoost: 0.05,
  // Peso alto e deliberado: o Departamento Hidroviário reportou que ~90% das paralisações
  // recentes na travessia São Sebastião-Ilhabela foram causadas por neblina/nevoeiro —
  // então tratamos isso como sinal categórico forte, não só como parte da visibilidade contínua.
  fogBoost: 0.2,
};

function normalize(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Calcula o IRT (0-100) para uma leitura meteorológica, dado um conjunto de pesos. */
export function computeRiskIndex(
  reading: WeatherReading,
  weights: AlgorithmWeights = DEFAULT_WEIGHTS,
  hasOfficialAlert = false
): number {
  const windScore = normalize(reading.windSpeedKmh, 10, 60);
  const gustScore = normalize(reading.windGustKmh, 20, 80);
  const waveScore = normalize(reading.waveHeightM, 0.5, 3);
  const periodScore = normalize(reading.wavePeriodS, 4, 12); // períodos mais longos = mar mais organizado, mas com swell maior
  const visibilityScore = 1 - normalize(reading.visibilityKm, 1, 15);
  const precipScore = normalize(reading.precipitationMm, 0, 20);

  const weighted =
    windScore * weights.windSpeed +
    gustScore * weights.windGust +
    waveScore * weights.waveHeight +
    periodScore * weights.wavePeriod +
    visibilityScore * weights.visibility +
    precipScore * weights.precipitation +
    (hasOfficialAlert ? weights.officialAlertBoost : 0) +
    (reading.isFog ? weights.fogBoost : 0);

  const totalWeight =
    weights.windSpeed +
    weights.windGust +
    weights.waveHeight +
    weights.wavePeriod +
    weights.visibility +
    weights.precipitation +
    weights.officialAlertBoost +
    weights.fogBoost;

  return Math.round(normalize(weighted, 0, totalWeight) * 100);
}

/** Identifica quais variáveis mais empurraram o índice para cima, para a explicação do MPT. */
export function extractRiskFactors(reading: WeatherReading): RiskFactor[] {
  const candidates: RiskFactor[] = [];

  if (reading.isFog) {
    candidates.push({
      key: "fog",
      description: "Nevoeiro/neblina no canal",
      weight: 1, // sinal categórico — sempre no topo quando presente, é a causa histórica dominante
      trend: "subindo",
    });
  }

  candidates.push(
    {
      key: "windGust",
      description: "Aumento das rajadas de vento",
      weight: normalize(reading.windGustKmh, 20, 80),
      trend: reading.windGustKmh > 40 ? "subindo" : "estavel",
    },
    {
      key: "waveHeight",
      description: "Elevação da altura das ondas",
      weight: normalize(reading.waveHeightM, 0.5, 3),
      trend: reading.waveHeightM > 1.8 ? "subindo" : "estavel",
    },
    {
      key: "visibility",
      description: "Redução da visibilidade",
      weight: 1 - normalize(reading.visibilityKm, 1, 15),
      trend: reading.visibilityKm < 8 ? "subindo" : "caindo",
    },
    {
      key: "precipitation",
      description: "Aumento da intensidade de chuva",
      weight: normalize(reading.precipitationMm, 0, 20),
      trend: reading.precipitationMm > 5 ? "subindo" : "estavel",
    }
  );

  return candidates.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

function buildExplanation(factors: RiskFactor[], level: string): string {
  const relevant = factors.filter((f) => f.weight > 0.35);
  if (relevant.length === 0) {
    return "Condições dentro da faixa habitual para a travessia; nenhum fator isolado se destaca no momento.";
  }
  const parts = relevant.map((f) => f.description.toLowerCase());
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
  return `O risco foi classificado como "${level}" principalmente devido a ${joined}.`;
}

/**
 * Projeta o IRT para os horizontes de 1h/2h/3h/5h. O índice "Agora" nunca faz parte
 * deste array — fica em `MptResult.riskIndex`, garantindo que nenhum reforço regional
 * possa afetar o valor do instante atual.
 *
 * Base: extrapolação simples a partir da tendência recente (persistência + leve amplificação).
 * Se um `incomingSystem` for informado (ver `regionalWatchService.ts`), os horizontes
 * recebem um reforço gradual conforme se aproximam do ETA estimado do sistema.
 */
export function buildForecast(currentIndex: number, incomingSystem?: IncomingSystem | null): ForecastPoint[] {
  const now = new Date().toISOString();
  const horizons: { label: ForecastPoint["horizonLabel"]; minutes: ForecastPoint["horizonMinutes"]; drift: number }[] = [
    { label: "1 hora", minutes: 60, drift: 14 },
    { label: "2 horas", minutes: 120, drift: 28 },
    { label: "3 horas", minutes: 180, drift: 40 },
    { label: "5 horas", minutes: 300, drift: 58 },
  ];

  const INCOMING_SYSTEM_MAX_BOOST = 30; // pontos de IRT, aplicados só quando o ETA já chegou

  return horizons.map((h) => {
    let projected = Math.min(100, Math.max(0, Math.round(currentIndex + h.drift * (currentIndex / 60))));

    if (incomingSystem) {
      const horizonHours = h.minutes / 60;
      // Reforço cresce linearmente até o ETA, depois se mantém no máximo.
      const rampFraction = Math.min(1, horizonHours / incomingSystem.etaHours);
      const boost = rampFraction * INCOMING_SYSTEM_MAX_BOOST;
      projected = Math.min(100, Math.round(projected + boost));
    }

    return {
      horizonLabel: h.label,
      horizonMinutes: h.minutes,
      riskIndex: projected,
      level: classifyRisk(projected).level,
      generatedAt: now,
    };
  });
}

export function runMpt(
  reading: WeatherReading,
  weights: AlgorithmWeights = DEFAULT_WEIGHTS,
  hasOfficialAlert = false,
  incomingSystem?: IncomingSystem | null
): MptResult {
  const riskIndex = computeRiskIndex(reading, weights, hasOfficialAlert);
  const level = classifyRisk(riskIndex).level;
  const factors = extractRiskFactors(reading);
  const forecast = buildForecast(riskIndex, incomingSystem);
  const trend: MptResult["trend"] =
    forecast[forecast.length - 1].riskIndex > riskIndex + 5
      ? "subindo"
      : forecast[forecast.length - 1].riskIndex < riskIndex - 5
      ? "caindo"
      : "estavel";

  let explanation = buildExplanation(factors, classifyRisk(riskIndex).label);
  if (incomingSystem) {
    const systemLabel = incomingSystem.type === "chuva_forte" ? "chuva forte" : "vento forte / mar agitado";
    const confidenceNote =
      incomingSystem.confidence === "baixa"
        ? " (sinal de confiança baixa — indica região instável, não necessariamente um sistema se deslocando diretamente pra cá)"
        : "";
    explanation += ` Atenção: ${systemLabel} detectado em ${incomingSystem.sourceLabel} (${incomingSystem.distanceKm}km), com vento indicando chegada em aproximadamente ${incomingSystem.etaHours}h${confidenceNote} — os horizontes de previsão acima já refletem isso.`;
  }

  return {
    riskIndex,
    level,
    trend,
    explanation,
    factors,
    forecast,
    computedAt: new Date().toISOString(),
    modelVersion: incomingSystem ? "mpt-v1-heuristico+regional" : "mpt-v1-heuristico",
  };
}
