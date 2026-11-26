import { USUARIOS, elegirUsuario, useUsuario } from '../lib/usuario'
import { Chip } from './ui'

/** Chips Todos / Hugo / Karina / Lilian: es el mismo filtro que el selector de la barra superior. */
export default function FiltroResponsable({ claro = false }: { claro?: boolean }) {
  const usuario = useUsuario()
  const opciones = [{ id: 'todos' as const, nombre: 'Todos' }, ...USUARIOS]
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por responsable">
      {opciones.map((u) =>
        claro ? (
          <button
            key={u.id}
            type="button"
            aria-pressed={usuario === u.id}
            onClick={() => elegirUsuario(u.id)}
            className={`rounded-full border px-3 py-1 font-display text-sm font-semibold transition ${
              usuario === u.id ? 'border-sch-mint bg-sch-mint text-sch-black' : 'border-white/40 text-white hover:border-sch-mint'
            }`}
          >
            {u.nombre}
          </button>
        ) : (
          <Chip key={u.id} activo={usuario === u.id} onClick={() => elegirUsuario(u.id)}>
            {u.nombre}
          </Chip>
        ),
      )}
    </div>
  )
}
