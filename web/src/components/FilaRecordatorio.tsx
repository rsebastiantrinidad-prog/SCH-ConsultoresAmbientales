import { Check, Clock3, FolderOpen, Hourglass, MapPin, MessageSquareWarning, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { diaMes, diasEntre, relativo } from '../lib/formato'
import { api, useDemo } from '../lib/store'
import type { EstadoRecordatorio, Recordatorio, TipoRecordatorio } from '../lib/tipos'
import { nombreUsuario } from '../lib/usuario'

export const TIPO_RECORDATORIO: Record<TipoRecordatorio, { etiqueta: string; Icono: typeof Hourglass }> = {
  vencimiento: { etiqueta: 'Vencimiento', Icono: Hourglass },
  pedido_documentacion: { etiqueta: 'Pedido de documentación', Icono: FolderOpen },
  visita: { etiqueta: 'Visita', Icono: MapPin },
  seguimiento: { etiqueta: 'Seguimiento', Icono: MessageSquareWarning },
}

const ESTADO: Record<EstadoRecordatorio, string> = {
  programado: 'Programado',
  enviado: 'Aviso enviado',
  hecho: 'Hecho',
  pospuesto: 'Pospuesto',
}

const accion = 'inline-flex items-center gap-1 rounded-full border border-sch-black/25 px-2.5 py-1 font-display text-xs font-bold text-sch-ink transition hover:border-sch-black hover:bg-sch-surface'

/** Un recordatorio con sus acciones: marcar hecho, posponer 7 días y enviar aviso (simulado). */
export default function FilaRecordatorio({
  r, onAviso, mostrarCliente = true,
}: {
  r: Recordatorio
  onAviso: (r: Recordatorio) => void
  mostrarCliente?: boolean
}) {
  const { hoy, datos } = useDemo()
  const cliente = datos.clientes.find((c) => c.id === r.cliente_id)
  const { etiqueta, Icono } = TIPO_RECORDATORIO[r.tipo]
  const { dia, mes } = diaMes(r.fecha)
  const hecho = r.estado === 'hecho'
  const atrasado = !hecho && diasEntre(hoy, r.fecha) < 0

  return (
    <li className={`flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap ${hecho ? 'opacity-60' : ''}`}>
      <span className={`flex w-12 shrink-0 flex-col items-center rounded-[4px] py-1 leading-none text-white ${atrasado ? 'bg-sch-red' : 'bg-sch-black'}`} aria-hidden>
        <span className="font-display text-lg font-bold">{dia}</span>
        <span className="text-[11px] uppercase">{mes}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-sch-muted">
          <Icono className="h-3.5 w-3.5" aria-hidden />
          {etiqueta} ·{' '}
          <span className={atrasado ? 'font-bold text-sch-red' : ''}>{atrasado ? `atrasado, ${relativo(hoy, r.fecha)}` : relativo(hoy, r.fecha)}</span>
          {r.estado !== 'programado' && (
            <span className="rounded-full bg-sch-surface px-2 font-semibold text-sch-ink">{ESTADO[r.estado]}</span>
          )}
        </span>
        <span className={`block font-display font-bold ${hecho ? 'line-through' : ''}`}>{r.titulo}</span>
        <span className="block text-sm text-sch-muted">
          {mostrarCliente && cliente && (
            <>
              <Link to={`/clientes/${cliente.id}`}>{cliente.razon_social}</Link> ·{' '}
            </>
          )}
          {nombreUsuario(r.asignado_a)}
        </span>
      </span>
      {!hecho && (
        <span className="flex w-full flex-wrap gap-1.5 pl-[60px] sm:w-auto sm:pl-0">
          <button type="button" className={accion} onClick={() => api.marcarHecho(r.id)}>
            <Check className="h-3.5 w-3.5" aria-hidden />
            Hecho
          </button>
          <button type="button" className={accion} onClick={() => api.posponer(r.id)} title="Mueve la fecha 7 días">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            Posponer 7 días
          </button>
          <button type="button" className={`${accion} border-sch-green-dark text-sch-green-dark`} onClick={() => onAviso(r)}>
            <Send className="h-3.5 w-3.5" aria-hidden />
            Enviar aviso
          </button>
        </span>
      )}
    </li>
  )
}
