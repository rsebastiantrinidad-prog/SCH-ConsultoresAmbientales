/**
 * Pestañas de la ficha de cliente: Resumen, Servicios, Seguimiento, Recordatorios y Notas.
 * (Documentación va en su propio archivo.) Todas leen del store y cambian datos solo con `api`.
 */
import { Bot, ChevronLeft, ChevronRight, CircleCheck, CircleDashed, CircleDot, Plus, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { fechaCorta, relativo } from '../../lib/formato'
import {
  avance, derivarRecordatorios, documentosDeCliente, esFaltante, estadoDocumento, etapaActual, etapasDeServicio, recordatorioDeDocumento,
} from '../../lib/reglas'
import { api, useDemo } from '../../lib/store'
import type { EstadoDocumento, Nota, Recordatorio } from '../../lib/tipos'
import { nombreUsuario } from '../../lib/usuario'
import FilaRecordatorio from '../FilaRecordatorio'
import Modal from '../Modal'
import { EstadoDocumentoPastilla, TituloSeccion } from '../ui'
import { BarraAvance, EstadoServicioPastilla, FotoServicio, Vacio, categoriaServicio, nombreServicio } from './comun'
import ModalAgregarServicio from './ModalAgregarServicio'

export type Pestana = 'resumen' | 'servicios' | 'documentacion' | 'seguimiento' | 'recordatorios' | 'notas'

export interface PropsPestana {
  clienteId: string
  irA: (p: Pestana) => void
  onAviso: (r: Recordatorio) => void
}

const GRAVEDAD: Partial<Record<EstadoDocumento, number>> = { vencido: 0, observado: 1, pendiente: 2, por_vencer: 3 }

// ---------------------------------------------------------------- Resumen

export function Resumen({ clienteId, irA, onAviso }: PropsPestana) {
  const { hoy, datos } = useDemo()
  const servicios = datos.servicios.filter((s) => s.cliente_id === clienteId)
  const urgentes = documentosDeCliente(datos, clienteId)
    .map((d) => ({ d, e: estadoDocumento(d, hoy) }))
    .filter(({ d, e }) => e === 'vencido' || e === 'observado' || e === 'por_vencer' || esFaltante(d, hoy))
    .sort((a, b) => (GRAVEDAD[a.e] ?? 9) - (GRAVEDAD[b.e] ?? 9) || (a.d.vigente_hasta ?? a.d.fecha_objetivo ?? '').localeCompare(b.d.vigente_hasta ?? b.d.fecha_objetivo ?? ''))
  const notas = datos.notas.filter((n) => n.cliente_id === clienteId).slice(-3).reverse()

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="space-y-3 lg:col-span-2">
        <TituloSeccion accion={<button type="button" onClick={() => irA('documentacion')} className="text-sm font-semibold text-sch-green-dark underline">Ver documentación</button>}>
          Qué vence y qué falta
        </TituloSeccion>
        {urgentes.length === 0 ? (
          <Vacio>Toda la documentación está al día.</Vacio>
        ) : (
          <ul className="lista-animada divide-y divide-sch-black/10">
            {urgentes.map(({ d, e }) => {
              const s = servicios.find((x) => x.id === d.servicio_cliente_id)!
              const fecha = d.vigente_hasta ?? d.fecha_objetivo
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                  <EstadoDocumentoPastilla valor={e} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-bold">{d.nombre}</span>
                    <span className="block text-sm text-sch-muted">
                      {nombreServicio(datos, s)}
                      {e === 'observado' && d.observacion ? ` · ${d.observacion}` : fecha ? ` · ${e === 'vencido' ? 'venció' : e === 'pendiente' ? 'se necesita' : 'vence'} ${relativo(hoy, fecha)} (${fechaCorta(fecha)})` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-sch-green-dark px-3 py-1 font-display text-sm font-bold text-sch-green-dark hover:bg-sch-surface"
                    onClick={() => {
                      const r = recordatorioDeDocumento(datos, d.id, hoy)
                      if (r) onAviso(r)
                    }}
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Pedir al cliente
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="space-y-8">
        <section className="space-y-3">
          <TituloSeccion>Servicios</TituloSeccion>
          {servicios.length === 0 ? (
            <Vacio>Sin servicios todavía.</Vacio>
          ) : (
            <ul className="space-y-3">
              {servicios.map((s) => {
                const etapas = etapasDeServicio(datos, s.id)
                const actual = etapaActual(etapas)
                return (
                  <li key={s.id} className="space-y-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold">{nombreServicio(datos, s)}</span>
                      <EstadoServicioPastilla valor={s.estado} />
                    </span>
                    <BarraAvance valor={avance(etapas)} etiqueta={`Avance de ${nombreServicio(datos, s)}`} />
                    {s.estado === 'en_curso' && actual && <span className="block text-xs text-sch-muted">Etapa: {actual.nombre}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <TituloSeccion accion={<button type="button" onClick={() => irA('notas')} className="text-sm font-semibold text-sch-green-dark underline">Ver todas</button>}>
            Últimas notas
          </TituloSeccion>
          {notas.length === 0 ? <Vacio>Sin notas.</Vacio> : <ListaNotas notas={notas} />}
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Servicios

export function Servicios({ clienteId, irA }: PropsPestana) {
  const { hoy, datos } = useDemo()
  const [agregando, setAgregando] = useState(false)
  const servicios = datos.servicios.filter((s) => s.cliente_id === clienteId)

  return (
    <section className="space-y-4">
      <TituloSeccion
        accion={
          <button type="button" className="boton-principal" onClick={() => setAgregando(true)}>
            Agregar servicio
          </button>
        }
      >
        Servicios contratados
      </TituloSeccion>
      {servicios.length === 0 ? (
        <Vacio>Todavía no tiene servicios.</Vacio>
      ) : (
        <ul className="lista-animada grid gap-3 md:grid-cols-2">
          {servicios.map((s) => {
            const etapas = etapasDeServicio(datos, s.id)
            const actual = etapaActual(etapas)
            const docs = datos.documentos.filter((d) => d.servicio_cliente_id === s.id)
            const vigentes = docs.filter((d) => estadoDocumento(d, hoy) === 'vigente').length
            return (
              <li key={s.id} className="overflow-hidden rounded-[4px] border border-sch-black/15">
                <FotoServicio categoria={categoriaServicio(datos, s)} />
                <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">{nombreServicio(datos, s)}</h3>
                  <EstadoServicioPastilla valor={s.estado} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-sch-muted">Periodicidad</dt>
                  <dd>{s.periodicidad_meses ? `Cada ${s.periodicidad_meses} meses` : 'Trámite único'}</dd>
                  <dt className="text-sch-muted">Próxima visita</dt>
                  <dd>{s.proxima_fecha ? `${fechaCorta(s.proxima_fecha)} (${relativo(hoy, s.proxima_fecha)})` : '—'}</dd>
                  <dt className="text-sch-muted">Responsable</dt>
                  <dd>{nombreUsuario(s.responsable_id)}</dd>
                  <dt className="text-sch-muted">Inicio</dt>
                  <dd>{fechaCorta(s.inicio)}</dd>
                  <dt className="text-sch-muted">Etapa</dt>
                  <dd>{actual ? actual.nombre : 'Todas hechas'}</dd>
                </dl>
                <BarraAvance valor={avance(etapas)} etiqueta={`Avance de ${nombreServicio(datos, s)}`} />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <button type="button" className="font-semibold text-sch-green-dark underline" onClick={() => irA('documentacion')}>
                    Documentación ({vigentes} de {docs.length} vigentes)
                  </button>
                  <button type="button" className="font-semibold text-sch-green-dark underline" onClick={() => irA('seguimiento')}>
                    Seguimiento
                  </button>
                </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {agregando && <ModalAgregarServicio clienteId={clienteId} onCerrar={() => setAgregando(false)} />}
    </section>
  )
}

// ---------------------------------------------------------------- Seguimiento

export function Seguimiento({ clienteId }: PropsPestana) {
  const { datos } = useDemo()
  const servicios = datos.servicios.filter((s) => s.cliente_id === clienteId)
  const [nota, setNota] = useState<Record<string, string>>({})
  const [confirmar, setConfirmar] = useState<{ servicioId: string; accion: 'avanzar' | 'retroceder'; titulo: string; detalle: string } | null>(null)

  return (
    <div className="space-y-8">
      {confirmar && <ConfirmarEtapa {...confirmar} clienteId={clienteId} onCerrar={() => setConfirmar(null)} />}
      {servicios.length === 0 && <Vacio>Sin servicios para seguir.</Vacio>}
      {servicios.map((s) => {
        const etapas = etapasDeServicio(datos, s.id)
        const actual = etapaActual(etapas)
        const hechas = etapas.filter((e) => e.estado === 'hecha').length
        const bitacora = datos.notas.filter((n) => n.servicio_cliente_id === s.id).slice().reverse()
        const agregar = (e: FormEvent) => {
          e.preventDefault()
          api.agregarNota(clienteId, nota[s.id] ?? '', s.id)
          setNota({ ...nota, [s.id]: '' })
        }
        return (
          <section key={s.id} className="space-y-4">
            <TituloSeccion accion={<EstadoServicioPastilla valor={s.estado} />}>{nombreServicio(datos, s)}</TituloSeccion>
            <BarraAvance valor={avance(etapas)} etiqueta={`Avance de ${nombreServicio(datos, s)}`} />

            {/* Línea de pasos: horizontal en compu, vertical en el celular */}
            <ol className="flex flex-col gap-2 md:flex-row md:gap-0">
              {etapas.map((e, i) => {
                const Icono = e.estado === 'hecha' ? CircleCheck : e.estado === 'en_curso' ? CircleDot : CircleDashed
                return (
                  <li key={e.id} className="flex items-start gap-2 md:flex-1 md:flex-col md:items-center md:text-center">
                    <span className="flex items-center md:w-full">
                      <span className={`hidden h-0.5 flex-1 md:block ${i === 0 ? 'opacity-0' : e.estado === 'pendiente' ? 'bg-sch-black/15' : 'bg-sch-green'}`} />
                      <Icono className={`h-7 w-7 shrink-0 ${e.estado === 'hecha' ? 'text-sch-green-dark' : e.estado === 'en_curso' ? 'text-sch-black' : 'text-sch-muted'}`} aria-hidden />
                      <span className={`hidden h-0.5 flex-1 md:block ${i === etapas.length - 1 ? 'opacity-0' : etapas[i + 1]?.estado === 'pendiente' ? 'bg-sch-black/15' : 'bg-sch-green'}`} />
                    </span>
                    <span className="md:px-1">
                      <span className={`block text-sm ${e.estado === 'en_curso' ? 'font-display font-bold' : ''}`}>{e.nombre}</span>
                      <span className="block text-xs text-sch-muted">
                        {e.estado === 'hecha' ? `Hecha el ${fechaCorta(e.fecha_real ?? e.fecha_prevista)}` : e.estado === 'en_curso' ? 'En curso' : `Prevista ${fechaCorta(e.fecha_prevista)}`}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="boton-secundario"
                disabled={hechas === 0}
                onClick={() => {
                  const ultima = [...etapas].reverse().find((e) => e.estado === 'hecha')!
                  setConfirmar({ servicioId: s.id, accion: 'retroceder', titulo: `Volver a "${ultima.nombre}"`, detalle: `"${ultima.nombre}" vuelve a quedar en curso.` })
                }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Retroceder
              </button>
              <button
                type="button"
                className="boton-principal"
                disabled={!actual}
                onClick={() => {
                  const siguiente = etapas.find((e) => actual && e.orden > actual.orden)
                  setConfirmar({
                    servicioId: s.id,
                    accion: 'avanzar',
                    titulo: `Marcar hecha "${actual!.nombre}"`,
                    detalle: siguiente ? `El avance pasa al ${Math.round(((hechas + 1) / etapas.length) * 100)}% y sigue "${siguiente.nombre}".` : 'Es la última etapa: el trámite queda completo y el servicio, vigente.',
                  })
                }}
              >
                {actual ? `Marcar hecha: ${actual.nombre}` : 'Trámite completo'}
                {actual && <ChevronRight className="h-4 w-4" aria-hidden />}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold">Bitácora</h3>
              <form onSubmit={agregar} className="flex flex-col gap-2 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">Nota para la bitácora de {nombreServicio(datos, s)}</span>
                  <input
                    className="campo w-full"
                    value={nota[s.id] ?? ''}
                    onChange={(e) => setNota({ ...nota, [s.id]: e.target.value })}
                    placeholder="Dejá una nota sobre este trámite"
                  />
                </label>
                <button type="submit" className="boton-secundario self-start" disabled={!(nota[s.id] ?? '').trim()}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Agregar nota
                </button>
              </form>
              {bitacora.length === 0 ? <p className="text-sm text-sch-muted">Sin entradas todavía.</p> : <ListaNotas notas={bitacora} />}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** Confirma avanzar o retroceder una etapa; opcionalmente deja una nota en la bitácora en el mismo paso. */
function ConfirmarEtapa({
  servicioId, clienteId, accion, titulo, detalle, onCerrar,
}: {
  servicioId: string
  clienteId: string
  accion: 'avanzar' | 'retroceder'
  titulo: string
  detalle: string
  onCerrar: () => void
}) {
  const [texto, setTexto] = useState('')
  function confirmar() {
    if (accion === 'avanzar') api.avanzarEtapa(servicioId)
    else api.retrocederEtapa(servicioId)
    if (texto.trim()) api.agregarNota(clienteId, texto, servicioId)
    onCerrar()
  }
  return (
    <Modal
      titulo={titulo}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className="boton-principal" onClick={confirmar}>
            {accion === 'avanzar' ? 'Marcar hecha' : 'Retroceder'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p>{detalle}</p>
        <label className="block space-y-1">
          <span className="font-display text-sm font-bold">Nota para la bitácora (opcional)</span>
          <textarea className="campo min-h-20 w-full" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Por ejemplo: se presentó el EIA en la mesa de entradas del organismo." />
        </label>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- Recordatorios

export function Recordatorios({ clienteId, onAviso }: PropsPestana) {
  const { datos } = useDemo()
  const lista = derivarRecordatorios(datos).filter((r) => r.cliente_id === clienteId)
  const pendientes = lista.filter((r) => r.estado !== 'hecho')
  const hechos = lista.filter((r) => r.estado === 'hecho')
  return (
    <section className="space-y-3">
      <TituloSeccion>Recordatorios del cliente</TituloSeccion>
      {lista.length === 0 ? (
        <Vacio>No hay recordatorios para este cliente.</Vacio>
      ) : (
        <ul className="lista-animada divide-y divide-sch-black/10">
          {[...pendientes, ...hechos].map((r) => (
            <FilaRecordatorio key={r.id} r={r} onAviso={onAviso} mostrarCliente={false} />
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- Notas

export function Notas({ clienteId }: PropsPestana) {
  const { datos } = useDemo()
  const [texto, setTexto] = useState('')
  const [servicio, setServicio] = useState('')
  const servicios = datos.servicios.filter((s) => s.cliente_id === clienteId)
  const notas = datos.notas.filter((n) => n.cliente_id === clienteId).slice().reverse()

  function agregar(e: FormEvent) {
    e.preventDefault()
    api.agregarNota(clienteId, texto, servicio || null)
    setTexto('')
  }

  return (
    <section className="space-y-4">
      <TituloSeccion>Notas</TituloSeccion>
      <form onSubmit={agregar} className="space-y-2 rounded-[4px] bg-sch-surface p-4">
        <label className="block">
          <span className="sr-only">Nueva nota</span>
          <textarea className="campo min-h-20 w-full" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí una nota sobre el cliente" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span>Sobre</span>
            <select className="campo" value={servicio} onChange={(e) => setServicio(e.target.value)}>
              <option value="">El cliente en general</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {nombreServicio(datos, s)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="boton-principal ml-auto" disabled={!texto.trim()}>
            Agregar nota
          </button>
        </div>
      </form>
      {notas.length === 0 ? <Vacio>Sin notas todavía.</Vacio> : <ListaNotas notas={notas} conServicio />}
    </section>
  )
}

function ListaNotas({ notas, conServicio = false }: { notas: Nota[]; conServicio?: boolean }) {
  const { datos } = useDemo()
  return (
    <ul className="lista-animada space-y-3">
      {notas.map((n) => {
        const s = n.servicio_cliente_id ? datos.servicios.find((x) => x.id === n.servicio_cliente_id) : null
        return (
          <li key={n.id} className={`border-l-2 pl-3 ${n.automatica ? 'border-sch-black/15' : 'border-sch-green'}`}>
            <p className={n.automatica ? 'text-sm text-sch-muted' : ''}>
              {n.automatica && <Bot className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-label="Automática" />}
              {n.texto}
            </p>
            <p className="text-xs text-sch-muted">
              {nombreUsuario(n.autor_id)} · {fechaCorta(n.fecha)}
              {conServicio && s ? ` · ${nombreServicio(datos, s)}` : ''}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
