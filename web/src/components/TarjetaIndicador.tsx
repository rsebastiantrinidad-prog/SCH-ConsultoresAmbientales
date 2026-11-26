import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

/** Tarjeta del tablero: fondo negro con hojas, número grande en blanco, como las tarjetas de servicio del sitio. */
export default function TarjetaIndicador({
  titulo, valor, detalle, a, Icono,
}: {
  titulo: string
  valor: number
  detalle?: string
  a: string
  Icono: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}) {
  return (
    <Link
      to={a}
      className="group flex min-h-36 flex-col justify-between gap-3 rounded-[4px] border-t-4 border-sch-green bg-white/[0.07] p-4 no-underline ring-1 ring-white/20 outline-offset-2 backdrop-blur-[1px] transition hover:bg-white/[0.12] hover:ring-sch-mint sm:p-5"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-display text-sm font-semibold leading-tight text-white sm:text-base">{titulo}</span>
        <Icono className="h-5 w-5 shrink-0 text-sch-mint" aria-hidden />
      </span>
      <span>
        <span className="block font-display text-5xl font-bold leading-none text-white tabular-nums">{valor}</span>
        {detalle && <span className="mt-1.5 block text-xs text-white/80 sm:text-sm">{detalle}</span>}
      </span>
    </Link>
  )
}
