import { Link } from 'react-router-dom'
import { nombreUsuario, useUsuario } from '../lib/usuario'

/** Lugar reservado para una pantalla que todavía no se construyó. */
export default function Proximamente({ titulo, descripcion, hito }: { titulo: string; descripcion: string; hito: string }) {
  const usuario = useUsuario()
  return (
    <section className="space-y-6">
      <h1 className="titulo-seccion text-3xl sm:text-[40px] sm:leading-tight">{titulo}</h1>
      <p className="max-w-2xl text-lg text-sch-ink">{descripcion}</p>
      <div className="max-w-2xl rounded-[4px] bg-sch-surface p-5">
        <p className="font-display font-bold">Pantalla en construcción · {hito}</p>
        <p className="mt-1 text-sm text-sch-muted">
          Viendo como: <strong className="text-sch-ink">{nombreUsuario(usuario)}</strong>
        </p>
      </div>
      <Link to="/clientes" className="boton-principal no-underline">
        Ver clientes
      </Link>
    </section>
  )
}
