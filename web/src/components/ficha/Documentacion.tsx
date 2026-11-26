import { Paperclip, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { fechaCorta, relativo } from '../../lib/formato'
import { estadoDocumento, recordatorioDeDocumento } from '../../lib/reglas'
import { api, useDemo } from '../../lib/store'
import type { CargaDocumento, Documento } from '../../lib/tipos'
import { nombreUsuario } from '../../lib/usuario'
import Modal from '../Modal'
import { EstadoDocumentoPastilla, TituloSeccion } from '../ui'
import { EstadoServicioPastilla, Vacio, nombreServicio } from './comun'
import type { PropsPestana } from './Pestanas'

const CARGAS: { valor: CargaDocumento; etiqueta: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'revisado', etiqueta: 'Revisado' },
  { valor: 'observado', etiqueta: 'Observado' },
]

/**
 * Checklist de documentos por servicio. Lo que se toca a mano es la carga (pendiente, en revisión, revisado, observado),
 * la fecha de vigencia y el archivo (simulado). Vigente, Por vencer y Vencido se calculan solos.
 */
export default function Documentacion({ clienteId, onAviso }: PropsPestana) {
  const { hoy, datos } = useDemo()
  const servicios = datos.servicios.filter((s) => s.cliente_id === clienteId)
  const [observando, setObservando] = useState<Documento | null>(null)

  if (!servicios.length) return <Vacio>Sin servicios, no hay documentación para mostrar.</Vacio>

  return (
    <div className="space-y-8">
      {servicios.map((s) => {
        const docs = datos.documentos.filter((d) => d.servicio_cliente_id === s.id)
        return (
          <section key={s.id} className="space-y-2">
            <TituloSeccion accion={<EstadoServicioPastilla valor={s.estado} />}>{nombreServicio(datos, s)}</TituloSeccion>
            <ul className="lista-animada divide-y divide-sch-black/10">
              {docs.map((d) => (
                <FilaDocumento
                  key={d.id}
                  d={d}
                  onObservar={() => setObservando(d)}
                  onPedir={() => {
                    const r = recordatorioDeDocumento(datos, d.id, hoy)
                    if (r) onAviso(r)
                  }}
                />
              ))}
            </ul>
          </section>
        )
      })}
      {observando && <ModalObservar doc={observando} onCerrar={() => setObservando(null)} />}
    </div>
  )
}

function FilaDocumento({ d, onObservar, onPedir }: { d: Documento; onObservar: () => void; onPedir: () => void }) {
  const { hoy } = useDemo()
  const archivo = useRef<HTMLInputElement>(null)
  const estado = estadoDocumento(d, hoy)
  const idVigencia = `vig-${d.id}`

  function cambiarCarga(c: CargaDocumento) {
    if (c === 'observado') onObservar()
    else api.cambiarCarga(d.id, c)
  }

  return (
    <li className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.6fr)_auto_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-center">
      {/* Documento y estado */}
      <div className="min-w-0">
        <p className="font-display font-bold">{d.nombre}</p>
        <p className="text-xs text-sch-muted">Emite: {d.emisor}</p>
        {estado === 'observado' && d.observacion && <p className="mt-1 text-sm font-semibold text-sch-red">Observación: {d.observacion}</p>}
        {estado === 'pendiente' && d.fecha_objetivo && <p className="mt-1 text-sm">Se necesita {relativo(hoy, d.fecha_objetivo)} ({fechaCorta(d.fecha_objetivo)})</p>}
      </div>
      <div>
        <EstadoDocumentoPastilla valor={estado} />
      </div>

      {/* Vigencia */}
      <div className="space-y-0.5">
        <label htmlFor={idVigencia} className="block text-xs text-sch-muted">
          Vigente hasta
        </label>
        <input
          id={idVigencia}
          type="date"
          className="campo w-full max-w-44 py-1"
          value={d.vigente_hasta ?? ''}
          onChange={(e) => api.cambiarVigencia(d.id, e.target.value || null)}
        />
        {d.vigente_hasta && (estado === 'vencido' || estado === 'por_vencer') && (
          <p className={`text-xs font-semibold ${estado === 'vencido' ? 'text-sch-red' : ''}`}>
            {estado === 'vencido' ? `Venció ${relativo(hoy, d.vigente_hasta)}` : `Vence ${relativo(hoy, d.vigente_hasta)}`}
          </p>
        )}
      </div>

      {/* Archivo y revisión */}
      <div className="min-w-0 space-y-0.5 text-sm">
        {d.archivo ? (
          <p className="flex items-center gap-1 truncate" title={d.archivo}>
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-sch-muted" aria-hidden />
            <span className="truncate">{d.archivo}</span>
          </p>
        ) : (
          <>
            <button type="button" className="inline-flex items-center gap-1 font-semibold text-sch-green-dark underline" onClick={() => archivo.current?.click()}>
              <Paperclip className="h-3.5 w-3.5" aria-hidden />
              Adjuntar archivo
            </button>
            {/* Simulado: se guarda solo el nombre del archivo, el contenido no se lee ni se sube */}
            <input
              ref={archivo}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) api.adjuntarArchivo(d.id, f.name)
                e.target.value = ''
              }}
            />
          </>
        )}
        <p className="text-xs text-sch-muted">
          {d.revisado_por && d.fecha_revision ? `Revisó ${nombreUsuario(d.revisado_por)} el ${fechaCorta(d.fecha_revision)}` : 'Sin revisar'}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <label className="sr-only" htmlFor={`carga-${d.id}`}>
          Estado de carga de {d.nombre}
        </label>
        <select id={`carga-${d.id}`} className="campo py-1 text-sm" value={d.carga} onChange={(e) => cambiarCarga(e.target.value as CargaDocumento)}>
          {CARGAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onPedir}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-sch-green-dark px-3 py-1 font-display text-sm font-bold text-sch-green-dark hover:bg-sch-surface"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Pedir al cliente
        </button>
      </div>
    </li>
  )
}

function ModalObservar({ doc, onCerrar }: { doc: Documento; onCerrar: () => void }) {
  const [motivo, setMotivo] = useState(doc.observacion ?? '')
  return (
    <Modal
      titulo={`Observar: ${doc.nombre}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton-principal"
            disabled={!motivo.trim()}
            onClick={() => {
              api.cambiarCarga(doc.id, 'observado', motivo)
              onCerrar()
            }}
          >
            Guardar observación
          </button>
        </>
      }
    >
      <label className="block space-y-1">
        <span className="font-display text-sm font-bold">¿Qué hay que resolver?</span>
        <textarea className="campo min-h-24 w-full" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: falta la firma del responsable técnico." />
      </label>
      <p className="mt-2 text-sm text-sch-muted">El cliente pasa a rojo hasta que se resuelva, y queda un seguimiento para dentro de 7 días.</p>
    </Modal>
  )
}
