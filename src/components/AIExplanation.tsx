import { MptResult } from "@/types";

const TREND_ICON: Record<MptResult["trend"], string> = {
  subindo: "↗",
  estavel: "→",
  caindo: "↘",
};

export function AIExplanation({ mpt }: { mpt: MptResult | null }) {
  if (!mpt) {
    return (
      <div className="glass-panel p-6">
        <p className="eyebrow">MPT · Motor Preditivo de Travessias</p>
        <p className="mt-3 text-sm text-mist-500">Calculando estimativa...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">MPT · Motor Preditivo de Travessias</p>
        <span className="font-mono text-sm text-mist-500">
          tendência {TREND_ICON[mpt.trend]} {mpt.trend}
        </span>
      </div>

      <p className="mt-3 text-mist-100">{mpt.explanation}</p>

      <ul className="mt-4 space-y-2">
        {mpt.factors.map((factor) => (
          <li key={factor.key} className="flex items-center justify-between text-sm">
            <span className="text-mist-300">{factor.description}</span>
            <span className="font-mono text-mist-500">{Math.round(factor.weight * 100)}%</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-lg border border-white/[0.06] bg-navy-900/60 p-3 text-xs leading-relaxed text-mist-500">
        Esta previsão possui caráter informativo e não substitui os comunicados oficiais.
      </p>
    </div>
  );
}
