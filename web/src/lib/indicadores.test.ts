import { describe, expect, it } from 'vitest'
import { cambiarVigencia } from './acciones'
import { HOY_POR_DEFECTO, sumarDias } from './formato'
import { compararFilas, filasClientes, indicadores, motivoSemaforo, recordatoriosSemana } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)

describe('indicadores del tablero', () => {
  it('se calculan desde los datos', () => {
    expect(indicadores(datos, HOY)).toEqual({
      clientes_activos: 42,
      vencimientos_30: 5,
      vencidos: 5, // Metalúrgica, Frigorífico y los tres rojos generados
      documentacion_faltante: 3, // los tres pendientes del Loteo
      clientes_con_faltante: 1,
      tramites_en_curso: 3,
    })
  })
  it('se filtran por responsable', () => {
    expect(indicadores(datos, HOY, 'karina')).toMatchObject({ clientes_activos: 14, documentacion_faltante: 3, tramites_en_curso: 2 })
    expect(indicadores(datos, HOY, 'lilian')).toMatchObject({ clientes_activos: 14, vencimientos_30: 0, vencidos: 2, documentacion_faltante: 0 })
  })
  it('cambian cuando cambia una vigencia', () => {
    const doc = datos.documentos.find((d) => d.nombre === 'Inscripción anual como generador' && d.vigente_hasta === sumarDias(HOY, 45))!
    expect(indicadores(cambiarVigencia(datos, doc.id, sumarDias(HOY, 10)), HOY).vencimientos_30).toBe(6)
  })
})

describe('lista "Esta semana"', () => {
  const semana = recordatoriosSemana(datos, HOY)
  it('trae lo atrasado y lo de los próximos 7 días, sin lo hecho', () => {
    expect(semana.length).toBeGreaterThanOrEqual(3)
    for (const r of semana) expect(r.fecha <= sumarDias(HOY, 7)).toBe(true)
    expect(semana.some((r) => r.tipo === 'vencimiento' && r.fecha < HOY)).toBe(true)
    expect(semana.some((r) => r.tipo === 'pedido_documentacion')).toBe(true)
    expect(semana.some((r) => r.tipo === 'visita')).toBe(true)
  })
  it('respeta el responsable', () => {
    expect(recordatoriosSemana(datos, HOY, 'hugo').every((r) => r.asignado_a === 'hugo')).toBe(true)
  })
})

describe('filas de la tabla de clientes', () => {
  const filas = filasClientes(datos, HOY).sort(compararFilas)
  it('ordena peor semáforo primero y, dentro, el vencimiento más cercano', () => {
    expect(filas.map((f) => f.semaforo)).toEqual([...Array(6).fill('rojo'), ...Array(11).fill('ambar'), ...Array(25).fill('verde')])
    expect(filas[0].cliente.razon_social).toBe('Frigorífico La Pampita (demo)') // vencido hace 20 días
  })
  it('muestra servicios activos y próximo vencimiento', () => {
    const metal = filas.find((f) => f.cliente.razon_social === CLIENTES_GUION.metalurgica)!
    expect(metal.servicios_activos).toBe(2)
    expect(metal.proximo_vencimiento).toEqual({ fecha: sumarDias(HOY, -10), documento: 'Análisis de laboratorio de efluentes' })
    const loteo = filas.find((f) => f.cliente.razon_social === CLIENTES_GUION.loteo)!
    expect(loteo).toMatchObject({ faltantes: 3, tramites_en_curso: 1, proximo_vencimiento: null })
  })
})

describe('motivo del semáforo', () => {
  const id = (razon: string) => datos.clientes.find((c) => c.razon_social === razon)!.id
  it('explica lo más grave primero', () => {
    expect(motivoSemaforo(datos, id(CLIENTES_GUION.metalurgica), HOY)).toBe('Análisis de laboratorio de efluentes venció hace 10 días')
    expect(motivoSemaforo(datos, id('Estación de Servicio Ruta 9 (demo)'), HOY)).toBe('Plan de Gestión Ambiental observado')
    expect(motivoSemaforo(datos, id(CLIENTES_GUION.loteo), HOY)).toBe('3 documentos faltan')
    expect(motivoSemaforo(datos, id(CLIENTES_GUION.alimentos), HOY)).toBe('Inscripción anual como generador vence en 45 días')
    expect(motivoSemaforo(datos, id('Crematorio Parque del Sol (demo)'), HOY)).toBeNull()
  })
})
