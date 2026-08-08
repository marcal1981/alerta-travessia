import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-abyss/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-tide/40 text-tide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 18c1.2 1 2.4 1 3.6 0 1.2-1 2.4-1 3.6 0 1.2 1 2.4 1 3.6 0 1.2-1 2.4-1 3.6 0 1.2 1 2.4 1 3.6 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M4 15.5 5.2 11h13.6l1.2 4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="none"
              />
              <path d="M9 11V7.5h4V11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
              <path d="M12 7.5V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-base font-semibold tracking-normal text-mist-100 sm:text-lg sm:tracking-wide">
            ALERTA TRAVESSIA <span className="text-tide">IA</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-mist-500 md:flex">
          <Link href="/" className="transition hover:text-mist-100">Painel</Link>
          <Link href="/caminhoes" className="transition hover:text-mist-100">Caminhões</Link>
          {/* Link "Histórico" removido — apontava pra uma âncora (/#historico) que
              nunca existiu na página (link morto), e o único histórico real do
              projeto é o log de alertas regionais dentro do /admin, que é interno. */}
          {/* Link do Admin removido do menu de propósito — a rota /admin continua
              funcionando normalmente por acesso direto à URL (protegida por login),
              só não aparece como opção clicável pra visitantes comuns. */}
        </nav>
      </div>
    </header>
  );
}
