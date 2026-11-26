/**
 * Fotos de la app. Los archivos los genera `npm run fotos` (scripts/optimizar-fotos.mjs) en public/fotos/,
 * en WebP y en varios anchos; acá van los anchos disponibles para armar el srcset.
 */
import type { CategoriaServicio } from './tipos'

export const FOTOS = {
  'ingeniera-planta': { anchos: [800, 1400, 2000], ancho: 2000, alto: 667 },
  'carpetas-vencimientos': { anchos: [480, 800, 1200], ancho: 1536, alto: 1024 },
  'auditoria-planta': { anchos: [480, 800, 1200], ancho: 1536, alto: 1024 },
  'efluentes-muestra': { anchos: [480, 800, 1200], ancho: 1536, alto: 1024 },
  'loteo-aereo': { anchos: [480, 800, 1200], ancho: 1536, alto: 1024 },
} as const

export type NombreFoto = keyof typeof FOTOS

export const srcFoto = (nombre: NombreFoto, ancho: number) => `/fotos/${nombre}-${ancho}.webp`

export function srcsetFoto(nombre: NombreFoto): string {
  return FOTOS[nombre].anchos.map((a) => `${srcFoto(nombre, a)} ${a}w`).join(', ')
}

/** Foto de cada categoría de servicio; las que no tienen usan el patrón de hojas. */
export const FOTO_CATEGORIA: Partial<Record<CategoriaServicio, NombreFoto>> = {
  licencia: 'loteo-aereo',
  efluentes: 'efluentes-muestra',
  auditoria_pga: 'auditoria-planta',
  iso: 'auditoria-planta',
}
