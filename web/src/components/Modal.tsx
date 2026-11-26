import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

/**
 * Diálogo accesible: Esc cierra, el foco queda adentro mientras está abierto y vuelve a donde estaba al cerrar.
 * En el celular ocupa casi toda la pantalla.
 */
export default function Modal({
  titulo, onCerrar, children, pie, ancho = 'max-w-lg',
}: {
  titulo: string
  onCerrar: () => void
  children: ReactNode
  pie?: ReactNode
  ancho?: string
}) {
  const caja = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const enfocables = () =>
      Array.from(caja.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])
    ;(enfocables()[1] ?? enfocables()[0])?.focus()

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCerrar()
      } else if (e.key === 'Tab') {
        const lista = enfocables()
        if (!lista.length) return
        const [primero, ultimo] = [lista[0], lista[lista.length - 1]]
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero.focus()
        }
      }
    }
    window.addEventListener('keydown', alTeclear)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      previo?.focus()
    }
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-sch-black/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`flex max-h-[92vh] w-full ${ancho} flex-col rounded-t-[4px] bg-white sm:rounded-[4px]`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-sch-black/10 px-5 py-4">
          <h2 id={idTitulo} className="text-xl font-bold">
            {titulo}
          </h2>
          <button type="button" onClick={onCerrar} className="rounded-full p-1.5 hover:bg-sch-surface" aria-label="Cerrar">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pie && <div className="flex flex-wrap justify-end gap-2 border-t border-sch-black/10 px-5 py-3">{pie}</div>}
      </div>
    </div>
  )
}
