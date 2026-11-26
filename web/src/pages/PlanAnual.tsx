import { ClipboardCheck, MapPin, Move, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BannerFoto } from '../components/Foto'
import Modal from '../components/Modal'
import { Semaforo, TituloSeccion } from '../components/ui'
import { diasEntre, fechaCorta, fechaLarga, mesDe, nombreMes, sumarMesesAMes } from '../lib/formato'
import { planAnual, semaforoCliente, type EventoPlan, type FilaPlan, type TipoEventoPlan } from '../lib/reglas'
import { api, useDemo } from '../lib/store'
import { nombreUsuario, useUsuario } from '../lib/usuario'

const TIPO: Record<TipoEventoPlan, { etiqueta: string; singular: string; plural: string; Icono: typeof MapPin; clase: string }> = {
  visita: { etiqueta: 'Visita', singular: 'visita', plural: 'visitas', Icono: MapPin, clase: 'bg-sch-mint text-sch-black' },
  auditoria: { etiqueta: 'Auditoría', singular: 'auditoría', plural: 'auditorías', Icono: ClipboardCheck, clase: 'bg-sch-black text-white' },
  renovacion: { etiqueta: 'Renovación', singular: 'renovación', plural: 'renovaciones', Icono: RefreshCw, clase: 'bg-sch-amber text-sch-black' },
}

const mesCorto = (mes: string) => nombreMes(mes).replace(/^(\w{3})\w* de (\d{2})(\d{2})$/, '$1 $3')

