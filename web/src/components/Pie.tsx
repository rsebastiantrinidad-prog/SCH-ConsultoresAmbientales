const IG_DBP = 'https://www.instagram.com/drivenbypeople_/'

/** Pie de página: gris del sitio, texto blanco, aviso de demo y "Powered by". */
export default function Pie() {
  return (
    <footer className="mt-auto bg-sch-gray text-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-base font-bold">SCH Gestión · Demo</p>
          <p>Demo con datos ficticios: no guarda datos reales ni envía mensajes.</p>
          <p>© 2026 SCH Consultores Ambientales. Córdoba, Argentina.</p>
        </div>

        <a
          href={IG_DBP}
          target="_blank"
          rel="noopener noreferrer"
          title="Driven By People en Instagram"
          className="group flex items-center gap-2 text-xs text-white no-underline"
        >
          Powered by
          <img
            src="/marca/drivenbypeople.png"
            alt="Driven By People"
            className="h-6 w-auto opacity-80 brightness-0 invert transition group-hover:opacity-100"
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  )
}
