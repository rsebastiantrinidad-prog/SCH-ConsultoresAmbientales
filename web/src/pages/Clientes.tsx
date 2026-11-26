import { ArrowDown, ArrowUp, ChevronRight, SlidersHorizontal, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FiltroResponsable from '../components/FiltroResponsable'
import { ChipQuitable, ESTILO_SEMAFORO, MultiFiltro, Semaforo, TituloSeccion } from '../components/ui'
import { diasEntre, fechaCorta, relativo } from '../lib/formato'
import { DIAS_VENCIMIENTOS, compararFilas, filasClientes, type FilaCliente } from '../lib/reglas'
import { useDemo } from '../lib/store'
import type { Semaforo as TipoSemaforo } from '../lib/tipos'
import { nombreUsuario, useUsuario } from '../lib/usuario'

/** Filtros que llegan desde las tarjetas del tablero. */
const VISTAS = {
  vencimientos: { etiqueta: `Vencen en ${DIAS_VENCIMIENTOS} días o ya vencidos`, cumple: (f: FilaCliente, hoy: string) => !!f.proximo_vencimiento && diasEntre(hoy, f.proximo_vencimiento.fecha) <= DIAS_VENCIMIENTOS },
  faltante: { etiqueta: 'Con documentación faltante', cumple: (f: FilaCliente) => f.faltantes > 0 },
  tramites: { etiqueta: 'Con trámites en curso', cumple: (f: FilaCliente) => f.tramites_en_curso > 0 },
} as const
type Vista = keyof typeof VISTAS

type Columna = 'semaforo' | 'cliente' | 'rubro' | 'localidad' | 'responsable' | 'servicios' | 'vencimiento'

const COMPARAR: Record<Columna, (a: FilaCliente, b: FilaCliente) => number> = {
  semaforo: compararFilas,
  cliente: (a, b) => a.cliente.razon_social.localeCompare(b.cliente.razon_social),
  rubro: (a, b) => a.cliente.rubro.localeCompare(b.cliente.rubro),
  localidad: (a, b) => a.cliente.localidad.localeCompare(b.cliente.localidad),
  responsable: (a, b) => a.cliente.responsable_id.localeCompare(b.cliente.responsable_id),
  servicios: (a, b) => a.servicios_activos - b.servicios_activos,
  vencimiento: (a, b) => (a.proximo_vencimiento?.fecha ?? '9999').localeCompare(b.proximo_vencimiento?.fecha ?? '9999'),
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const lista = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

export default function Clientes() {
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [verFiltros, setVerFiltros] = useState(false)

  const q = params.get('q') ?? ''
  const rubros = lista(params.get('rubro'))
  const semaforos = lista(params.get('sem')) as TipoSemaforo[]
  const vista = (params.get('ver') ?? '') as Vista | ''
  const orden = (params.get('orden') ?? 'semaforo') as Columna
  const desc = params.get('dir') === 'desc'

  function cambiar(clave: string, valor: string | string[] | null) {
    const p = new URLSearchParams(params)
    const v = Array.isArray(valor) ? valor.join(',') : valor
    if (v) p.set(clave, v)
    else p.delete(clave)
    setParams(p, { replace: true })
  }

  function ordenarPor(col: Columna) {
    const p = new URLSearchParams(params)
    p.set('orden', col)
    if (orden === col && !desc) p.set('dir', 'desc')
    else p.delete('dir')
    setParams(p, { replace: true })
  }

  const todas = filasClientes(datos, hoy)
  const delUsuario = todas.filter((f) => usuario === 'todos' || f.cliente.responsable_id === usuario)
  const texto = normalizar(q.trim())
  const filas = delUsuario
    .filter((f) => !texto || normalizar(`${f.cliente.razon_social} ${f.cliente.rubro} ${f.cliente.localidad} ${f.cliente.contacto_nombre}`).includes(texto))
    .filter((f) => !rubros.length || rubros.includes(f.cliente.rubro))
    .filter((f) => !semaforos.length || semaforos.includes(f.semaforo))
    .filter((f) => !vista || !VISTAS[vista] || VISTAS[vista].cumple(f, hoy))
    .sort((a, b) => (desc ? -1 : 1) * COMPARAR[orden](a, b))

  const todosRubros = [...new Set(datos.clientes.map((c) => c.rubro))].sort((a, b) => a.localeCompare(b))
  const hayFiltros = !!(q || rubros.length || semaforos.length || vista)

  return (
    <div className="space-y-5">
      <TituloSeccion as="h1">Clientes</TituloSeccion>

      {/* Búsqueda, responsable y filtros plegables */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block md:w-80">
            <span className="sr-only">Buscar cliente</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sch-muted" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => cambiar('q', e.target.value)}
              placeholder="Buscá por nombre, rubro o localidad"
              className="campo w-full pl-8"
            />
          </label>
          <FiltroResponsable />
          <button
            type="button"
            onClick={() => setVerFiltros((v) => !v)}
            aria-expanded={verFiltros}
            className="boton-secundario self-start md:ml-auto"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filtros{rubros.length + semaforos.length ? ` (${rubros.length + semaforos.length})` : ''}
          </button>
        </div>

        {verFiltros && (
          <div className="grid gap-4 rounded-[4px] bg-sch-surface p-4 md:grid-cols-[1fr_auto]">
            <MultiFiltro titulo="Rubro" opciones={todosRubros.map((r) => ({ valor: r, etiqueta: r }))} seleccion={rubros} onCambio={(s) => cambiar('rubro', s)} />
            <MultiFiltro
              titulo="Semáforo"
              opciones={(['rojo', 'ambar', 'verde'] as const).map((s) => ({ valor: s, etiqueta: ESTILO_SEMAFORO[s].etiqueta }))}
              seleccion={semaforos}
              onCambio={(s) => cambiar('sem', s)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-display font-bold" aria-live="polite">
            {filas.length} de {datos.clientes.length} clientes
          </span>
          {usuario !== 'todos' && <span className="text-sch-muted">de {nombreUsuario(usuario)}</span>}
          {vista && VISTAS[vista] && <ChipQuitable onQuitar={() => cambiar('ver', null)}>{VISTAS[vista].etiqueta}</ChipQuitable>}
          {rubros.map((r) => (
            <ChipQuitable key={r} onQuitar={() => cambiar('rubro', rubros.filter((x) => x !== r))}>
              {r}
            </ChipQuitable>
          ))}
          {semaforos.map((s) => (
            <ChipQuitable key={s} onQuitar={() => cambiar('sem', semaforos.filter((x) => x !== s))}>
              {ESTILO_SEMAFORO[s].etiqueta}
            </ChipQuitable>
          ))}
          {hayFiltros && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="font-semibold text-sch-green-dark underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {filas.length === 0 ? (
        <p className="rounded-[4px] bg-sch-surface p-6 text-center text-sch-muted">No hay clientes con estos filtros.</p>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b-2 border-sch-black">
                  {encabezado('cliente', 'Cliente')}
                  {encabezado('rubro', 'Rubro')}
                  {encabezado('localidad', 'Localidad')}
                  {encabezado('responsable', 'Responsable')}
                  {encabezado('servicios', 'Servicios activos', true)}
                  {encabezado('vencimiento', 'Próximo vencimiento')}
                  {encabezado('semaforo', 'Semáforo')}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr
                    key={f.cliente.id}
                    onClick={() => navigate(`/clientes/${f.cliente.id}`)}
                    className="cursor-pointer border-b border-sch-black/10 transition hover:bg-sch-surface"
                  >
                    <td className="py-3 pr-3">
                      <Link to={`/clientes/${f.cliente.id}`} onClick={(e) => e.stopPropagation()} className="font-display font-bold text-sch-black no-underline hover:underline">
                        {f.cliente.razon_social}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{f.cliente.rubro}</td>
                    <td className="py-3 pr-3">{f.cliente.localidad}</td>
                    <td className="py-3 pr-3">{nombreUsuario(f.cliente.responsable_id)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{f.servicios_activos}</td>
                    <td className="py-3 pr-3">
                      <Vencimiento f={f} hoy={hoy} />
                    </td>
                    <td className="py-3 pr-3">
                      <Semaforo valor={f.semaforo} />
                    </td>
                    <td className="py-3">
                      <ChevronRight className="h-4 w-4 text-sch-muted" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="space-y-2 md:hidden">
            {filas.map((f) => (
              <li key={f.cliente.id}>
                <Link to={`/clientes/${f.cliente.id}`} className="block rounded-[4px] border border-sch-black/15 p-3 text-sch-ink no-underline active:bg-sch-surface">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display font-bold text-sch-black">{f.cliente.razon_social}</span>
                    <Semaforo valor={f.semaforo} />
                  </span>
                  <span className="mt-1 block text-sm text-sch-muted">
                    {f.cliente.rubro} · {f.cliente.localidad} · {nombreUsuario(f.cliente.responsable_id)}
                  </span>
                  <span className="mt-2 flex items-end justify-between gap-2 text-sm">
                    <Vencimiento f={f} hoy={hoy} />
                    <span className="shrink-0 text-sch-muted">
                      {f.servicios_activos} {f.servicios_activos === 1 ? 'servicio' : 'servicios'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )

  function encabezado(col: Columna, children: string, derecha = false) {
    const activo = orden === col
    const Flecha = desc ? ArrowDown : ArrowUp
    return (
      <th key={col} scope="col" aria-sort={activo ? (desc ? 'descending' : 'ascending') : 'none'} className={`py-2 pr-3 ${derecha ? 'text-right' : ''}`}>
        <button
          type="button"
          onClick={() => ordenarPor(col)}
          className={`inline-flex items-center gap-1 font-display text-sm font-bold text-sch-black hover:text-sch-green-dark ${derecha ? 'flex-row-reverse' : ''}`}
        >
          {children}
          <Flecha className={`h-3.5 w-3.5 ${activo ? '' : 'opacity-0'}`} aria-hidden />
        </button>
      </th>
    )
  }
}

function Vencimiento({ f, hoy }: { f: FilaCliente; hoy: string }) {
  if (f.faltantes > 0 && !f.proximo_vencimiento) {
    return <span className="text-sm font-semibold">{f.faltantes} {f.faltantes === 1 ? 'documento pendiente' : 'documentos pendientes'}</span>
  }
  if (!f.proximo_vencimiento) return <span className="text-sm text-sch-muted">Sin vencimientos</span>
  const { fecha, documento } = f.proximo_vencimiento
  const dias = diasEntre(hoy, fecha)
  return (
    <span className="block min-w-0">
      <span className={`block text-sm font-semibold ${dias < 0 ? 'text-sch-red' : ''}`}>
        {fechaCorta(fecha)} · {dias < 0 ? `venció ${relativo(hoy, fecha)}` : relativo(hoy, fecha)}
      </span>
      <span className="block truncate text-xs text-sch-muted">{documento}</span>
    </span>
  )
}
