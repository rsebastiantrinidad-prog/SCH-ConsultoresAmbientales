import { useSyncExternalStore } from 'react'

/** Socios de SCH que aparecen como responsables en el demo. Sin contraseña: se elige en un menú. */
export const USUARIOS = [
  { id: 'hugo', nombre: 'Hugo' },
  { id: 'karina', nombre: 'Karina' },
  { id: 'lilian', nombre: 'Lilian' },
] as const

export type IdUsuario = (typeof USUARIOS)[number]['id']
/** "todos" = sin filtrar por responsable. */
export type Seleccion = IdUsuario | 'todos'

const CLAVE = 'sch-usuario'
const oyentes = new Set<() => void>()

function leer(): Seleccion {
  try {
    const v = localStorage.getItem(CLAVE)
    if (v === 'todos' || USUARIOS.some((u) => u.id === v)) return v as Seleccion
  } catch {
    /* sin almacenamiento: se usa el valor por defecto */
  }
  return 'todos'
}

let actual: Seleccion = leer()

/** Usuario elegido, fuera de React (lo usa el store para firmar notas). */
export const usuarioActual = (): Seleccion => actual

export function elegirUsuario(v: Seleccion) {
  actual = v
  try {
    localStorage.setItem(CLAVE, v)
  } catch {
    /* sin almacenamiento: vale solo para esta pestaña */
  }
  oyentes.forEach((f) => f())
}

function suscribir(f: () => void) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

/** Usuario elegido en la barra superior; se recuerda entre visitas. */
export function useUsuario(): Seleccion {
  return useSyncExternalStore(suscribir, () => actual)
}

export function nombreUsuario(v: Seleccion): string {
  return v === 'todos' ? 'Todos' : (USUARIOS.find((u) => u.id === v)?.nombre ?? v)
}
