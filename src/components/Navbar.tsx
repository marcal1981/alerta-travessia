import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-abyss/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-tide/40 text-tide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 12c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
            </svg>
          </span>
          <span className="font-display text-sm font-semibold tracking-wide text-mist-100">
            ALERTA TRAVESSIA <span className="text-tide">IA</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-mist-500 md:flex">
          <Link href="/dashboard" className="transition hover:text-mist-100">Painel</Link>
          <Link href="/caminhoes" className="transition hover:text-mist-100">Caminhões</Link>
          <Link href="/dashboard#historico" className="transition hover:text-mist-100">Histórico</Link>
          <Link href="/admin" className="transition hover:text-mist-100">Admin</Link>
        </nav>
        <Link
          href="/dashboard"
          className="rounded-full bg-tide px-4 py-2 text-xs font-semibold text-abyss transition hover:opacity-90"
        >
          Ver situação agora
        </Link>
      </div>
    </header>
  );
}
