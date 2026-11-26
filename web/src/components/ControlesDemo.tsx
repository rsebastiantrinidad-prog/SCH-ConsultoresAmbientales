import { RotateCcw } from 'lucide-react'
import { api, useDemo } from '../lib/store'

/** "Hoy" del demo y botón para volver a los datos de demo. Van en el pie, a mano pero fuera del camino. */
export default function ControlesDemo() {
  const { hoy } = useDemo()

  function reiniciar() {
    if (window.confirm('¿Reiniciar los datos de demo? Se pierden los cambios que hiciste y todo vuelve a como estaba al principio.')) {
      api.reiniciar()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        <span>Hoy en el demo</span>
        <input
          type="date"
          value={hoy}
          required
          onChange={(e) => e.target.value && api.cambiarHoy(e.target.value)}
          className="rounded-[4px] border border-white/50 bg-transparent px-2 py-1 text-white [color-scheme:dark]"
        />
      </label>
      <button
        type="button"
        onClick={reiniciar}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/70 px-3 py-1 font-display font-semibold text-white transition hover:bg-white hover:text-sch-black"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Reiniciar datos de demo
      </button>
    </div>
  )
}
