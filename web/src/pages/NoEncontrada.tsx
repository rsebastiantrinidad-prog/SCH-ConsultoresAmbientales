import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <section className="space-y-4">
      <h1 className="titulo-seccion text-3xl">No encontramos esta página</h1>
      <p>Revisá la dirección o volvé al tablero.</p>
      <Link to="/" className="boton-principal no-underline">
        Ir al tablero
      </Link>
    </section>
  )
}