export default function PlanAnual() {
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const [params, setParams] = useSearchParams()
  const [moviendo, setMoviendo] = useState<{ fila: FilaPlan; evento: EventoPlan } | null>(null)

  const clientes = datos.clientes
    .filter((c) => usuario === 'todos' || c.responsable_id === usuario)
    .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
  const elegido = clientes.find((c) => c.id === params.get('cliente')) ?? clientes[0]
  const desde = mesDe(hoy)
  const meses = Array.from({ length: 12 }, (_, i) => sumarMesesAMes(desde, i))

  if (!elegido) {
    return (
      <div className="space-y-4">
        <TituloSeccion as="h1">Plan anual</TituloSeccion>
        <p className="text-sch-muted">No hay clientes para mostrar.</p>
      </div>
    )
  }

  const plan = planAnual(datos, elegido.id, desde)
  const todos = plan.flatMap((f) => f.eventos)
  const cuenta = (t: TipoEventoPlan) => todos.filter((e) => e.tipo === t).length

  return (
    <div className="space-y-5">
      <TituloSeccion as="h1">Plan anual</TituloSeccion>

      <BannerFoto nombre="auditoria-planta" posicion="20% 30%" className="rounded-[4px] px-5 py-6 sm:px-8 sm:py-8">
        <p className="max-w-xl font-[family-name:var(--font-titulo)] text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
          Los servicios del año, <span className="acento">planificados</span> y a la vista.
        </p>
        <p className="mt-2 max-w-xl text-sm text-white/85">Visitas, auditorías y renovaciones de cada cliente en los próximos 12 meses, para ofrecerlos ordenados.</p>
      </BannerFoto>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="block space-y-1">
          <span className="font-display text-sm font-bold">Cliente</span>
          <select className="campo block w-full min-w-72" value={elegido.id} onChange={(e) => setParams({ cliente: e.target.value }, { replace: true })}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 pb-1 text-sm">
          <Semaforo valor={semaforoCliente(datos, elegido.id, hoy)} />
          <span className="text-sch-muted">
            {elegido.rubro} · {nombreUsuario(elegido.responsable_id)} ·{' '}
            <Link to={`/clientes/${elegido.id}`}>Ver ficha</Link>
          </span>
        </div>
      </div>

      {/* Resumen y leyenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[4px] bg-sch-surface px-4 py-3 text-sm">
        <span className="font-display font-bold first-letter:uppercase">
          {nombreMes(desde)} a {nombreMes(meses[11])}
        </span>
        {(Object.keys(TIPO) as TipoEventoPlan[]).map((t) => {
          const { singular, plural, Icono, clase } = TIPO[t]
          return (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-[3px] ${clase}`}>
                <Icono className="h-3 w-3" aria-hidden />
              </span>
              <strong className="tabular-nums">{cuenta(t)}</strong> {cuenta(t) === 1 ? singular : plural}
            </span>
          )
        })}
        <span className="inline-flex items-center gap-1.5 text-sch-muted">
          <Move className="h-3.5 w-3.5" aria-hidden />
          Tocá la próxima visita o auditoría para moverla
        </span>
      </div>

      {plan.length === 0 ? (
        <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">Este cliente no tiene servicios activos.</p>
      ) : (
        <div className="overflow-x-auto rounded-[4px] border border-sch-black/10">
          <table className="w-full min-w-[1040px] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-44" />
              {meses.map((m) => (
                <col key={m} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b-2 border-sch-black">
                <th scope="col" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-display font-bold">
                  Servicio
                </th>
                {meses.map((m) => (
                  <th key={m} scope="col" className={`px-1 py-2 text-center font-display font-bold capitalize ${m === desde ? 'bg-sch-mint/30' : ''}`}>
                    {mesCorto(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.map((fila) => (
                <tr key={fila.servicio.id} className="border-b border-sch-black/10">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-3 text-left align-top font-normal">
                    <span className="block font-display font-bold">{fila.nombre}</span>
                    <span className="block text-xs text-sch-muted">
                      {fila.servicio.periodicidad_meses ? `Cada ${fila.servicio.periodicidad_meses} meses` : 'Trámite único'}
                    </span>
                  </th>
                  {meses.map((m) => {
                    const eventos = fila.eventos.filter((e) => mesDe(e.fecha) === m)
                    return (
                      <td key={m} className={`h-16 border-l border-sch-black/5 px-1 py-1.5 align-top ${m === desde ? 'bg-sch-mint/10' : ''}`}>
                        <div className="flex flex-col gap-1">
                          {eventos.map((e) => (
                            <Evento key={e.id} e={e} hoy={hoy} onMover={() => setMoviendo({ fila, evento: e })} />
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista cronológica: el detalle completo (y la vista cómoda en el celular) */}
      {todos.length > 0 && (
        <section className="space-y-2" aria-labelledby="titulo-cronologia">
          <h2 id="titulo-cronologia" className="titulo-seccion text-xl font-semibold sm:text-[25px]">
            En orden de fecha
          </h2>
          <ul className="lista-animada divide-y divide-sch-black/10">
            {plan
              .flatMap((fila) => fila.eventos.map((e) => ({ fila, e })))
              .sort((a, b) => a.e.fecha.localeCompare(b.e.fecha))
              .map(({ fila, e }) => {
                const { etiqueta, Icono, clase } = TIPO[e.tipo]
                return (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="w-24 shrink-0 font-display font-bold tabular-nums">{fechaCorta(e.fecha)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-xs font-bold ${clase}`}>
                      <Icono className="h-3 w-3" aria-hidden />
                      {etiqueta}
                    </span>
                    <span className="order-last min-w-0 basis-full sm:order-none sm:basis-0 sm:flex-1">
                      {e.titulo} <span className="text-sch-muted">· {fila.nombre}</span>
                    </span>
                    {e.movible && (
                      <button type="button" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-sch-green-dark underline sm:ml-0" onClick={() => setMoviendo({ fila, evento: e })}>
                        <Move className="h-3.5 w-3.5" aria-hidden />
                        Mover
                      </button>
                    )}
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {moviendo && (
        <ModalMover
          fila={moviendo.fila}
          evento={moviendo.evento}
          onCerrar={() => setMoviendo(null)}
        />
      )}
    </div>
  )
}

function Evento({ e, hoy, onMover }: { e: EventoPlan; hoy: string; onMover: () => void }) {
  const { etiqueta, Icono, clase } = TIPO[e.tipo]
  const vencida = e.tipo === 'renovacion' && diasEntre(hoy, e.fecha) < 0
  const contenido = (
    <>
      <span className="flex items-center gap-1">
        <Icono className="h-3 w-3 shrink-0" aria-hidden />
        <span className="font-bold tabular-nums">{Number(e.fecha.slice(8))}</span>
      </span>
      <span className="line-clamp-2 hyphens-auto break-words">{e.tipo === 'renovacion' ? e.titulo.replace(/^Renovar /, '') : etiqueta}</span>
    </>
  )
  const base = `flex w-full flex-col gap-0.5 rounded-[3px] px-1.5 py-1 text-left text-[11px] leading-tight ${vencida ? 'bg-sch-red text-white' : clase}`
  const titulo = `${e.titulo} · ${fechaLarga(e.fecha)}`
  return e.movible ? (
    <button type="button" onClick={onMover} title={`${titulo} (tocá para moverla)`} className={`${base} ring-2 ring-offset-1 ring-sch-green-dark hover:opacity-90`}>
      {contenido}
    </button>
  ) : (
    <span title={titulo} className={base}>
      {contenido}
    </span>
  )
}

function ModalMover({ fila, evento, onCerrar }: { fila: FilaPlan; evento: EventoPlan; onCerrar: () => void }) {
  const [fecha, setFecha] = useState(evento.fecha)
  const periodicidad = fila.servicio.periodicidad_meses
  return (
    <Modal
      titulo={`Mover ${TIPO[evento.tipo].etiqueta.toLowerCase()}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton-principal"
            disabled={!fecha || fecha === evento.fecha}
            onClick={() => {
              api.moverProximaFecha(fila.servicio.id, fecha)
              onCerrar()
            }}
          >
            Mover
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p>
          <strong>{fila.nombre}</strong>: {TIPO[evento.tipo].etiqueta.toLowerCase()} del {fechaCorta(evento.fecha)}.
        </p>
        <label className="block space-y-1">
          <span className="font-display text-sm font-bold">Nueva fecha</span>
          <input type="date" className="campo block" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        {periodicidad && <p className="text-sm text-sch-muted">Las siguientes se corren con esta (cada {periodicidad} meses). El recordatorio se actualiza solo y queda una nota en la bitácora.</p>}
      </div>
    </Modal>
  )
}
