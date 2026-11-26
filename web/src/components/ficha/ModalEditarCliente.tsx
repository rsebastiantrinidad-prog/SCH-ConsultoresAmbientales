import { useState, type FormEvent } from 'react'
import { api } from '../../lib/store'
import type { Cliente, EstadoCliente } from '../../lib/tipos'
import { USUARIOS, type IdUsuario } from '../../lib/usuario'
import Modal from '../Modal'

const ESTADOS: { valor: EstadoCliente; etiqueta: string }[] = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'en_pausa', etiqueta: 'En pausa' },
  { valor: 'baja', etiqueta: 'Baja' },
]

export default function ModalEditarCliente({ cliente, onCerrar }: { cliente: Cliente; onCerrar: () => void }) {
  const [f, setF] = useState(cliente)
  const campo = (k: keyof Cliente) => ({
    value: f[k] as string,
    onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }),
  })

  function guardar(e: FormEvent) {
    e.preventDefault()
    if (!f.razon_social.trim()) return
    const { id: _id, ...cambios } = f
    api.editarCliente(cliente.id, { ...cambios, razon_social: f.razon_social.trim() })
    onCerrar()
  }

  return (
    <Modal
      titulo="Editar datos del cliente"
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" form="form-cliente" className="boton-principal">
            Guardar
          </button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Razón social" ancho>
          <input className="campo w-full" required {...campo('razon_social')} />
        </Campo>
        <Campo etiqueta="Rubro">
          <input className="campo w-full" {...campo('rubro')} />
        </Campo>
        <Campo etiqueta="Localidad">
          <input className="campo w-full" {...campo('localidad')} />
        </Campo>
        <Campo etiqueta="Contacto">
          <input className="campo w-full" {...campo('contacto_nombre')} />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input className="campo w-full" type="tel" {...campo('contacto_telefono')} />
        </Campo>
        <Campo etiqueta="Mail" ancho>
          <input className="campo w-full" type="email" {...campo('contacto_email')} />
        </Campo>
        <Campo etiqueta="Estado">
          <select className="campo w-full" value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value as EstadoCliente })}>
            {ESTADOS.map((x) => (
              <option key={x.valor} value={x.valor}>
                {x.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Responsable">
          <select className="campo w-full" value={f.responsable_id} onChange={(e) => setF({ ...f, responsable_id: e.target.value as IdUsuario })}>
            {USUARIOS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </form>
    </Modal>
  )
}

function Campo({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1 ${ancho ? 'sm:col-span-2' : ''}`}>
      <span className="font-display text-sm font-bold">{etiqueta}</span>
      {children}
    </label>
  )
}
