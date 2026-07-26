import { LOW_TIDE_TRUCK_RESTRICTION_M, WeatherReading } from "@/types";

function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

export function WeatherPanel({ reading }: { reading: WeatherReading | null }) {
  const rows: { label: string; value: string }[] = reading
    ? [
        { label: "Temperatura", value: `${reading.temperatureC.toFixed(1)} °C` },
        { label: "Pressão", value: `${reading.pressureHpa.toFixed(0)} hPa` },
        { label: "Umidade", value: `${reading.humidityPct.toFixed(0)}%` },
        { label: "Rajadas", value: `${reading.windGustKmh.toFixed(0)} km/h` },
        { label: "Vel. média do vento", value: `${reading.windSpeedKmh.toFixed(0)} km/h` },
        { label: "Direção do vento", value: `${windDirectionLabel(reading.windDirectionDeg)} (${reading.windDirectionDeg.toFixed(0)}°)` },
        { label: "Altura das ondas", value: `${reading.waveHeightM.toFixed(1)} m` },
        { label: "Período das ondas", value: `${reading.wavePeriodS.toFixed(1)} s` },
        { label: "Maré", value: reading.tideM != null ? `${reading.tideM.toFixed(1)} m` : "—" },
        { label: "Visibilidade", value: `${reading.visibilityKm.toFixed(1)} km` },
      ]
    : [];

  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">Painel Meteorológico</p>
        {reading && (
          <span className="text-xs text-mist-500">
            Fonte: {reading.source === "mock" ? "simulado (dev)" : reading.source}
          </span>
        )}
      </div>
      {reading?.isFog && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-signal-critical/30 bg-signal-critical/10 px-4 py-2 text-sm text-signal-critical">
          <span className="h-2 w-2 rounded-full bg-signal-critical" />
          Nevoeiro detectado — principal causa histórica de paralisação desta travessia.
        </div>
      )}
      {reading?.isLowTideTruckRestriction && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-signal-high/30 bg-signal-high/10 px-4 py-2 text-sm text-signal-high">
          <span className="h-2 w-2 rounded-full bg-signal-high" />
          Maré abaixo de {LOW_TIDE_TRUCK_RESTRICTION_M}m — travessia de caminhões de 3+ eixos restrita.
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-mist-500">{row.label}</dt>
            <dd className="font-mono text-lg text-mist-100">{row.value}</dd>
          </div>
        ))}
        {!reading && <p className="text-sm text-mist-500">Carregando leituras...</p>}
      </dl>
    </div>
  );
}
