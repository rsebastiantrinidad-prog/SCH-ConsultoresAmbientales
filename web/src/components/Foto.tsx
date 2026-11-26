import type { ReactNode } from 'react'
import { FOTOS, srcFoto, srcsetFoto, type NombreFoto } from '../lib/fotos'

/**
 * Foto optimizada: el navegador elige el ancho con srcset/sizes. Por defecto es decorativa (alt vacío)
 * y carga diferida; `prioridad` es para la que se ve al abrir la pantalla.
 */
export function Foto({
  nombre, sizes, className = '', alt = '', prioridad = false, posicion,
}: {
  nombre: NombreFoto
  sizes: string
  className?: string
  alt?: string
  prioridad?: boolean
  /** object-position, para elegir qué parte de la foto queda a la vista al recortar */
  posicion?: string
}) {
  const f = FOTOS[nombre]
  return (
    <img
      src={srcFoto(nombre, f.anchos[1])}
      srcSet={srcsetFoto(nombre)}
      sizes={sizes}
      width={f.ancho}
      height={f.alto}
      alt={alt}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={prioridad ? 'high' : 'auto'}
      className={className}
      style={posicion ? { objectPosition: posicion } : undefined}
    />
  )
}

/**
 * Encabezado con foto de fondo y velo oscuro (estilo de las tarjetas del sitio): el texto va en blanco encima.
 * El velo es más denso a la izquierda, donde va el texto, para que el contraste no dependa de la foto.
 */
export function BannerFoto({
  nombre, children, className = '', prioridad = false, posicion = 'center',
}: {
  nombre: NombreFoto
  children: ReactNode
  className?: string
  prioridad?: boolean
  posicion?: string
}) {
  return (
    <section className={`relative isolate overflow-hidden bg-sch-black text-white ${className}`}>
      <Foto nombre={nombre} sizes="(min-width: 1280px) 1280px, 100vw" prioridad={prioridad} posicion={posicion} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.3) 100%)' }}
        aria-hidden
      />
      {children}
    </section>
  )
}
