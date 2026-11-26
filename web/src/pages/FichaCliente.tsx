import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Mail, MapPin, Pencil, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Documentacion from '../components/ficha/Documentacion'
import ModalEditarCliente from '../components/ficha/ModalEditarCliente'
import { Notas, Recordatorios, Resumen, Seguimiento, Servicios, type Pestana, type PropsPestana } from '../components/ficha/Pestanas'
import { Semaforo } from '../components/ui'
import VistaPreviaAviso from '../components/VistaPreviaAviso'
import { compararFilas, filasClientes, motivoSemaforo, semaforoCliente } from '../lib/reglas'
import { useDemo } from '../lib/store'
import type { Recordatorio } from '../lib/tipos'
import { nombreUsuario, useUsuario } from '../lib/usuario'

const PESTANAS: { id: Pestana; etiqueta: string; Componente: (p: PropsPestana) => React.ReactNode }[] = [
  { id: 'resumen', etiqueta: 'Resumen', Componente: Resumen },
  { id: 'servicios', etiqueta: 'Servicios', Componente: Servicios },
  { id: 'documentacion', etiqueta: 'Documentación', Componente: Documentacion },
  { id: 'seguimiento', etiqueta: 'Seguimiento', Componente: Seguimiento },
  { id: 'recordatorios', etiqueta: 'Recordatorios', Componente: Recordatorios },
  { id: 'notas', etiqueta: 'Notas', Componente: Notas },
]

const ESTADO_CLIENTE = { activo: 'Activo', en_pausa: 'En pausa', baja: 'Baja' } as const

export default function FichaCliente() {
  const { id = '' } = useParams()
  const { hoy, datos } = useDemo()
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState<Recordatorio | null>(null)

  const cliente = datos.clientes.find((c) => c.id === id)
  const pestana = (PESTANAS.find((p) => p.id === params.get('tab'))?.id ?? 'resumen') as Pestana

  // Anterior / siguiente en el mismo orden que la lista de Clientes (del usuario elegido)
  const orden = filasClientes(datos, hoy)
    .filter((f) => usuario === 'todos' || f.cliente.responsable_id === usuario)
    .sort(compararFilas)
    .map((f) => f.cliente.id)
  const pos = orden.indexOf(id)
  const anterior = pos > 0 ? orden[pos - 1] : null
  const siguiente = pos >= 0 && pos < orden.length - 1 ? orden[pos + 1] : null

  const irA = (p: Pestana) => setParams(p === 'resumen' ? {} : { tab: p }, { replace: true })
  const irCliente = (otro: string | null) => otro && navigate(`/clientes/${otro}${pestana === 'resumen' ? '' : `?tab=${pestana}`}`)

  // Teclado, como la ficha de MUPREN: Esc vuelve a la lista; ← → cliente anterior y siguiente (salvo escribiendo o con un diálogo abierto)
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      const escribiendo = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')
      if (escribiendo) return
      if (e.key === 'Escape') navigate('/clientes')
      else if (e.key === 'ArrowLeft' && anterior) irCliente(anterior)
      else if (e.key === 'ArrowRight' && siguiente) irCliente(siguiente)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  useEffect(() => {
    if (cliente) document.title = `${cliente.razon_social} · SCH Gestión`
    return () => {
      document.title = 'SCH Gestión · Demo'
    }
  }, [cliente])

  if (!cliente) {
    return (
      <section className="space-y-4">
        <h1 className="titulo-seccion text-3xl">No encontramos este cliente</h1>
        <p>Puede que se haya reiniciado el demo. Volvé a la lista.</p>
        <Link to="/clientes" className="boton-principal no-underline">
          Ver clientes
        </Link>
      </section>
    )
  }

  const semaforo = semaforoCliente(datos, cliente.id, hoy)
  const motivo = motivoSemaforo(datos, cliente.id, hoy)
  const Actual = PESTANAS.find((p) => p.id === pestana)!.Componente
  const props: PropsPestana = { clienteId: cliente.id, irA, onAviso: setAviso }

  return (
    <div className="space-y-6">
      {/* Volver y anterior/siguiente */}
      <nav className="flex items-center justify-between gap-2 text-sm" aria-label="Navegación entre clientes">
        <Link to="/clientes" className="inline-flex items-center gap-1 font-semibold">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Clientes
        </Link>
        <span className="flex items-center gap-1">
          {pos >= 0 && <span className="mr-1 hidden text-sch-muted sm:inline">{pos + 1} de {orden.length}</span>}
          <button type="button" className="rounded-full border border-sch-black/25 p-1.5 hover:border-sch-black disabled:opacity-30" disabled={!anterior} onClick={() => irCliente(anterior)} aria-label="Cliente anterior" title="Cliente anterior (←)">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className="rounded-full border border-sch-black/25 p-1.5 hover:border-sch-black disabled:opacity-30" disabled={!siguiente} onClick={() => irCliente(siguiente)} aria-label="Cliente siguiente" title="Cliente siguiente (→)">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </span>
      </nav>

      {/* Encabezado */}
      <header className="space-y-4 border-b border-sch-black/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold sm:text-[40px] sm:leading-tight">{cliente.razon_social}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Semaforo valor={semaforo} />
              {motivo && <span className={`text-sm font-semibold ${semaforo === 'rojo' ? 'text-sch-red' : ''}`}>{motivo}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/portal/${cliente.id}`} className="boton-secundario no-underline" title="Lo que ve el cliente en su portal (demo)">
              <Eye className="h-4 w-4" aria-hidden />
              Ver como el cliente
            </Link>
            <button type="button" className="boton-secundario" onClick={() => setEditando(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Editar datos
            </button>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Dato Icono={MapPin} etiqueta="Rubro y localidad">
            {cliente.rubro} · {cliente.localidad}
          </Dato>
          <Dato Icono={UserRound} etiqueta="Responsable">
            {nombreUsuario(cliente.responsable_id)} · {ESTADO_CLIENTE[cliente.estado]}
          </Dato>
          <Dato Icono={Mail} etiqueta="Contacto">
            {cliente.contacto_nombre} · {cliente.contacto_email}
          </Dato>
          <Dato Icono={Phone} etiqueta="Teléfono">
            {cliente.contacto_telefono}
          </Dato>
        </dl>
      </header>

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones de la ficha" className="sin-barra -mx-4 flex gap-1 overflow-x-auto border-b border-sch-black/10 px-4 lg:mx-0 lg:px-0">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            id={`tab-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls="panel-ficha"
            onClick={() => irA(p.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 font-display font-bold transition ${
              pestana === p.id ? 'border-sch-green text-sch-black' : 'border-transparent text-sch-muted hover:text-sch-black'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      <div key={pestana} role="tabpanel" id="panel-ficha" aria-labelledby={`tab-${pestana}`} className="animar-aparecer">
        <Actual {...props} />
      </div>

      {editando && <ModalEditarCliente cliente={cliente} onCerrar={() => setEditando(false)} />}
      {aviso && <VistaPreviaAviso recordatorio={aviso} onCerrar={() => setAviso(null)} />}
    </div>
  )
}

function Dato({ Icono, etiqueta, children }: { Icono: typeof Mail; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="sr-only">{etiqueta}</dt>
      <dd className="flex min-w-0 items-start gap-2 break-words">
        <Icono className="mt-0.5 h-4 w-4 shrink-0 text-sch-green-dark" aria-hidden />
        <span className="min-w-0">{children}</span>
      </dd>
    </div>
  )
}
