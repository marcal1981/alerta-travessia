"use client";

import { classifyRisk } from "@/types";

const LEVEL_COLOR: Record<string, string> = {
  baixo: "#2DD4A7",
  atencao: "#F4B740",
  alto: "#F97316",
  "muito-alto": "#E23744",
};

/**
 * Instrumento circular inspirado em painéis de navegação/aeronáutica: arco graduado
 * em 4 zonas (Baixo/Atenção/Alto/Muito Alto) com ponteiro animado apontando o IRT atual.
 * É o elemento de assinatura visual do produto — o resto do layout fica deliberadamente
 * mais quieto para que este instrumento seja o que a pessoa lembra.
 */
export function RiskGauge({ index }: { index: number }) {
  const clamped = Math.min(100, Math.max(0, index));
  const angle = -120 + (clamped / 100) * 240; // -120deg a +120deg
  const classification = classifyRisk(clamped);
  const color = LEVEL_COLOR[classification.level];

  const zones = [
    { from: 0, to: 30, color: LEVEL_COLOR.baixo },
    { from: 30, to: 60, color: LEVEL_COLOR.atencao },
    { from: 60, to: 80, color: LEVEL_COLOR.alto },
    { from: 80, to: 100, color: LEVEL_COLOR["muito-alto"] },
  ];

  const toXY = (pct: number, r: number) => {
    const a = ((-120 + (pct / 100) * 240) * Math.PI) / 180;
    return { x: 100 + r * Math.sin(a), y: 100 - r * Math.cos(a) };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[220px] w-[220px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-0">
          {zones.map((z, i) => {
            const start = toXY(z.from, 84);
            const end = toXY(z.to, 84);
            const largeArc = z.to - z.from > 180 ? 1 : 0;
            return (
              <path
                key={i}
                d={`M ${start.x} ${start.y} A 84 84 0 ${largeArc} 1 ${end.x} ${end.y}`}
                stroke={z.color}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                opacity={0.85}
              />
            );
          })}
          {/* Anel interno de vidro */}
          <circle cx="100" cy="100" r="66" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />

          {/* Ponteiro */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform 900ms cubic-bezier(0.34, 1.2, 0.4, 1)" }}>
            <line x1="100" y1="100" x2="100" y2="34" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={color} />
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span className="font-mono text-4xl font-semibold tabular-nums text-mist-100">
            {Math.round(clamped)}
          </span>
          <span className="eyebrow mt-1" style={{ color }}>
            {classification.label}
          </span>
        </div>
      </div>
    </div>
  );
}
