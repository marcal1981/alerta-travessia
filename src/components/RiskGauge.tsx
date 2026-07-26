"use client";

import { classifyRisk } from "@/types";

const LEVEL_COLOR: Record<string, string> = {
  baixo: "#2DD4A7",
  atencao: "#F4B740",
  alto: "#F97316",
  "muito-alto": "#E23744",
};

// Rótulos em linguagem operacional (o que o usuário realmente quer saber),
// não em linguagem abstrata de "nível de risco". "Alto" e "Muito Alto" ficam
// agrupados sob "Risco de Interrupção" — são as duas zonas onde a travessia
// já pode ser afetada, então não faz sentido separar visualmente no arco.
// O texto fica branco neutro — só o arco colorido indica a zona.
const ARC_LABELS = [
  { text: "OPERANDO", from: 0, to: 30 },
  { text: "ALERTA", from: 30, to: 60 },
  { text: "RISCO DE INTERRUPÇÃO", from: 60, to: 100 },
];

// Mesmo agrupamento dos rótulos do arco, mas para o texto abaixo do número central —
// troca o nome técnico do nível de risco (Baixo/Atenção/Alto/Muito Alto) pela mesma
// linguagem operacional usada no arco, e a cor acompanha a zona real.
function zoneWordFor(level: string): { text: string; color: string } {
  if (level === "baixo") return { text: "OPERANDO", color: LEVEL_COLOR.baixo };
  if (level === "atencao") return { text: "ALERTA", color: LEVEL_COLOR.atencao };
  return { text: "RISCO DE INTERRUPÇÃO", color: LEVEL_COLOR["muito-alto"] };
}

/**
 * Instrumento circular inspirado em painéis de navegação/aeronáutica: arco graduado
 * em 4 zonas (Baixo/Atenção/Alto/Muito Alto) com ponteiro animado apontando o IRT atual.
 * As 3 palavras curvadas no arco (Operando/Alerta/Risco de Interrupção) traduzem essas
 * zonas pra linguagem que importa pro usuário, não só o nome técnico do nível de risco.
 * É o elemento de assinatura visual do produto — o resto do layout fica deliberadamente
 * mais quieto para que este instrumento seja o que a pessoa lembra.
 */
export function RiskGauge({ index }: { index: number }) {
  const clamped = Math.min(100, Math.max(0, index));
  const angle = -120 + (clamped / 100) * 240; // -120deg a +120deg
  const classification = classifyRisk(clamped);
  const color = LEVEL_COLOR[classification.level];
  const zoneWord = zoneWordFor(classification.level);

  const zones = [
    { from: 0, to: 30, color: LEVEL_COLOR.baixo },
    { from: 30, to: 60, color: LEVEL_COLOR.atencao },
    { from: 60, to: 80, color: LEVEL_COLOR.alto },
    { from: 80, to: 100, color: LEVEL_COLOR["muito-alto"] },
  ];

  const LABEL_RADIUS = 94;

  const toXY = (pct: number, r: number) => {
    const a = ((-120 + (pct / 100) * 240) * Math.PI) / 180;
    return { x: 100 + r * Math.sin(a), y: 100 - r * Math.cos(a) };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[220px] w-[220px]">
        <svg viewBox="-14 -14 228 228" className="h-full w-full overflow-visible">
          <defs>
            {ARC_LABELS.map((label, i) => {
              const start = toXY(label.from, LABEL_RADIUS);
              const end = toXY(label.to, LABEL_RADIUS);
              const largeArc = label.to - label.from > 180 ? 1 : 0;
              return (
                <path
                  key={i}
                  id={`arc-label-path-${i}`}
                  d={`M ${start.x} ${start.y} A ${LABEL_RADIUS} ${LABEL_RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                  fill="none"
                />
              );
            })}
          </defs>

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

          {/* Rótulos curvados seguindo o arco, no tamanho natural — os trechos de arco já são
              generosos o suficiente (calculados por LABEL_RADIUS) pra nenhuma palavra cortar,
              sem precisar forçar/esticar o texto (o que distorcia as letras antes). */}
          {ARC_LABELS.map((label, i) => (
            <text key={i} fill="#F5F7FA" fontSize="9.5" fontWeight="700" letterSpacing="0.3">
              <textPath href={`#arc-label-path-${i}`} startOffset="50%" textAnchor="middle">
                {label.text}
              </textPath>
            </text>
          ))}

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
          <span className="eyebrow mt-1 text-center" style={{ color: zoneWord.color }}>
            {zoneWord.text}
          </span>
        </div>
      </div>
    </div>
  );
}
