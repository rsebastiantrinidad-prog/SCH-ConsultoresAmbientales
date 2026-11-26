import { BellRing, Briefcase, CalendarCheck, FileCheck2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarraSegmentada, BarrasHorizontales, Columnas, Leyenda, ListaMedidores, TarjetaCifra, TarjetaGrafico, type Parte,
} from './Graficos'
import { Chip, ESTILO_DOCUMENTO, ESTILO_SEMAFORO, TituloSeccion } from './ui'
import { ORDEN_ESTADOS, estadisticas } from '../lib/estadisticas'
import { fechaCorta, nombreMes } from '../lib/formato'
import { useDemo } from '../lib/store'
import type { Semaforo } from '../lib/tipos'
import { nombreUsuario, useUsuario } from '../lib/usuario'

const SEMAFOROS: Semaforo[] = ['verde', 'ambar', 'rojo']

const partesSemaforo = (s: Record<Semaforo, number>): Parte[] =>
  SEMAFOROS.map((k) => ({ etiqueta: ESTILO_SEMAFORO[k].etiqueta, valor: s[k], clase: ESTILO_SEMAFORO[k].clase, Icono: ESTILO_SEMAFORO[k].Icono }))

type Serie = 'renovaciones' | 'visitas'

/** Estadísticas de la cartera: cifras clave y gráficos, filtrados por el responsable elegido. */
export default function EstadisticasCartera() {
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const [serie, setSerie] = useState<Serie>('renovaciones')
  const e = estadisticas(datos, hoy, usuario)
  const alDia = e.documentos.vigente + e.documentos.en_revision
  const mesActual = e.por_mes[0]?.mes
  const totalSerie = e.por_mes.reduce((n, m) => n + m[serie], 0)
  const mesPico = e.por_mes.reduce((a, b) => (b[serie] > a[serie] ? b : a), e.por_mes[0])

  return (
    <section className="space-y-5" aria-labelledby="titulo-estadisticas">
      <TituloSeccion
        accion={<span className="font-sans text-sm font-normal text-sch-muted">{usuario === 'todos' ? 'Toda la cartera' : `Cartera de ${nombreUsuario(usuario)}`} · al {fechaCorta(hoy)}</span>}
      >
        <span id="titulo-estadisticas">Estadísticas de la cartera</span>
      </TituloSeccion>

      {/* Cifras clave */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaCifra i={0} titulo="Documentación al día" valor={e.pct_al_dia} sufijo="%" medidor={e.pct_al_dia} detalle={`${alDia} de ${e.documentos_total} documentos vigentes o en revisión`} Icono={FileCheck2} />
        <TarjetaCifra i={1} titulo="Servicios activos" valor={e.servicios_activos} detalle="En curso o vigentes" Icono={Briefcase} />
        <TarjetaCifra i={2} titulo="Visitas y auditorías" valor={e.visitas_30} detalle="Programadas en los próximos 30 días" Icono={CalendarCheck} />
        <TarjetaCifra i={3} titulo="Avisos enviados" valor={e.avisos_30} detalle="Últimos 30 días (simulados en el demo)" Icono={BellRing} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Semáforo */}
        <TarjetaGrafico
          i={0}
          titulo="Semáforo de la cartera"
          subtitulo="Cómo está la documentación de cada cliente"
          tabla={[
            ['Responsable', ...SEMAFOROS.map((k) => ESTILO_SEMAFORO[k].etiqueta)],
            ...e.semaforo_por_responsable.map((r) => [r.nombre, ...SEMAFOROS.map((k) => r.semaforo[k])]),
          ]}
        >
          <div className="space-y-4">
            <BarraSegmentada etiqueta="Clientes por semáforo" partes={partesSemaforo(e.semaforo)} />
            <Leyenda partes={partesSemaforo(e.semaforo)} />
            {e.semaforo_por_responsable.length > 1 && (
              <ul className="space-y-2.5 border-t border-sch-black/10 pt-4">
                {e.semaforo_por_responsable.map((r) => {
                  const total = SEMAFOROS.reduce((n, k) => n + r.semaforo[k], 0)
                  return (
                    <li key={r.id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
                      <span className="font-display font-bold">{r.nombre}</span>
                      <BarraSegmentada fina etiqueta={`Clientes de ${r.nombre}`} partes={partesSemaforo(r.semaforo)} />
                      <span className="col-start-2 text-xs text-sch-muted tabular-nums sm:col-start-auto">
                        {total} {total === 1 ? 'cliente' : 'clientes'} · {r.semaforo.rojo} urgente{r.semaforo.rojo === 1 ? '' : 's'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </TarjetaGrafico>

        {/* Documentación por estado */}
        <TarjetaGrafico
          i={1}
          titulo="Estado de la documentación"
          subtitulo={`${e.documentos_total} documentos de servicios contratados`}
          tabla={[['Estado', 'Documentos'], ...ORDEN_ESTADOS.map((k) => [ESTILO_DOCUMENTO[k].etiqueta, e.documentos[k]])]}
        >
          <BarrasHorizontales
            filas={ORDEN_ESTADOS.map((k) => ({ etiqueta: ESTILO_DOCUMENTO[k].etiqueta, valor: e.documentos[k], clase: ESTILO_DOCUMENTO[k].clase, Icono: ESTILO_DOCUMENTO[k].Icono }))}
          />
          <p className="mt-3 text-xs text-sch-muted">"Por vencer" avisa con 60 días de anticipación (valor de ejemplo). Las propuestas todavía no cuentan.</p>
        </TarjetaGrafico>

        {/* Próximos 12 meses */}
        <TarjetaGrafico
          i={2}
          className="lg:col-span-2"
          titulo="Lo que viene en los próximos 12 meses"
          subtitulo={
            totalSerie
              ? `${totalSerie} ${serie === 'renovaciones' ? 'renovaciones de documentos' : 'visitas y auditorías'} · el mes más cargado es ${nombreMes(mesPico.mes)}`
              : 'Sin fechas en el período'
          }
          tabla={[['Mes', 'Renovaciones', 'Visitas y auditorías'], ...e.por_mes.map((m) => [nombreMes(m.mes), m.renovaciones, m.visitas])]}
        >
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Qué mostrar">
            <Chip activo={serie === 'renovaciones'} onClick={() => setSerie('renovaciones')}>
              Renovaciones de documentos
            </Chip>
            <Chip activo={serie === 'visitas'} onClick={() => setSerie('visitas')}>
              Visitas y auditorías
            </Chip>
          </div>
          <Columnas
            key={serie}
            unidad={serie === 'renovaciones' ? 'renovaciones' : 'visitas y auditorías'}
            columnas={e.por_mes.map((m) => ({
              etiqueta: nombreMes(m.mes).replace(/^(\w{3})\w* de \d{2}(\d{2})$/, '$1'),
              detalle: nombreMes(m.mes),
              valor: m[serie],
              destacada: m.mes === mesActual,
            }))}
          />
          <p className="mt-2 text-xs text-sch-muted">El mes actual va en verde claro. Pasá el mouse (o usá Tab) sobre una columna para ver el detalle.</p>
        </TarjetaGrafico>

        {/* Servicios por tipo */}
        <TarjetaGrafico
          i={3}
          titulo="Servicios por tipo"
          subtitulo={`${e.servicios_activos} servicios activos`}
          tabla={[['Tipo', 'Servicios'], ...e.servicios_por_categoria.map((c) => [c.nombre, c.cantidad])]}
        >
          <BarrasHorizontales filas={e.servicios_por_categoria.map((c) => ({ etiqueta: c.nombre, valor: c.cantidad }))} />
        </TarjetaGrafico>

        {/* Trámites en curso */}
        <TarjetaGrafico
          i={4}
          titulo="Trámites en curso"
          subtitulo="Del menos avanzado al más avanzado"
          tabla={[['Trámite', 'Avance'], ...e.tramites.map((t) => [`${t.cliente} · ${t.servicio}`, `${t.avance}%`])]}
        >
          {e.tramites.length === 0 ? (
            <p className="text-sm text-sch-muted">No hay trámites en curso.</p>
          ) : (
            <ListaMedidores
              filas={e.tramites.map((t) => ({
                clave: `${t.cliente_id}-${t.servicio}`,
                titulo: (
                  <>
                    <Link to={`/clientes/${t.cliente_id}?tab=seguimiento`} className="font-semibold">
                      {t.cliente.replace(/ \(demo\)$/, '')}
                    </Link>{' '}
                    <span className="text-sch-muted">· {t.servicio}</span>
                  </>
                ),
                detalle: t.etapa ? `Etapa: ${t.etapa}` : undefined,
                valor: t.avance,
              }))}
            />
          )}
        </TarjetaGrafico>
      </div>
    </section>
  )
}
