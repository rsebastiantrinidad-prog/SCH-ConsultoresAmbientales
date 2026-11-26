import { CalendarDays, ChevronDown, List } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarioRecordatorios from '../components/CalendarioRecordatorios'
import FilaRecordatorio, { TIPO_RECORDATORIO } from '../components/FilaRecordatorio'
import FiltroResponsable from '../components/FiltroResponsable'
import { BannerFoto } from '../components/Foto'
import { ChipQuitable, MultiFiltro, TituloSeccion } from '../components/ui'
import VistaPreviaAviso from '../components/VistaPreviaAviso'
import { mesDe } from '../lib/formato'
import { derivarRecordatorios, grupoRecordatorio, type GrupoRecordatorio } from '../lib/reglas'
import { useDemo } from '../lib/store'
import type { CanalRecordatorio, Recordatorio, TipoRecordatorio } from '../lib/tipos'
import { useUsuario } from '../lib/usuario'

const GRUPOS: { id: GrupoRecordatorio; titulo: string; abierto: boolean }[] = [
  { id: 'vencidos', titulo: 'Vencidos', abierto: true },
  { id: 'esta_semana', titulo: 'Esta semana', abierto: true },
  { id: 'proximos_30', titulo: 'Próximos 30 días', abierto: true },
  { id: 'mas_adelante', titulo: 'Más adelante', abierto: false },
]

const TIPOS = Object.keys(TIPO_RECORDATORIO) as TipoRecordatorio[]
const CANALES: { valor: CanalRecordatorio; etiqueta: string }[] = [
  { valor: 'mail', etiqueta: 'Mail' },
  { valor: 'whatsapp', etiqueta: 'WhatsApp' },
  { valor: 'interno', etiqueta: 'Interno' },
]

const lista = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

