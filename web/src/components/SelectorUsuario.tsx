import { UserRound } from 'lucide-react'
import { USUARIOS, elegirUsuario, useUsuario, type Seleccion } from '../lib/usuario'

/** Menú simple (sin contraseña) para ver "mis" clientes. */
export default function SelectorUsuario() {
  const usuario = useUsuario()
  return (
    <label className="flex items-center gap-2 text-sm text-white">
      <UserRound className="h-4 w-4 text-sch-mint" aria-hidden="true" />
      <span className="sr-only">Ver como</span>
      <select
        value={usuario}
        onChange={(e) => elegirUsuario(e.target.value as Seleccion)}
        className="cursor-pointer rounded-[4px] border border-white/30 bg-black px-2 py-1 font-display font-semibold text-white hover:border-sch-mint"
      >
        <option value="todos">Todos</option>
        {USUARIOS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}
