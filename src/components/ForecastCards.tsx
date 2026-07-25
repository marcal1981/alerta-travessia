import { ForecastPoint } from "@/types";
import clsx from "clsx";

const LEVEL_STYLES: Record<string, string> = {
  baixo: "text-signal-low border-signal-low/30",
  atencao: "text-signal-watch border-signal-watch/30",
  alto: "text-signal-high border-signal-high/30",
  "muito-alto": "text-signal-critical border-signal-critical/30",
};

export function ForecastCards({ forecast }: { forecast: ForecastPoint[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {forecast.map((point) => (
        <div
          key={point.horizonLabel}
          className={clsx(
            "glass-panel flex flex-col items-center gap-2 border p-4 text-center",
            LEVEL_STYLES[point.level]
          )}
        >
          <span className="eyebrow text-mist-500">{point.horizonLabel}</span>
          <span className="font-mono text-2xl font-semibold tabular-nums">{point.riskIndex}%</span>
        </div>
      ))}
    </div>
  );
}
