import { describe, expect, it } from 'vitest'
import { fechaLarga, mesDe, nombreMes, relativo, semanasDelMes, sumarMesesAMes } from './formato'

describe('fechas', () => {
  it('relativo', () => {
    expect(relativo('2026-11-26', '2026-11-26')).toBe('hoy')
    expect(relativo('2026-11-26', '2026-11-27')).toBe('mañana')
    expect(relativo('2026-11-26', '2026-11-25')).toBe('ayer')
    expect(relativo('2026-11-26', '2026-12-01')).toBe('en 5 días')
    expect(relativo('2026-11-26', '2026-11-16')).toBe('hace 10 días')
  })
  it('nombres en castellano', () => {
    expect(fechaLarga('2026-11-26')).toBe('jueves 26 de noviembre')
    expect(nombreMes('2026-11')).toBe('noviembre de 2026')
  })
  it('meses', () => {
    expect(mesDe('2026-11-26')).toBe('2026-11')
    expect(sumarMesesAMes('2026-12', 1)).toBe('2027-01')
    expect(sumarMesesAMes('2026-01', -1)).toBe('2025-12')
  })
})

describe('grilla del mes', () => {
  it('noviembre de 2026: arranca el lunes 26/10 y termina el domingo 6/12', () => {
    const semanas = semanasDelMes('2026-11')
    expect(semanas).toHaveLength(6)
    expect(semanas.every((s) => s.length === 7)).toBe(true)
    expect(semanas[0][0]).toBe('2026-10-26')
    expect(semanas[0][6]).toBe('2026-11-01')
    expect(semanas.at(-1)!.at(-1)).toBe('2026-12-06')
  })
  it('febrero de 2027 entra en 4 semanas justas', () => {
    const semanas = semanasDelMes('2027-02')
    expect(semanas).toHaveLength(4)
    expect(semanas[0][0]).toBe('2027-02-01')
  })
})