export default function Recordatorios() {
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const [params, setParams] = useSearchParams()
  const [aviso, setAviso] = useState<Recordatorio | null>(null)
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => Object.fromEntries(GRUPOS.map((g) => [g.id, g.abierto])))

  const vista = params.get('vista') === 'calendario' ? 'calendario' : 'lista'
  const tipos = lista(params.get('tipo')) as TipoRecordatorio[]
  const canales = lista(params.get('canal')) as CanalRecordatorio[]
  const conHechos = params.get('hechos') === '1'
  const mes = params.get('mes') ?? mesDe(hoy)
  const dia = params.get('dia')

  function cambiar(cambios: Record<string, string | string[] | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(cambios)) {
      const s = Array.isArray(v) ? v.join(',') : v
      if (s) p.set(k, s)
      else p.delete(k)
    }
    setParams(p, { replace: true })
  }

  const todos = derivarRecordatorios(datos).filter(
    (r) =>
      (usuario === 'todos' || r.asignado_a === usuario) &&
      (!tipos.length || tipos.includes(r.tipo)) &&
      (!canales.length || canales.includes(r.canal)),
  )
  const pendientes = todos.filter((r) => r.estado !== 'hecho')
  const hechos = todos.filter((r) => r.estado === 'hecho')
  const porGrupo = (g: GrupoRecordatorio) => pendientes.filter((r) => grupoRecordatorio(r, hoy) === g)

  return (
    <div className="space-y-5">
      <TituloSeccion
        as="h1"
        accion={
          <div className="flex rounded-full border border-sch-black p-0.5" role="group" aria-label="Vista">
            {([
              ['lista', 'Lista', List],
              ['calendario', 'Calendario', CalendarDays],
            ] as const).map(([id, etiqueta, Icono]) => (
              <button
                key={id}
                type="button"
                aria-pressed={vista === id}
                onClick={() => cambiar({ vista: id === 'lista' ? null : id })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-sm font-bold ${vista === id ? 'bg-sch-black text-white' : 'text-sch-black hover:bg-sch-surface'}`}
              >
                <Icono className="h-4 w-4" aria-hidden />
                {etiqueta}
              </button>
            ))}
          </div>
        }
      >
        Recordatorios
      </TituloSeccion>

      <BannerFoto nombre="carpetas-vencimientos" posicion="center 60%" className="rounded-[4px] px-5 py-6 sm:px-8 sm:py-8">
        <p className="max-w-xl font-display text-xl font-bold leading-snug text-white sm:text-2xl">Sin carpetas ni calendarios en papel: los vencimientos se calculan solos y llegan con tiempo.</p>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Salen de las vigencias de los documentos, los pendientes y las visitas de cada servicio. Avisan con anticipación (60 días para vencimientos, valores de ejemplo).
        </p>
      </BannerFoto>

      {/* Filtros */}
      <div className="space-y-3">
        <FiltroResponsable />
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <MultiFiltro titulo="Tipo" opciones={TIPOS.map((t) => ({ valor: t, etiqueta: TIPO_RECORDATORIO[t].etiqueta }))} seleccion={tipos} onCambio={(s) => cambiar({ tipo: s })} />
          <MultiFiltro titulo="Canal" opciones={CANALES} seleccion={canales} onCambio={(s) => cambiar({ canal: s })} />
        </div>
        {(tipos.length > 0 || canales.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {tipos.map((t) => (
              <ChipQuitable key={t} onQuitar={() => cambiar({ tipo: tipos.filter((x) => x !== t) })}>
                {TIPO_RECORDATORIO[t].etiqueta}
              </ChipQuitable>
            ))}
            {canales.map((c) => (
              <ChipQuitable key={c} onQuitar={() => cambiar({ canal: canales.filter((x) => x !== c) })}>
                {CANALES.find((x) => x.valor === c)!.etiqueta}
              </ChipQuitable>
            ))}
            <button type="button" className="font-semibold text-sch-green-dark underline" onClick={() => cambiar({ tipo: null, canal: null })}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {vista === 'calendario' ? (
        <CalendarioRecordatorios
          lista={todos}
          mes={mes}
          dia={dia}
          onMes={(m) => cambiar({ mes: m === mesDe(hoy) ? null : m, dia: null })}
          onDia={(d) => cambiar({ dia: d })}
          onAviso={setAviso}
        />
      ) : (
        <div className="space-y-6">
          {GRUPOS.map((g) => {
            const rs = porGrupo(g.id)
            const abierto = abiertos[g.id]
            return (
              <section key={g.id} aria-labelledby={`grupo-${g.id}`}>
                <h2 id={`grupo-${g.id}`} className="titulo-seccion text-xl sm:text-[25px]">
                  <button
                    type="button"
                    aria-expanded={abierto}
                    onClick={() => setAbiertos({ ...abiertos, [g.id]: !abierto })}
                    className="flex w-full items-center gap-2 text-left font-semibold"
                  >
                    <ChevronDown className={`h-5 w-5 transition ${abierto ? '' : '-rotate-90'}`} aria-hidden />
                    {g.titulo}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 font-display text-sm font-bold tabular-nums ${
                        g.id === 'vencidos' && rs.length ? 'bg-sch-red text-white' : 'bg-sch-surface text-sch-ink'
                      }`}
                    >
                      {rs.length}
                    </span>
                  </button>
                </h2>
                {abierto &&
                  (rs.length === 0 ? (
                    <p className="py-3 text-sm text-sch-muted">Nada por acá.</p>
                  ) : (
                    <ul className="divide-y divide-sch-black/10">
                      {rs.map((r) => (
                        <FilaRecordatorio key={r.id} r={r} onAviso={setAviso} />
                      ))}
                    </ul>
                  ))}
              </section>
            )
          })}

          <section>
            <button
              type="button"
              aria-expanded={conHechos}
              onClick={() => cambiar({ hechos: conHechos ? null : '1' })}
              className="text-sm font-semibold text-sch-green-dark underline"
            >
              {conHechos ? 'Ocultar' : 'Mostrar'} los hechos ({hechos.length})
            </button>
            {conHechos && hechos.length > 0 && (
              <ul className="mt-2 divide-y divide-sch-black/10">
                {hechos.map((r) => (
                  <FilaRecordatorio key={r.id} r={r} onAviso={setAviso} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {aviso && <VistaPreviaAviso recordatorio={aviso} onCerrar={() => setAviso(null)} />}
    </div>
  )
}
