// Tipos centrais do domínio "Alerta Travessia IA".
// Qualquer serviço (mock ou integrado a API real) deve retornar exatamente estas formas,
// para que trocar a fonte de dado nunca exija mudar um componente de UI.

export type OperationalStatus = "operando" | "parcial" | "interrompida";

export type RiskLevel = "baixo" | "atencao" | "alto" | "muito-alto";

export interface RiskClassification {
  level: RiskLevel;
  label: string; // rótulo em pt-BR para exibição
  min: number;
  max: number;
}

/** Ponto de previsão do Índice de Risco da Travessia (IRT) para um horizonte específico. */
export interface ForecastPoint {
  horizonLabel: "1 hora" | "2 horas" | "3 horas" | "5 horas";
  horizonMinutes: 60 | 120 | 180 | 300;
  riskIndex: number; // 0-100
  level: RiskLevel;
  generatedAt: string; // ISO timestamp
}

/** Leitura meteorológica bruta, na forma que qualquer provedor (Open-Meteo, INMET, StormGlass...) deve normalizar. */
export interface WeatherReading {
  source: WeatherSourceId;
  timestamp: string; // ISO
  temperatureC: number;
  pressureHpa: number;
  humidityPct: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDeg: number; // 0-360, 0 = Norte
  waveHeightM: number;
  wavePeriodS: number;
  tideM: number | null; // altura de maré relativa, quando disponível
  isLowTideTruckRestriction: boolean; // maré abaixo do limiar oficial de 0,5m (restrição a caminhões 3+ eixos)
  visibilityKm: number;
  precipitationMm: number;
  weatherCode: number; // código WMO (Open-Meteo) — 45/48 = nevoeiro
  isFog: boolean; // derivado de weatherCode, para o motor de risco tratar como sinal categórico
}

export type WeatherSourceId =
  | "open-meteo"
  | "inmet"
  | "noaa"
  | "stormglass"
  | "windy"
  | "windfinder"
  | "mock";

export interface WeatherSourceConfig {
  id: WeatherSourceId;
  label: string;
  enabled: boolean;
  configured: boolean; // true quando as credenciais/endpoint reais estão presentes
}

/** Um ponto de maré alta ou baixa, conforme a tábua oficial da Marinha (CHM). */
export interface TideExtreme {
  timestamp: string; // ISO, horário local (America/Sao_Paulo)
  heightM: number;
  kind: "alta" | "baixa";
}

/** Regra oficial: caminhões de 3+ eixos são proibidos de embarcar quando a maré cai abaixo disso. */
export const LOW_TIDE_TRUCK_RESTRICTION_M = 0.5;

/** Categoria de veículo conforme a Resolução Semil nº 79/2023. */
export type VehicleCategory = "leve" | "vuc_toco" | "tres_eixos" | "quatro_mais_eixos";

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  leve: "Carros e motos",
  vuc_toco: "VUC / Caminhão toco (2 eixos)",
  tres_eixos: "Caminhão 3 eixos",
  quatro_mais_eixos: "Caminhão 4+ eixos",
};

export type CrossingDirection = "para_ilhabela" | "para_sao_sebastiao";

export const CROSSING_DIRECTION_LABELS: Record<CrossingDirection, string> = {
  para_ilhabela: "São Sebastião → Ilhabela",
  para_sao_sebastiao: "Ilhabela → São Sebastião",
};

export interface TruckRestrictionStatus {
  category: VehicleCategory;
  direction: CrossingDirection;
  allowed: boolean;
  reasons: string[]; // ex: ["Restrição de horário (sexta-feira)", "Maré abaixo de 0,5m"]
  checkedAt: string;
}

export interface OfficialQueueStatus {
  waitTimeSaoSebastiaoMin: number | null;
  waitTimeIlhabelaMin: number | null;
  ferriesInOperation: number | null;
  capacityPercent: number | null; // métrica alternativa observada em notícias oficiais ("opera com X% da capacidade")
  systemUnstableWarning: boolean; // true quando o próprio DH avisa que os dados podem estar desatualizados
  fetchedAt: string;
  source: "semil-scrape" | "unavailable";
}

