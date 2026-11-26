import { UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CLIENTES_GUION } from '../lib/seed'
import { useDemo } from '../lib/store'
import { USUARIOS, elegirUsuario, useUsuario, type Seleccion } from '../lib/usuario'

const PORTAL = 'portal'

/** Menú simple (sin contraseña) para ver "mis" clientes. */
export default function SelectorUsuario() {
  const usuario = useUsuario()
  const navigate = useNavigate()
  const { datos } = useDemo()
  // Para la demo, la vista del cliente arranca en el Loteo (tiene documentos para subir)
  const clientePortal = datos.clientes.find((c) => c.razon_social === CLIENTES_GUION.loteo) ?? datos.clientes[0]
  return (
    <label className="flex items-center gap-2 text-sm text-white">
      <UserRound className="h-4 w-4 text-sch-mint" aria-hidden="true" />
      <span className="sr-only">Ver como</span>
      <select
        value={usuario}
        onChange={(e) => {
          if (e.target.value === PORTAL) navigate(`/portal/${clientePortal.id}`)
          else elegirUsuario(e.target.value as Seleccion)
        }}
        className="cursor-pointer rounded-[4px] border border-white/30 bg-black px-2 py-1 font-display font-semibold text-white hover:border-sch-mint"
      >
        <option value="todos">Todos</option>
        {USUARIOS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre}
          </option>
        ))}
        {clientePortal && (
          <optgroup label="Vista del cliente">
            <option value={PORTAL}>Cliente (demo)</option>
          </optgroup>
        )}
      </select>
    </label>
  )
}
