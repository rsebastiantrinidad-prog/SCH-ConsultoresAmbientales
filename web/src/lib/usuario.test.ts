import { describe, expect, it } from 'vitest'
import { USUARIOS, nombreUsuario } from './usuario'

describe('usuarios del demo', () => {
  it('son los tres socios', () => {
    expect(USUARIOS.map((u) => u.nombre)).toEqual(['Hugo', 'Karina', 'Lilian'])
  })
  it('"todos" se muestra como Todos', () => {
    expect(nombreUsuario('todos')).toBe('Todos')
    expect(nombreUsuario('karina')).toBe('Karina')
  })
})
