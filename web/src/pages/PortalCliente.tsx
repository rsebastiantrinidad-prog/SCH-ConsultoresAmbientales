import { ArrowLeft, CalendarClock, CheckCircle2, Eye, Upload, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarraAvance, ETIQUETA_ESTADO_SERVICIO } from '../components/ficha/comun'
import { Logo } from '../components/Marca'
import { EstadoDocumentoPastilla } from '../components/ui'
import { fechaCorta, relativo } from '../lib/formato'
import { vistaCliente, type DocumentoParaCliente } from '../lib/reglas'
import { api, useDemo } from '../lib/store'
import { nombreUsuario } from '../lib/usuario'

/**
 * Vista del cliente (P2): versión reducida para que el cliente vea cómo va lo suyo y suba lo que falta.
 * No tiene la navegación interna ni las notas de SCH. La subida es simulada: se guarda solo el nombre del archivo.
 */
export default function PortalCliente() {
  const { id = '' } = useParams()
  const { hoy, datos } = useDemo()
  const navigate = useNavigate()
  const v = vistaCliente(datos, id, hoy)
  const [subido, setSubido] = useState<string | null>(null)

  useEffect(() => {
    document.title = v ? `${v.razon_social} · Portal de clientes SCH` : 'Portal de clientes SCH'
    return () => {
      document.title = 'SCH Gestión · Demo'
    }
  }, [v?.razon_social])

  const clientes = [...datos.clientes].sort((a, b) => a.razon_social.localeCompare(b.razon_social))

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Franja de demo: deja claro que es la vista del cliente y cómo volver */}
      <aside className="bg-sch-mint text-sch-black print:hidden" aria-label="Aviso de demo">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
          <span className="font-display font-bold">Estás viendo lo que ve el cliente (demo)</span>
          <label className="flex items-center gap-1.5">
            <span>Cliente:</span>
            <select className="rounded-[4px] border border-sch-black/30 bg-white px-1.5 py-0.5" value={id} onChange={(e) => navigate(`/portal/${e.target.value}`)}>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social}
                </option>
              ))}
            </select>
          </label>
          <Link to={`/clientes/${id}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-sch-black">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a SCH Gestión
          </Link>
        </div>
      </aside>

      <header className="bg-sch-black">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <Logo className="h-10 w-auto" />
          <span className="font-display text-sm font-bold text-white">Portal de clientes</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8">
        {!v ? (
          <p>No encontramos este cliente.</p>
        ) : (
          <>
            <section className="space-y-1">
              <p className="text-sch-muted">{v.razon_social}</p>
              <h1 className="text-3xl font-bold sm:text-[40px] sm:leading-tight">Hola, {v.contacto_nombre.replace(/ \(demo\)$/, '').split(' ')[0]}</h1>
              <p className="flex items-center gap-1.5 text-sch-muted">
                <UserRound className="h-4 w-4 text-sch-green-dark" aria-hidden />
                Te acompaña {nombreUsuario(v.responsable_id)}, de SCH Consultores Ambientales.
              </p>
            </section>

            {subido && (
              <p className="flex items-start gap-2 rounded-[4px] border-l-4 border-sch-green bg-sch-surface px-4 py-3" role="status">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sch-green-dark" aria-hidden />
                <span>
                  ¡Gracias! Recibimos <strong>{subido}</strong>. {nombreUsuario(v.responsable_id)} lo va a revisar y te avisamos. (Demo: el archivo no se guarda.)
                </span>
              </p>
            )}

            {/* Lo que falta */}
            <section className="space-y-3" aria-labelledby="titulo-necesitamos">
              <h2 id="titulo-necesitamos" className="titulo-seccion text-xl font-semibold sm:text-[25px]">
                Lo que necesitamos de vos
              </h2>
              {v.necesitamos.length === 0 ? (
                <p className="flex items-center gap-2 rounded-[4px] bg-sch-surface p-5">
                  <CheckCircle2 className="h-5 w-5 text-sch-green-dark" aria-hidden />
                  Por ahora no necesitamos nada. Está todo al día.
                </p>
              ) : (
                <ul className="space-y-2">
                  {v.necesitamos.map((d) => (
                    <FilaNecesitamos key={d.id} d={d} hoy={hoy} onSubido={setSubido} />
                  ))}
                </ul>
              )}
            </section>

            {/* Servicios */}
            <section className="space-y-3" aria-labelledby="titulo-servicios">
              <h2 id="titulo-servicios" className="titulo-seccion text-xl font-semibold sm:text-[25px]">
                Cómo van tus servicios
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {v.servicios.map((s) => (
                  <li key={s.id} className="space-y-2 rounded-[4px] border border-sch-black/15 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold">{s.nombre}</h3>
                      <span className="rounded-full border border-sch-black/30 px-2.5 py-0.5 font-display text-xs font-bold">{ETIQUETA_ESTADO_SERVICIO[s.estado]}</span>
                    </div>
                    <BarraAvance valor={s.avance} etiqueta={`Avance de ${s.nombre}`} />
                    {s.etapa && <p className="text-sm">Ahora estamos en: <strong>{s.etapa}</strong></p>}
                    {s.proxima_fecha && (
                      <p className="flex items-center gap-1.5 text-sm text-sch-muted">
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        Próxima visita: {fechaCorta(s.proxima_fecha)} ({relativo(hoy, s.proxima_fecha)})
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Al día */}
            <section className="space-y-3" aria-labelledby="titulo-al-dia">
              <h2 id="titulo-al-dia" className="titulo-seccion text-xl font-semibold sm:text-[25px]">
                Tu documentación al día
              </h2>
              <ul className="divide-y divide-sch-black/10">
                {v.al_dia.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <EstadoDocumentoPastilla valor={d.estado} />
                    <span className="min-w-0 flex-1">
                      <span className="font-display font-bold">{d.nombre}</span> <span className="text-sm text-sch-muted">· {d.servicio}</span>
                    </span>
                    <span className="text-sm text-sch-muted">
                      {d.estado === 'en_revision' ? (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Lo estamos revisando
                        </span>
                      ) : d.fecha ? (
                        `Vigente hasta ${fechaCorta(d.fecha)}`
                      ) : (
                        'Sin vencimiento'
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <footer className="bg-sch-gray text-white">
        <div className="mx-auto max-w-4xl px-4 py-5 text-sm">© 2026 SCH Consultores Ambientales. Córdoba, Argentina.</div>
      </footer>
    </div>
  )
}

const MOTIVO: Partial<Record<DocumentoParaCliente['estado'], (d: DocumentoParaCliente, hoy: string) => string>> = {
  vencido: (d, hoy) => `Venció ${relativo(hoy, d.fecha!)}. Mandanos la versión renovada.`,
  observado: (d) => `Hay que corregirlo: ${d.observacion ?? 'tiene una observación.'}`,
  pendiente: (d, hoy) => (d.fecha ? `Lo necesitamos ${relativo(hoy, d.fecha)} (${fechaCorta(d.fecha)}).` : 'Lo vamos a necesitar para avanzar.'),
  por_vencer: (d, hoy) => `Vence ${relativo(hoy, d.fecha!)} (${fechaCorta(d.fecha!)}). Conviene ir renovándolo.`,
}

function FilaNecesitamos({ d, hoy, onSubido }: { d: DocumentoParaCliente; hoy: string; onSubido: (nombre: string) => void }) {
  const archivo = useRef<HTMLInputElement>(null)
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[4px] border border-sch-black/15 p-4">
      <span className="min-w-0 basis-full space-y-1 sm:basis-0 sm:flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <EstadoDocumentoPastilla valor={d.estado} />
          <span className="font-display font-bold">{d.nombre}</span>
        </span>
        <span className="block text-sm">{MOTIVO[d.estado]?.(d, hoy)}</span>
        <span className="block text-xs text-sch-muted">{d.servicio}</span>
      </span>
      <button type="button" className="boton-principal w-full justify-center sm:w-auto" onClick={() => archivo.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden />
        Subir documento
      </button>
      {/* Simulado: se toma solo el nombre del archivo; el contenido no se lee ni se sube */}
      <input
        ref={archivo}
        type="file"
        className="hidden"
        aria-label={`Subir ${d.nombre}`}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            api.subirDocumentoCliente(d.id, f.name)
            onSubido(f.name)
          }
          e.target.value = ''
        }}
      />
    </li>
  )
}
