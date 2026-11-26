import { useParams } from 'react-router-dom'
import Proximamente from '../components/Proximamente'

export default function FichaCliente() {
  const { id } = useParams()
  return (
    <Proximamente
      titulo={`Ficha del cliente ${id ?? ''}`.trim()}
      descripcion="Datos y contacto, servicios, documentación, seguimiento, recordatorios y notas del cliente."
      hito="H4"
    />
  )
}
