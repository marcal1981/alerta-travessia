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
  { text: "LENTIDÃO", from: 30, to: 60 },
  { text: "RISCO DE INTERRUPÇÃO", from: 60, to: 100 },
];

// Mesmo agrupamento dos rótulos do arco, mas para o texto abaixo do número central —
// troca o nome técnico do nível de risco (Baixo/Atenção/Alto/Muito Alto) pela mesma
// linguagem operacional usada no arco, e a cor acompanha a zona real.
function zoneWordFor(level: string): { text: string; color: string } {
  if (level === "baixo") return { text: "OPERANDO", color: LEVEL_COLOR.baixo };
  if (level === "atencao") return { text: "LENTIDÃO", color: LEVEL_COLOR.atencao };
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
              sem precisar forçar/esticar o texto (o que distorcia as letras antes).
              startOffset: o meio matemático do trecho (from+to)/2 nem sempre coincide com o
              topo visual do medidor (that fica exatamente em 50%) — é o caso de "ALERTA"
              (30 a 60), cujo meio real é 45, deslocado pra esquerda do topo. Corrige
              ancorando no 50% verdadeiro quando ele cai dentro do próprio trecho do rótulo. */}
          {ARC_LABELS.map((label, i) => {
            const trueTopFallsInside = label.from <= 50 && 50 <= label.to;
            const startOffset = trueTopFallsInside
              ? `${(((50 - label.from) / (label.to - label.from)) * 100).toFixed(1)}%`
              : "50%";
            return (
              <text key={i} fill="#F5F7FA" fontSize="11" fontWeight="700" letterSpacing="0.3">
                <textPath href={`#arc-label-path-${i}`} startOffset={startOffset} textAnchor="middle">
                  {label.text}
                </textPath>
              </text>
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

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-14">
          <span className="font-mono text-4xl font-semibold tabular-nums text-mist-100">
            {Math.round(clamped)}
          </span>
        </div>
      </div>

      {/* Texto de status (OPERANDO/ALERTA/RISCO DE INTERRUPÇÃO) — antes ficava
          dentro do círculo do relógio, junto com o número; tirado de lá e
          reposicionado abaixo do instrumento (ainda dentro da mesma box), com
          fonte maior pra ganhar destaque próprio em vez de competir por espaço
          com o número e o ponteiro. */}
      <span className="-mt-10 text-base font-semibold tracking-wide text-center" style={{ color: zoneWord.color }}>
        {zoneWord.text}
      </span>
    </div>
  );
}
