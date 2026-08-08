export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-mist-700">
      <p>
        © {year} Alerta Travessia IA — Todos os direitos reservados a Dev. Alekson Marçal.
      </p>
      <p className="mt-1">
        Contato: Marcal_consultoria@yahoo.com.br · (12) 99147-9469
      </p>
    </footer>
  );
}
