/**
 * Piezas chicas reutilizables. Regla de accesibilidad del spec: el estado nunca se indica solo con color;
 * siempre va con ícono y texto. Colores solo de la paleta de SCH.
 */
import { AlertOctagon, CheckCircle2, CircleDashed, Clock, Eye, FileWarning, MessageSquareWarning, X } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import type { EstadoDocumento, Semaforo as TipoSemaforo } from '../lib/tipos'

interface Estilo {
  etiqueta: string
  clase: string
  Icono: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

/** Pastilla sólida: los textos van en negro sobre verde, ámbar y menta, y en blanco sobre rojo, gris y negro (todo AA). */
const PASTILLA = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold font-display'

export const ESTILO_SEMAFORO: Record<TipoSemaforo, Estilo> = {
  verde: { etiqueta: 'Al día', clase: 'bg-sch-green text-sch-black', Icono: CheckCircle2 },
  ambar: { etiqueta: 'A revisar', clase: 'bg-sch-amber text-sch-black', Icono: Clock },
  rojo: { etiqueta: 'Urgente', clase: 'bg-sch-red text-white', Icono: AlertOctagon },
}

/** Semáforo documental del cliente. */
export function Semaforo({ valor, className = '' }: { valor: TipoSemaforo; className?: string }) {
  const { etiqueta, clase, Icono } = ESTILO_SEMAFORO[valor]
  return (
    <span className={`${PASTILLA} ${clase} ${className}`} title={`Semáforo: ${etiqueta}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden />
      {etiqueta}
    </span>
  )
}

export const ESTILO_DOCUMENTO: Record<EstadoDocumento, Estilo> = {
  // Gris de pie (#727271) en lugar de #777777: con texto blanco da 4,8:1 (el otro queda apenas abajo de AA)
  pendiente: { etiqueta: 'Pendiente', clase: 'bg-sch-gray text-white', Icono: CircleDashed },
  en_revision: { etiqueta: 'En revisión', clase: 'bg-sch-mint text-sch-black', Icono: Eye },
  vigente: { etiqueta: 'Vigente', clase: 'bg-sch-green text-sch-black', Icono: CheckCircle2 },
  por_vencer: { etiqueta: 'Por vencer', clase: 'bg-sch-amber text-sch-black', Icono: Clock },
  vencido: { etiqueta: 'Vencido', clase: 'bg-sch-red text-white', Icono: FileWarning },
  observado: { etiqueta: 'Observado', clase: 'bg-sch-black text-white ring-2 ring-inset ring-sch-red', Icono: MessageSquareWarning },
}

/** Estado de un documento. */
export function EstadoDocumentoPastilla({ valor }: { valor: EstadoDocumento }) {
  const { etiqueta, clase, Icono } = ESTILO_DOCUMENTO[valor]
  return (
    <span className={`${PASTILLA} ${clase}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden />
      {etiqueta}
    </span>
  )
}

/** Chip que se prende y apaga (filtros). */
export function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-display font-semibold transition ${
        activo ? 'border-sch-black bg-sch-black text-white' : 'border-sch-black/25 bg-white text-sch-ink hover:border-sch-black'
      }`}
    >
      {children}
    </button>
  )
}

/** Chip de filtro activo con botón para quitarlo. */
export function ChipQuitable({ children, onQuitar }: { children: ReactNode; onQuitar: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sch-surface py-0.5 pl-3 pr-1 text-sm">
      {children}
      <button type="button" onClick={onQuitar} className="rounded-full p-0.5 hover:bg-sch-black hover:text-white" aria-label={`Quitar filtro ${typeof children === 'string' ? children : ''}`}>
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  )
}

export interface OpcionFiltro<T extends string> {
  valor: T
  etiqueta: ReactNode
}

/** Grupo de chips de selección múltiple (adaptado de MultiFiltro de MUPREN). Vacío = sin filtrar. */
export function MultiFiltro<T extends string>({
  titulo, opciones, seleccion, onCambio,
}: {
  titulo: string
  opciones: OpcionFiltro<T>[]
  seleccion: T[]
  onCambio: (s: T[]) => void
}) {
  const alternar = (v: T) => onCambio(seleccion.includes(v) ? seleccion.filter((x) => x !== v) : [...seleccion, v])
  return (
    <fieldset className="space-y-2">
      <legend className="font-display text-sm font-bold text-sch-black">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <Chip key={o.valor} activo={seleccion.includes(o.valor)} onClick={() => alternar(o.valor)}>
            {o.etiqueta}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

/** Título de sección con la línea verde fina del sitio. */
export function TituloSeccion({ children, accion, as: Tag = 'h2' }: { children: ReactNode; accion?: ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <div className="titulo-seccion flex flex-wrap items-end justify-between gap-3">
      <Tag className={Tag === 'h1' ? 'text-3xl sm:text-[40px] sm:leading-tight' : 'text-xl sm:text-[25px] font-semibold'}>{children}</Tag>
      {accion}
    </div>
  )
}
