import { Recycle, Wind } from 'lucide-react'
import { FOTO_CATEGORIA } from '../../lib/fotos'
import type { CategoriaServicio, Datos, EstadoServicio, ServicioCliente } from '../../lib/tipos'
import { Foto } from '../Foto'

export const nombreServicio = (datos: Datos, s: ServicioCliente) => datos.catalogo.find((c) => c.id === s.servicio_id)?.nombre ?? s.servicio_id
export const categoriaServicio = (datos: Datos, s: ServicioCliente) => datos.catalogo.find((c) => c.id === s.servicio_id)?.categoria

export const ETIQUETA_ESTADO_SERVICIO: Record<EstadoServicio, string> = {
  propuesta: 'Propuesta',
  en_curso: 'En curso',
  vigente: 'Vigente',
  finalizado: 'Finalizado',
}

/** Estado del servicio: pastilla con borde (no compite con el semáforo). */
export function EstadoServicioPastilla({ valor }: { valor: EstadoServicio }) {
  const clase = valor === 'en_curso' ? 'border-sch-black bg-sch-black text-white' : 'border-sch-black/30 text-sch-ink'
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-display text-xs font-bold ${clase}`}>{ETIQUETA_ESTADO_SERVICIO[valor]}</span>
}

/** Barra de avance verde con el porcentaje en texto. */
export function BarraAvance({ valor, etiqueta }: { valor: number; etiqueta?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-sch-surface ring-1 ring-inset ring-sch-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label={etiqueta ?? 'Avance'}
      >
        <div className="crecer-x h-full rounded-full bg-sch-green transition-[width] duration-500" style={{ width: `${valor}%` }} />
      </div>
      <span className="w-10 text-right font-display text-sm font-bold tabular-nums">{valor}%</span>
    </div>
  )
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">{children}</p>
}

/**
 * Franja de foto arriba de la tarjeta de un servicio. Las categorías sin foto (residuos, otros)
 * usan el patrón de hojas con un ícono, para que todas las tarjetas tengan la misma forma.
 */
export function FotoServicio({ categoria }: { categoria: CategoriaServicio | undefined }) {
  const foto = categoria ? FOTO_CATEGORIA[categoria] : undefined
  if (foto) {
    return <Foto nombre={foto} sizes="(min-width: 768px) 480px, 100vw" className="h-28 w-full rounded-t-[4px] object-cover" />
  }
  const Icono = categoria === 'residuos' ? Recycle : Wind
  return (
    <div className="fondo-hojas flex h-28 items-center justify-center rounded-t-[4px]" aria-hidden>
      <Icono className="h-10 w-10 text-sch-mint" />
    </div>
  )
}