export interface OfficialCamera {
  id: string;
  label: string;
  terminal: "sao_sebastiao" | "ilhabela";
  imageUrl: string;
  distanceM: number | null; // distância aproximada até o ponto de embarque, em metros
}

/**
 * Sistema climático detectado num ponto de referência distante (ex. Santos), que o
 * vento local indica estar se deslocando em direção à travessia. Usado apenas para
 * AJUSTAR os horizontes futuros de previsão (30min/1h/2h/3h) — nunca o índice "Agora",
 * que continua 100% baseado em medição local do canal.
 */
export interface IncomingSystem {
  type: "chuva_forte" | "vento_forte" | "aquecimento_pre_frontal";
  sourceLabel: string; // ex: "Santos"
  distanceKm: number;
  etaHours: number;
  confidence: "alta" | "baixa";
}

/**
 * Um "retrato" da previsão horária do dia, guardado no momento em que foi buscada —
 * a base pra validar acurácia de antecedência de verdade (comparando com o que
 * realmente aconteceu, depois). Ver `forecastSnapshotService.ts`.
 */
export interface ForecastSnapshot {
  fetchedAt: string; // ISO — quando este retrato foi tirado
  hourlyGustKmh: { hour: string; gustKmh: number }[]; // hour em ISO (America/Sao_Paulo)
}




/** Fator explicativo retornado pelo Motor Preditivo de Travessias (MPT). */
export interface RiskFactor {
  key: string;
  description: string; // ex: "Aumento das rajadas de vento"
  weight: number; // contribuição relativa (0-1) no cálculo final
  trend: "subindo" | "estavel" | "caindo";
}

/** Saída completa do MPT para o instante atual. */
export interface MptResult {
  riskIndex: number;
  level: RiskLevel;
  trend: "subindo" | "estavel" | "caindo";
  explanation: string; // texto gerado explicando o motivo, ex. exemplo do brief
  factors: RiskFactor[];
  forecast: ForecastPoint[];
  computedAt: string;
  modelVersion: string;
}

/**
 * Status Oficial da travessia — SEMPRE um módulo independente da previsão do MPT.
 * Nunca deve ser confundido/misturado com o Índice de Risco (IRT), que é uma estimativa.
 */
export interface OfficialStatus {
  status: OperationalStatus;
  reason: string | null;
  updatedAt: string;
  updatedBy: "admin-manual" | "api-oficial"; // fonte da atualização
  source: string | null; // nome da API oficial quando integrada (Fase futura)
}

export interface HistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: OperationalStatus;
  reason: string | null;
  gustsKmh: number;
  waveHeightM: number;
  riskIndex: number;
  interruptionDurationMin: number | null;
}

export interface AlgorithmWeights {
  windSpeed: number;
  windGust: number;
  waveHeight: number;
  wavePeriod: number;
  visibility: number;
  precipitation: number;
  officialAlertBoost: number; // peso extra quando há alerta meteorológico oficial vigente
  fogBoost: number; // peso extra quando weather_code indica nevoeiro (45/48) — maior causa histórica de paralisação
}

export const RISK_CLASSIFICATIONS: RiskClassification[] = [
  { level: "baixo", label: "Baixo", min: 0, max: 30 },
  { level: "atencao", label: "Atenção", min: 31, max: 60 },
  { level: "alto", label: "Alto", min: 61, max: 80 },
  { level: "muito-alto", label: "Muito Alto", min: 81, max: 100 },
];

export function classifyRisk(index: number): RiskClassification {
  return (
    RISK_CLASSIFICATIONS.find((c) => index >= c.min && index <= c.max) ??
    RISK_CLASSIFICATIONS[RISK_CLASSIFICATIONS.length - 1]
  );
}
