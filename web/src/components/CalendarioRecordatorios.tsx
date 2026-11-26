import { ChevronLeft, ChevronRight } from 'lucide-react'
import { diaMes, diasEntre, fechaLarga, mesDe, nombreMes, semanasDelMes, sumarMesesAMes } from '../lib/formato'
import { useDemo } from '../lib/store'
import type { Fecha, Recordatorio } from '../lib/tipos'
import FilaRecordatorio, { TIPO_RECORDATORIO } from './FilaRecordatorio'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAX_POR_DIA = 3

/**
 * Calendario mensual de recordatorios. En compu, grilla de lunes a domingo; en el celular, agenda por día.
 * Clic en un día muestra el detalle debajo, con las mismas acciones que la lista.
 */
export default function CalendarioRecordatorios({
  lista, mes, dia, onMes, onDia, onAviso,
}: {
  lista: Recordatorio[]
  mes: string
  dia: Fecha | null
  onMes: (mes: string) => void
  onDia: (dia: Fecha | null) => void
  onAviso: (r: Recordatorio) => void
}) {
  const { hoy } = useDemo()
  const porDia = new Map<Fecha, Recordatorio[]>()
  for (const r of lista) porDia.set(r.fecha, [...(porDia.get(r.fecha) ?? []), r])
  const semanas = semanasDelMes(mes)
  const delMes = [...porDia.entries()].filter(([f]) => mesDe(f) === mes).sort(([a], [b]) => a.localeCompare(b))
  const delDia = dia ? (porDia.get(dia) ?? []) : []

  return (
    <div className="space-y-4">
      {/* Navegación de mes */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onMes(sumarMesesAMes(mes, -1))} className="rounded-full border border-sch-black/25 p-1.5 hover:border-sch-black" aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <h2 className="min-w-48 text-center text-xl font-semibold first-letter:uppercase" aria-live="polite">
          {nombreMes(mes)}
        </h2>
        <button type="button" onClick={() => onMes(sumarMesesAMes(mes, 1))} className="rounded-full border border-sch-black/25 p-1.5 hover:border-sch-black" aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        {mes !== mesDe(hoy) && (
          <button type="button" className="boton-secundario ml-1 py-1" onClick={() => { onMes(mesDe(hoy)); onDia(hoy) }}>
            Hoy
          </button>
        )}
        <span className="ml-auto text-sm text-sch-muted">
          {delMes.reduce((n, [, rs]) => n + rs.length, 0)} recordatorios en el mes
        </span>
      </div>

      {/* Compu: grilla */}
      <table className="hidden w-full table-fixed border-collapse md:table">
        <thead>
          <tr>
            {DIAS.map((d) => (
              <th key={d} scope="col" className="pb-1 text-left font-display text-sm font-bold text-sch-muted">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0]}>
              {semana.map((f) => {
                const rs = porDia.get(f) ?? []
                const otroMes = mesDe(f) !== mes
                const esHoy = f === hoy
                const elegido = f === dia
                return (
                  <td key={f} className="h-28 border border-sch-black/10 p-0 align-top">
                    <button
                      type="button"
                      onClick={() => onDia(elegido ? null : f)}
                      aria-pressed={elegido}
                      aria-label={`${fechaLarga(f)}: ${rs.length ? `${rs.length} recordatorios` : 'sin recordatorios'}`}
                      className={`flex h-full w-full flex-col gap-1 p-1.5 text-left transition hover:bg-sch-surface ${otroMes ? 'bg-sch-surface/60 text-sch-muted' : ''} ${elegido ? 'outline outline-2 -outline-offset-2 outline-sch-black' : ''}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-display text-sm font-bold ${esHoy ? 'bg-sch-mint text-sch-black' : ''}`}
                      >
                        {Number(f.slice(8))}
                      </span>
                      {rs.slice(0, MAX_POR_DIA).map((r) => (
                        <Etiqueta key={r.id} r={r} hoy={hoy} />
                      ))}
                      {rs.length > MAX_POR_DIA && <span className="text-xs font-semibold">+{rs.length - MAX_POR_DIA} más</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detalle del día elegido (compu) */}
      {dia && (
        <section className="hidden space-y-1 md:block" aria-label={`Recordatorios del ${fechaLarga(dia)}`}>
          <h3 className="font-display text-lg font-bold first-letter:uppercase">{fechaLarga(dia)}</h3>
          {delDia.length === 0 ? (
            <p className="text-sm text-sch-muted">Sin recordatorios ese día.</p>
          ) : (
            <ul className="divide-y divide-sch-black/10">
              {delDia.map((r) => (
                <FilaRecordatorio key={r.id} r={r} onAviso={onAviso} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Celular: agenda por día */}
      <div className="space-y-5 md:hidden">
        {delMes.length === 0 ? (
          <p className="rounded-[4px] bg-sch-surface p-5 text-sch-muted">Sin recordatorios este mes.</p>
        ) : (
          delMes.map(([f, rs]) => {
            const { dia: d, mes: m } = diaMes(f)
            return (
              <section key={f} className="space-y-1">
                <h3 className={`flex items-center gap-2 font-display font-bold ${f === hoy ? 'text-sch-green-dark' : ''}`}>
                  <span className="first-letter:uppercase">{fechaLarga(f)}</span>
                  {f === hoy && <span className="rounded-full bg-sch-mint px-2 text-xs text-sch-black">Hoy</span>}
                  <span className="sr-only">{d} {m}</span>
                </h3>
                <ul className="divide-y divide-sch-black/10">
                  {rs.map((r) => (
                    <FilaRecordatorio key={r.id} r={r} onAviso={onAviso} />
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}

/** Etiqueta chica dentro de la celda: ícono del tipo + título; roja si está atrasada, tachada si está hecha. */
function Etiqueta({ r, hoy }: { r: Recordatorio; hoy: Fecha }) {
  const { etiqueta, Icono } = TIPO_RECORDATORIO[r.tipo]
  const hecho = r.estado === 'hecho'
  const atrasado = !hecho && diasEntre(hoy, r.fecha) < 0
  const clase = hecho
    ? 'bg-sch-surface text-sch-muted line-through'
    : atrasado
      ? 'bg-sch-red text-white'
      : r.tipo === 'visita'
        ? 'bg-sch-mint text-sch-black'
        : 'bg-sch-black text-white'
  return (
    <span className={`flex items-center gap-1 truncate rounded-[3px] px-1 py-0.5 text-[11px] leading-tight ${clase}`} title={`${etiqueta}: ${r.titulo}`}>
      <Icono className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{r.titulo}</span>
    </span>
  )
}
