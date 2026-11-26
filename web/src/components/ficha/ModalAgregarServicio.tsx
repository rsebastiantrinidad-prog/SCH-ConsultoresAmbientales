import { useState } from 'react'
import { api, useDemo } from '../../lib/store'
import Modal from '../Modal'

/** Elegir un servicio del catálogo: se crean sus documentos (pendientes) y etapas. */
export default function ModalAgregarServicio({ clienteId, onCerrar }: { clienteId: string; onCerrar: () => void }) {
  const { datos } = useDemo()
  const [elegido, setElegido] = useState(datos.catalogo[0]?.id ?? '')
  const tiene = new Set(datos.servicios.filter((s) => s.cliente_id === clienteId && s.estado !== 'finalizado').map((s) => s.servicio_id))
  const cat = datos.catalogo.find((c) => c.id === elegido)

  return (
    <Modal
      titulo="Agregar servicio"
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton-principal"
            disabled={!cat}
            onClick={() => {
              api.agregarServicio(clienteId, elegido)
              onCerrar()
            }}
          >
            Agregar
          </button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Servicio del catálogo</legend>
        {datos.catalogo.map((c) => (
          <label key={c.id} className={`flex cursor-pointer items-start gap-3 rounded-[4px] border p-3 ${elegido === c.id ? 'border-sch-black bg-sch-surface' : 'border-sch-black/15'}`}>
            <input type="radio" name="servicio" value={c.id} checked={elegido === c.id} onChange={() => setElegido(c.id)} className="mt-1 accent-[#3f7d1a]" />
            <span>
              <span className="block font-display font-bold">
                {c.nombre}
                {tiene.has(c.id) && <span className="ml-2 text-xs font-normal text-sch-muted">(ya lo tiene)</span>}
              </span>
              <span className="block text-sm text-sch-muted">
                {c.periodicidad_meses ? `Cada ${c.periodicidad_meses} meses` : 'Trámite único'} · {c.documentos.length} documentos · {c.etapas.length} etapas
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {cat && (
        <p className="mt-3 text-sm text-sch-muted">
          Se crean como pendientes, para dentro de 30 días: {cat.documentos.map((d) => d.nombre).join(', ')}.
        </p>
      )}
    </Modal>
  )
}
