import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
      {/* Horizonte animado sutil, evocando o canal ao entardecer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,189,248,0.12),transparent)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="eyebrow">São Sebastião ⇄ Ilhabela</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-mist-100 sm:text-6xl">
          ALERTA TRAVESSIA <span className="text-tide">IA</span>
        </h1>
        <p className="mt-5 text-lg text-mist-300">
          Antecipando riscos. Facilitando decisões.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="w-full rounded-full bg-tide px-6 py-3 text-sm font-semibold text-abyss transition hover:opacity-90 sm:w-auto"
          >
            Ver situação agora
          </Link>
          <Link
            href="/dashboard#alertas"
            className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-mist-100 transition hover:bg-white/5 sm:w-auto"
          >
            Receber Alertas
          </Link>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl items-start gap-3 rounded-xl border border-signal-watch/30 bg-signal-watch/10 px-5 py-4 text-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-signal-watch" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm leading-relaxed text-mist-100">
            <strong className="font-semibold">Esta previsão é uma estimativa de IA, não um comunicado oficial.</strong>{" "}
            A decisão sobre operar ou não a travessia é sempre da operadora responsável. Antes de sair de casa, confirme
            também no canal oficial do Departamento Hidroviário (0800 77 33 711).
          </p>
        </div>
      </div>
    </section>
  );
}
