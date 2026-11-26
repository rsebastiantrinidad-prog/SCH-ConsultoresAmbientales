import { describe, expect, it } from 'vitest'
import {
  avance, derivarRecordatorios, esFaltante, estadoDocumento, etapaActual, fechaPospuesta, grupoRecordatorio,
  semaforoDocumentos, textoAviso, variablesFaltantes,
} from './reglas'
import type { Datos, Documento, Etapa, Recordatorio } from './tipos'

const HOY = '2026-11-26'

const doc = (p: Partial<Documento>): Documento => ({
  id: 'd1', servicio_cliente_id: 's1', nombre: 'Análisis de efluentes', carga: 'revisado', emisor: 'Lab', fecha_emision: '2026-01-01',
  vigente_hasta: '2027-06-01', anticipacion_dias: 60, fecha_objetivo: null, archivo: null, revisado_por: 'hugo', fecha_revision: '2026-01-05',
  observacion: null, ...p,
})

const etapa = (orden: number, estado: Etapa['estado']): Etapa => ({
  id: `e${orden}`, servicio_cliente_id: 's1', nombre: `Etapa ${orden}`, orden, estado, fecha_prevista: HOY, fecha_real: null,
})

describe('estado del documento', () => {
  it('lo cargado a mano manda: pendiente, en revisión y observado', () => {
    expect(estadoDocumento(doc({ carga: 'pendiente' }), HOY)).toBe('pendiente')
    expect(estadoDocumento(doc({ carga: 'en_revision' }), HOY)).toBe('en_revision')
    expect(estadoDocumento(doc({ carga: 'observado', vigente_hasta: '2020-01-01' }), HOY)).toBe('observado')
  })
  it('revisado sin vigencia queda vigente', () => {
    expect(estadoDocumento(doc({ vigente_hasta: null }), HOY)).toBe('vigente')
  })
  it('vence hoy: todavía no está vencido, está por vencer', () => {
    expect(estadoDocumento(doc({ vigente_hasta: HOY }), HOY)).toBe('por_vencer')
  })
  it('venció ayer: vencido', () => {
    expect(estadoDocumento(doc({ vigente_hasta: '2026-11-25' }), HOY)).toBe('vencido')
  })
  it('borde de la anticipación: a 59 días por vencer, a 60 vigente', () => {
    expect(estadoDocumento(doc({ vigente_hasta: '2027-01-24' }), HOY)).toBe('por_vencer') // 59 días
    expect(estadoDocumento(doc({ vigente_hasta: '2027-01-25' }), HOY)).toBe('vigente') // 60 días
  })
  it('respeta la anticipación propia del documento', () => {
    expect(estadoDocumento(doc({ vigente_hasta: '2026-12-26', anticipacion_dias: 15 }), HOY)).toBe('vigente')
  })
})

describe('documentación faltante', () => {
  it('pendiente que se necesita dentro de 14 días (o atrasado)', () => {
    expect(esFaltante(doc({ carga: 'pendiente', fecha_objetivo: '2026-12-10' }), HOY)).toBe(true) // 14 días
    expect(esFaltante(doc({ carga: 'pendiente', fecha_objetivo: '2026-11-01' }), HOY)).toBe(true)
    expect(esFaltante(doc({ carga: 'pendiente', fecha_objetivo: '2026-12-11' }), HOY)).toBe(false) // 15 días
    expect(esFaltante(doc({ carga: 'pendiente', fecha_objetivo: null }), HOY)).toBe(false)
    expect(esFaltante(doc({ carga: 'revisado', fecha_objetivo: '2026-11-30' }), HOY)).toBe(false)
  })
})

describe('semáforo', () => {
  it('rojo si hay vencido u observado', () => {
    expect(semaforoDocumentos([doc({}), doc({ vigente_hasta: '2026-10-01' })], HOY)).toBe('rojo')
    expect(semaforoDocumentos([doc({ carga: 'observado' })], HOY)).toBe('rojo')
  })
  it('ámbar si hay por vencer o pendiente faltante', () => {
    expect(semaforoDocumentos([doc({}), doc({ vigente_hasta: '2026-12-20' })], HOY)).toBe('ambar')
    expect(semaforoDocumentos([doc({ carga: 'pendiente', fecha_objetivo: '2026-12-01' })], HOY)).toBe('ambar')
  })
  it('verde si todo está vigente (o pendiente sin apuro)', () => {
    expect(semaforoDocumentos([doc({}), doc({ carga: 'pendiente', fecha_objetivo: '2027-03-01' })], HOY)).toBe('verde')
    expect(semaforoDocumentos([], HOY)).toBe('verde')
  })
})

