import { Link } from 'react-router-dom'
import { fechaCorta } from '../lib/formato'
import { semaforoCliente } from '../lib/reglas'
import { useDemo } from '../lib/store'
import { nombreUsuario, useUsuario } from '../lib/usuario'

/** Lugar reservado para una pantalla que todavía no se construyó; muestra los datos de demo cargados. */
export default function Proximamente({ titulo, descripcion, hito }: { titulo: string; descripcion: string; hito: string }) {
  const usuario = useUsuario()
  const { hoy, datos } = useDemo()
  const clientes = datos.clientes.filter((c) => usuario === 'todos' || c.responsable_id === usuario)
  const cuenta = { verde: 0, ambar: 0, rojo: 0 }
  for (const c of clientes) cuenta[semaforoCliente(datos, c.id, hoy)]++

  return (
    <section className="space-y-6">
      <h1 className="titulo-seccion text-3xl sm:text-[40px] sm:leading-tight">{titulo}</h1>
      <p className="max-w-2xl text-lg text-sch-ink">{descripcion}</p>
      <div className="max-w-2xl space-y-2 rounded-[4px] bg-sch-surface p-5">
        <p className="font-display font-bold">Pantalla en construcción · {hito}</p>
        <p className="text-sm text-sch-muted">
          Viendo como: <strong className="text-sch-ink">{nombreUsuario(usuario)}</strong> · Hoy en el demo:{' '}
          <strong className="text-sch-ink">{fechaCorta(hoy)}</strong>
        </p>
        <p className="text-sm text-sch-muted" data-testid="resumen-datos">
          Datos cargados: <strong className="text-sch-ink">{clientes.length} clientes</strong> ·{' '}
          {cuenta.verde} en verde, {cuenta.ambar} en ámbar y {cuenta.rojo} en rojo · {datos.servicios.length} servicios y{' '}
          {datos.documentos.length} documentos en total
        </p>
      </div>
      <Link to="/clientes" className="boton-principal no-underline">
        Ver clientes
      </Link>
    </section>
  )
}
