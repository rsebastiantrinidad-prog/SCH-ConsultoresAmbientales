import { CheckCircle2, Mail, MessageCircle, NotebookPen, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { fechaCorta } from '../lib/formato'
import { asuntoAviso, textoAviso, variablesFaltantes } from '../lib/reglas'
import { api, useDemo } from '../lib/store'
import type { CanalRecordatorio, Recordatorio } from '../lib/tipos'
import { nombreUsuario } from '../lib/usuario'
import Modal from './Modal'
import { Chip } from './ui'

const CANALES: { valor: CanalRecordatorio; etiqueta: string; Icono: typeof Mail }[] = [
  { valor: 'mail', etiqueta: 'Mail', Icono: Mail },
  { valor: 'whatsapp', etiqueta: 'WhatsApp', Icono: MessageCircle },
  { valor: 'interno', etiqueta: 'Interno', Icono: NotebookPen },
]

/**
 * Vista previa del aviso al cliente, con las variables completas, y "Simular envío".
 * No se envía nada: queda registrado en la bitácora del cliente.
 */
export default function VistaPreviaAviso({ recordatorio: r, onCerrar }: { recordatorio: Recordatorio; onCerrar: () => void }) {
  const { hoy, datos } = useDemo()
  const [canal, setCanal] = useState<CanalRecordatorio>(r.canal)
  const [enviado, setEnviado] = useState(false)
  const cliente = datos.clientes.find((c) => c.id === r.cliente_id)
  const texto = textoAviso(datos, r, hoy)
  const asunto = asuntoAviso(datos, r, hoy)
  const faltan = variablesFaltantes(texto)
  const etiquetaCanal = CANALES.find((c) => c.valor === canal)!.etiqueta

  function simular() {
    api.simularEnvio(r, etiquetaCanal)
    setEnviado(true)
  }

  return (
    <Modal
      titulo={r.tipo === 'pedido_documentacion' ? 'Pedir al cliente' : 'Enviar aviso'}
      onCerrar={onCerrar}
      ancho="max-w-xl"
      pie={
        enviado ? (
          <button type="button" className="boton-principal" onClick={onCerrar}>
            Listo
          </button>
        ) : (
          <>
            <button type="button" className="boton-secundario" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="button" className="boton-principal" onClick={simular} disabled={faltan.length > 0}>
              Simular envío
            </button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-[4px] bg-sch-surface px-3 py-2 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sch-green-dark" aria-hidden />
          <span>
            <strong>Demo: no se envía nada.</strong> "Simular envío" solo lo deja anotado en la bitácora del cliente.
          </span>
        </p>

        {enviado ? (
          <p className="flex items-start gap-2 rounded-[4px] border-l-4 border-sch-green bg-sch-surface px-3 py-3" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sch-green-dark" aria-hidden />
            <span>
              Quedó registrado: aviso por <strong>{etiquetaCanal}</strong> a {cliente?.razon_social}, el {fechaCorta(hoy)}. Lo ves en Notas.
            </span>
          </p>
        ) : (
          <>
            <fieldset className="space-y-2">
              <legend className="font-display text-sm font-bold">Canal</legend>
              <div className="flex flex-wrap gap-2">
                {CANALES.map(({ valor, etiqueta, Icono }) => (
                  <Chip key={valor} activo={canal === valor} onClick={() => setCanal(valor)}>
                    <Icono className="h-4 w-4" aria-hidden />
                    {etiqueta}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="font-display font-bold">Para</dt>
              <dd>
                {canal === 'interno'
                  ? `${nombreUsuario(r.asignado_a)} (responsable)`
                  : `${cliente?.contacto_nombre} · ${canal === 'mail' ? cliente?.contacto_email : cliente?.contacto_telefono}`}
              </dd>
              {canal === 'mail' && (
                <>
                  <dt className="font-display font-bold">Asunto</dt>
                  <dd>{asunto}</dd>
                </>
              )}
            </dl>

            {/* Vista previa según el canal */}
            {canal === 'whatsapp' ? (
              <div className="rounded-[4px] bg-sch-surface p-4">
                <p className="ml-auto max-w-[85%] whitespace-pre-line rounded-[4px] rounded-tr-none bg-sch-mint px-3 py-2 text-[15px] text-sch-black">{texto}</p>
              </div>
            ) : canal === 'mail' ? (
              <div className="rounded-[4px] border border-sch-black/15">
                <p className="border-b border-sch-black/10 bg-sch-surface px-4 py-2 text-xs text-sch-muted">SCH Consultores Ambientales &lt;avisos@ejemplo.test&gt;</p>
                <p className="whitespace-pre-line px-4 py-3 text-[15px]">{texto}</p>
              </div>
            ) : (
              <p className="rounded-[4px] border-l-4 border-sch-black bg-sch-surface px-4 py-3 text-[15px]">
                Recordatorio interno para {nombreUsuario(r.asignado_a)}: {r.titulo} ({cliente?.razon_social}), {fechaCorta(r.fecha)}.
              </p>
            )}

            {faltan.length > 0 && (
              <p className="text-sm font-semibold text-sch-red" role="alert">
                Faltan datos para completar el aviso: {faltan.join(', ')}.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