describe('avance del servicio', () => {
  it('etapas hechas sobre el total', () => {
    const etapas = [etapa(1, 'hecha'), etapa(2, 'hecha'), etapa(3, 'en_curso'), etapa(4, 'pendiente'), etapa(5, 'pendiente')]
    expect(avance(etapas)).toBe(40)
    expect(etapaActual(etapas)?.orden).toBe(3)
    expect(avance([])).toBe(0)
    expect(etapaActual([etapa(1, 'hecha')])).toBeNull()
  })
})

const datos = (p: Partial<Datos> = {}): Datos => ({
  clientes: [{ id: 'c1', razon_social: 'Metalúrgica Ejemplo S.A. (demo)', rubro: 'Metalúrgica', localidad: 'Córdoba', contacto_nombre: 'Ana', contacto_email: 'a@ejemplo.test', contacto_telefono: '351 000-0001', estado: 'activo', fecha_alta: '2024-01-01', responsable_id: 'hugo' }],
  catalogo: [{ id: 'efluentes', nombre: 'Efluentes líquidos', categoria: 'efluentes', periodicidad_meses: 6, documentos: [], etapas: [] }],
  servicios: [{ id: 's1', cliente_id: 'c1', servicio_id: 'efluentes', estado: 'vigente', inicio: '2025-01-01', periodicidad_meses: 6, proxima_fecha: '2026-12-15', responsable_id: 'hugo' }],
  documentos: [
    doc({ id: 'd1', vigente_hasta: '2026-11-16' }),
    doc({ id: 'd2', nombre: 'Permiso de vuelco', carga: 'pendiente', vigente_hasta: null, fecha_objetivo: '2026-12-05' }),
    doc({ id: 'd3', nombre: 'Declaración jurada', carga: 'observado', fecha_revision: '2026-11-20' }),
  ],
  etapas: [],
  notas: [],
  ajustes_recordatorios: {},
  ...p,
})

describe('recordatorios derivados', () => {
  it('salen de vigencias, pendientes, observados y servicios recurrentes', () => {
    const r = derivarRecordatorios(datos())
    expect(r.map((x) => [x.id, x.tipo, x.fecha])).toEqual([
      ['venc-d1', 'vencimiento', '2026-11-16'],
      ['seg-d3', 'seguimiento', '2026-11-27'],
      ['ped-d2', 'pedido_documentacion', '2026-12-05'],
      ['vis-s1', 'visita', '2026-12-15'],
    ])
    expect(r.every((x) => x.asignado_a === 'hugo' && x.cliente_id === 'c1' && x.estado === 'programado')).toBe(true)
  })
  it('un servicio en propuesta o finalizado no genera visita', () => {
    const d = datos()
    d.servicios[0].estado = 'propuesta'
    expect(derivarRecordatorios(d).some((x) => x.tipo === 'visita')).toBe(false)
  })
  it('aplica los ajustes hechos a mano', () => {
    const r = derivarRecordatorios(datos({ ajustes_recordatorios: { 'vis-s1': { estado: 'pospuesto', fecha: '2026-12-22' } } }))
    expect(r.find((x) => x.id === 'vis-s1')).toMatchObject({ estado: 'pospuesto', fecha: '2026-12-22' })
  })
})

describe('grupos y posponer', () => {
  const rec = (fecha: string) => ({ fecha }) as Recordatorio
  it('agrupa por días que faltan', () => {
    expect(grupoRecordatorio(rec('2026-11-25'), HOY)).toBe('vencidos')
    expect(grupoRecordatorio(rec(HOY), HOY)).toBe('esta_semana')
    expect(grupoRecordatorio(rec('2026-12-03'), HOY)).toBe('esta_semana') // 7 días
    expect(grupoRecordatorio(rec('2026-12-04'), HOY)).toBe('proximos_30')
    expect(grupoRecordatorio(rec('2026-12-26'), HOY)).toBe('proximos_30') // 30 días
    expect(grupoRecordatorio(rec('2026-12-27'), HOY)).toBe('mas_adelante')
  })
  it('posponer suma 7 días', () => {
    expect(fechaPospuesta(rec('2026-12-29'))).toBe('2027-01-05')
  })
})

describe('avisos', () => {
  it('la vista previa tiene todas las variables completas, en cada tipo', () => {
    const d = datos()
    for (const r of derivarRecordatorios(d)) {
      const texto = textoAviso(d, r)
      expect(variablesFaltantes(texto)).toEqual([])
      expect(texto).toContain('Metalúrgica Ejemplo S.A. (demo)')
      expect(texto).toContain('Hugo')
    }
  })
  it('el aviso de vencimiento nombra el documento y la fecha', () => {
    const d = datos()
    const r = derivarRecordatorios(d).find((x) => x.id === 'venc-d1')!
    expect(textoAviso(d, r)).toContain('Análisis de efluentes vence el 16/11/2026')
  })
  it('la visita usa el nombre del servicio', () => {
    const d = datos()
    const r = derivarRecordatorios(d).find((x) => x.tipo === 'visita')!
    expect(textoAviso(d, r)).toContain('visita de Efluentes líquidos')
  })
})
