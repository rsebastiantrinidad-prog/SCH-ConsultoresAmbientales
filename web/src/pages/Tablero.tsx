import { CalendarClock, ChevronRight, ClipboardList, FileWarning, FolderOpen, Hourglass, MapPin, MessageSquareWarning, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import FiltroResponsable from '../components/FiltroResponsable'
import EstadisticasCartera from '../components/EstadisticasCartera'
import { BannerFoto } from '../components/Foto'
import TarjetaIndicador from '../components/TarjetaIndicador'
import { Semaforo, TituloSeccion } from '../components/ui'
import { diaMes, diasEntre, fechaLarga, relativo } from '../lib/formato'
import { compararFilas, filasClientes, indicadores, motivoSemaforo, recordatoriosSemana, semaforoCliente } from '../lib/reglas'
import { useDemo } from '../lib/store'
import type { Recordatorio, TipoRecordatorio } from '../lib/tipos'
import { nombreUsuario, useUsuario } from '../lib/usuario'

const TIPO: Record<TipoRecordatorio, { etiqueta: string; Icono: typeof CalendarClock }> = {
  vencimiento: { etiqueta: 'Vencimiento', Icono: Hourglass },
  pedido_documentacion: { etiqueta: 'Pedido de documentación', Icono: FolderOpen },
  visita: { etiqueta: 'Visita', Icono: MapPin },
  seguimiento: { etiqueta: 'Seguimiento', Icono: MessageSquareWarning },
}

export default function Tablero() {
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const ind = indicadores(datos, hoy, usuario)
  const semana = recordatoriosSemana(datos, hoy, usuario)
  const atencion = filasClientes(datos, hoy)
    .filter((f) => f.semaforo !== 'verde' && (usuario === 'todos' || f.cliente.responsable_id === usuario))
    .sort(compararFilas)
  const saludo = usuario === 'todos' ? 'Hola' : `Hola, ${nombreUsuario(usuario)}`

  return (
    <div className="space-y-8">
      {/* Encabezado: foto de planta con velo oscuro, tesis del demo y filtro por responsable */}
      <BannerFoto nombre="ingeniera-planta" prioridad posicion="70% center" className="-mx-4 -mt-6 px-4 pb-6 pt-7 sm:-mt-8 sm:rounded-b-[4px] lg:mx-0 lg:px-8">
        <p className="text-sm text-sch-mint first-letter:uppercase">{fechaLarga(hoy)}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white sm:text-[40px] sm:leading-tight">{saludo}</h1>
        <p className="mt-2 max-w-2xl text-lg text-white/90">
          Qué vence, qué falta y qué avanza, <span className="acento">sin abrir carpetas</span>.
        </p>
        <div className="mt-5">
          <FiltroResponsable claro />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaIndicador i={0} titulo="Clientes activos" valor={ind.clientes_activos} a="/clientes" Icono={Users} />
          <TarjetaIndicador
            i={1}
            titulo="Vencimientos en 30 días"
            valor={ind.vencimientos_30}
            detalle={ind.vencidos ? `y ${ind.vencidos} ya ${ind.vencidos === 1 ? 'vencido' : 'vencidos'}` : 'Nada vencido'}
            a="/clientes?ver=vencimientos"
            Icono={Hourglass}
          />
          <TarjetaIndicador
            i={2}
            titulo="Documentación faltante"
            valor={ind.documentacion_faltante}
            detalle={ind.documentacion_faltante ? `en ${ind.clientes_con_faltante} ${ind.clientes_con_faltante === 1 ? 'cliente' : 'clientes'}` : 'No falta nada'}
            a="/clientes?ver=faltante"
            Icono={FileWarning}
          />
          <TarjetaIndicador i={3} titulo="Trámites en curso" valor={ind.tramites_en_curso} a="/clientes?ver=tramites" Icono={ClipboardList} />
        </div>
      </BannerFoto>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Esta semana */}
        <section className="min-w-0 space-y-4 lg:col-span-2" aria-labelledby="titulo-semana">
          <TituloSeccion
            accion={
              <Link to="/recordatorios" className="text-sm font-semibold">
                Ver todos los recordatorios
              </Link>
            }
          >
            <span id="titulo-semana">Esta semana</span>
          </TituloSeccion>
          {semana.length === 0 ? (
            <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">No hay nada atrasado ni para los próximos 7 días.</p>
          ) : (
            <ul className="divide-y divide-sch-black/10">
              {semana.map(filaSemana)}
            </ul>
          )}
        </section>

        {/* Clientes que necesitan atención */}
        <section className="min-w-0 space-y-4" aria-labelledby="titulo-atencion">
          <TituloSeccion>
            <span id="titulo-atencion">Necesitan atención</span>
          </TituloSeccion>
          {atencion.length === 0 ? (
            <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">Todos los clientes están al día.</p>
          ) : (
            <ul className="space-y-2">
              {atencion.map((f, k) => (
                <li key={f.cliente.id} className="animar-entrada" style={{ '--i': k } as React.CSSProperties}>
                  <Link
                    to={`/clientes/${f.cliente.id}`}
                    className="levantar flex items-center justify-between gap-3 rounded-[4px] border border-sch-black/10 px-3 py-2.5 text-sch-ink no-underline hover:bg-sch-surface"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display font-bold">{f.cliente.razon_social}</span>
                      <span className="block text-xs text-sch-muted">{motivoSemaforo(datos, f.cliente.id, hoy)}</span>
                    </span>
                    <Semaforo valor={f.semaforo} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <EstadisticasCartera />
    </div>
  )

  function filaSemana(r: Recordatorio, k: number) {
    const cliente = datos.clientes.find((c) => c.id === r.cliente_id)
    const { etiqueta, Icono } = TIPO[r.tipo]
    const { dia, mes } = diaMes(r.fecha)
    const atrasado = diasEntre(hoy, r.fecha) < 0
    return (
      <li key={r.id} className="animar-entrada" style={{ '--i': k } as React.CSSProperties}>
        <Link to={`/clientes/${r.cliente_id}`} className="flex items-center gap-3 px-1 py-3 text-sch-ink no-underline transition hover:bg-sch-surface sm:gap-4">
          <span
            className={`flex w-12 shrink-0 flex-col items-center rounded-[4px] py-1 leading-none ${atrasado ? 'bg-sch-red text-white' : 'bg-sch-black text-white'}`}
            aria-hidden
          >
            <span className="font-display text-lg font-bold">{dia}</span>
            <span className="text-[11px] uppercase">{mes}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-sch-muted">
              <Icono className="h-3.5 w-3.5" aria-hidden />
              {etiqueta} · <span className={atrasado ? 'font-bold text-sch-red' : ''}>{atrasado ? `atrasado, ${relativo(hoy, r.fecha)}` : relativo(hoy, r.fecha)}</span>
              {r.estado !== 'programado' && <span> · {r.estado === 'pospuesto' ? 'pospuesto' : 'aviso enviado'}</span>}
            </span>
            <span className="block truncate font-display font-bold">{r.titulo}</span>
            <span className="block truncate text-sm text-sch-muted">
              {cliente?.razon_social} · {nombreUsuario(r.asignado_a)}
            </span>
          </span>
          <span className="hidden sm:block">
            <Semaforo valor={semaforoCliente(datos, r.cliente_id, hoy)} />
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-sch-muted" aria-hidden />
        </Link>
      </li>
    )
  }
}
