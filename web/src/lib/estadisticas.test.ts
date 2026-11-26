import { describe, expect, it } from 'vitest'
import { cambiarVigencia, simularEnvio, type Contexto } from './acciones'
import { estadisticas } from './estadisticas'
import { HOY_POR_DEFECTO, sumarDias } from './formato'
import { derivarRecordatorios } from './reglas'
import { construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)
const e = estadisticas(datos, HOY)

describe('estadísticas de la cartera', () => {
  it('documentos por estado (sin las propuestas)', () => {
    expect(e.documentos_total).toBe(191)
    expect(e.documentos).toEqual({ vigente: 170, en_revision: 1, por_vencer: 11, pendiente: 3, observado: 1, vencido: 5 })
    expect(e.pct_al_dia).toBe(90)
  })
  it('semáforo total y por socio', () => {
    expect(e.semaforo).toEqual({ verde: 25, ambar: 11, rojo: 6 })
    expect(e.semaforo_por_responsable.map((r) => [r.nombre, r.semaforo])).toEqual([
      ['Hugo', { verde: 8, ambar: 4, rojo: 2 }],
      ['Karina', { verde: 8, ambar: 4, rojo: 2 }],
      ['Lilian', { verde: 9, ambar: 3, rojo: 2 }],
    ])
  })
  it('servicios activos y por tipo, de mayor a menor', () => {
    expect(e.servicios_activos).toBe(68)
    expect(e.servicios_por_categoria[0]).toEqual({ categoria: 'residuos', nombre: 'Residuos', cantidad: 21 })
    expect(e.servicios_por_categoria.reduce((n, c) => n + c.cantidad, 0)).toBe(68)
  })
  it('doce meses de carga, que suman lo mismo que el plan anual de cada cliente', () => {
    expect(e.por_mes).toHaveLength(12)
    expect(e.por_mes[0].mes).toBe('2026-11')
    expect(e.por_mes.at(-1)!.mes).toBe('2027-10')
    const visitas = e.por_mes.reduce((n, m) => n + m.visitas, 0)
    const renovaciones = e.por_mes.reduce((n, m) => n + m.renovaciones, 0)
    expect(visitas).toBeGreaterThan(20)
    expect(renovaciones).toBeGreaterThan(30)
  })
  it('trámites en curso, del menos avanzado al más avanzado', () => {
    expect(e.tramites.map((t) => [t.servicio, t.avance])).toEqual([
      ['Efluentes líquidos', 33],
      ['Licencia ambiental', 40],
      ['Auditoría ambiental y PGA', 67],
    ])
  })
  it('se filtra por responsable', () => {
    const k = estadisticas(datos, HOY, 'karina')
    expect(k.semaforo).toEqual({ verde: 8, ambar: 4, rojo: 2 })
    expect(k.semaforo_por_responsable).toHaveLength(1)
    expect(k.tramites.map((t) => t.servicio)).toEqual(['Licencia ambiental', 'Auditoría ambiental y PGA'])
  })
  it('cuenta los avisos simulados de los últimos 30 días y reacciona a los cambios', () => {
    const ctx: Contexto = { hoy: HOY, autor: 'hugo', nuevoId: (p) => `${p}-e` }
    const conAviso = simularEnvio(datos, ctx, derivarRecordatorios(datos)[0], 'Mail')
    expect(estadisticas(conAviso, HOY).avisos_30).toBe(1)
    const vencido = datos.documentos.find((d) => d.vigente_hasta === sumarDias(HOY, -10))!
    expect(estadisticas(cambiarVigencia(datos, vencido.id, sumarDias(HOY, 200)), HOY).documentos.vencido).toBe(4)
  })
})
