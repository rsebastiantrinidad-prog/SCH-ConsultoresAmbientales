import type { Datos, EstadoServicio, ServicioCliente } from '../../lib/tipos'

export const nombreServicio = (datos: Datos, s: ServicioCliente) => datos.catalogo.find((c) => c.id === s.servicio_id)?.nombre ?? s.servicio_id

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
        <div className="h-full rounded-full bg-sch-green transition-[width]" style={{ width: `${valor}%` }} />
      </div>
      <span className="w-10 text-right font-display text-sm font-bold tabular-nums">{valor}%</span>
    </div>
  )
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">{children}</p>
}
