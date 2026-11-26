import { describe, expect, it } from 'vitest'
import { HOY_POR_DEFECTO, diasEntre } from './formato'
import { avance, derivarRecordatorios, documentosDeCliente, estadoDocumento, etapaActual, etapasDeServicio, semaforoCliente, textoAviso, variablesFaltantes } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)
const cliente = (razon: string) => datos.clientes.find((c) => c.razon_social === razon)!
const serviciosDe = (razon: string) => datos.servicios.filter((s) => s.cliente_id === cliente(razon).id)

describe('volumen del seed', () => {
  it('42 clientes (más de 40, como la cartera de SCH), con sus servicios y documentos', () => {
    expect(datos.clientes).toHaveLength(42)
    expect(datos.servicios).toHaveLength(69)
    expect(datos.documentos).toHaveLength(196)
  })
  it('Alimentos del Centro sigue siendo el primero en orden alfabético (Plan anual)', () => {
    expect([...datos.clientes].sort((a, b) => a.razon_social.localeCompare(b.razon_social))[0].razon_social).toBe(CLIENTES_GUION.alimentos)
  })
  it('ids únicos', () => {
    for (const lista of [datos.clientes, datos.servicios, datos.documentos, datos.etapas, datos.notas]) {
      expect(new Set(lista.map((x) => x.id)).size).toBe(lista.length)
    }
  })
  it('es determinístico', () => {
    expect(construirSeed(HOY)).toEqual(datos)
  })
})

describe('semáforo', () => {
  const semaforos = datos.clientes.map((c) => semaforoCliente(datos, c.id, HOY))
  it('25 verdes, 11 ámbar y 6 rojos', () => {
    expect(semaforos.filter((s) => s === 'verde')).toHaveLength(25)
    expect(semaforos.filter((s) => s === 'ambar')).toHaveLength(11)
    expect(semaforos.filter((s) => s === 'rojo')).toHaveLength(6)
  })
  it('los socios se reparten parejo: 14 clientes y 2 rojos cada uno', () => {
    for (const socio of ['hugo', 'karina', 'lilian'] as const) {
      const suyos = datos.clientes.filter((c) => c.responsable_id === socio)
      expect(suyos).toHaveLength(14)
      expect(suyos.filter((c) => semaforoCliente(datos, c.id, HOY) === 'rojo')).toHaveLength(2)
    }
  })
  it('es relativo a hoy: con otro hoy da la misma distribución', () => {
    const otro = construirSeed('2027-03-15')
    const rojos = otro.clientes.filter((c) => semaforoCliente(otro, c.id, '2027-03-15') === 'rojo')
    expect(rojos).toHaveLength(6)
  })
})

describe('clientes preparados para el guion', () => {
  it('Metalúrgica Ejemplo: rojo, análisis de laboratorio vencido y auditoría que vence en 30 días', () => {
    const c = cliente(CLIENTES_GUION.metalurgica)
    expect(semaforoCliente(datos, c.id, HOY)).toBe('rojo')
    expect(serviciosDe(CLIENTES_GUION.metalurgica).map((s) => s.servicio_id).sort()).toEqual(['auditoria', 'efluentes'])
    const docs = documentosDeCliente(datos, c.id)
    const analisis = docs.find((d) => d.nombre === 'Análisis de laboratorio de efluentes')!
    expect(estadoDocumento(analisis, HOY)).toBe('vencido')
    const auditoria = docs.find((d) => d.nombre === 'Auditoría ambiental de cumplimiento')!
    expect(estadoDocumento(auditoria, HOY)).toBe('por_vencer')
    expect(diasEntre(HOY, auditoria.vigente_hasta!)).toBe(30)
  })

  it('Loteo Los Algarrobos: licencia en Estudio de Impacto Ambiental, 40% y 3 pendientes', () => {
    const [licencia] = serviciosDe(CLIENTES_GUION.loteo)
    expect(licencia.servicio_id).toBe('licencia')
    expect(licencia.estado).toBe('en_curso')
    const etapas = etapasDeServicio(datos, licencia.id)
    expect(avance(etapas)).toBe(40)
    expect(etapaActual(etapas)?.nombre).toBe('Estudio de Impacto Ambiental')
    const docs = documentosDeCliente(datos, cliente(CLIENTES_GUION.loteo).id)
    expect(docs.filter((d) => d.carga === 'pendiente')).toHaveLength(3)
  })

  it('Alimentos del Centro: ISO y residuos, casi todo verde, con la inscripción anual por vencer', () => {
    const c = cliente(CLIENTES_GUION.alimentos)
    expect(serviciosDe(CLIENTES_GUION.alimentos).map((s) => s.servicio_id).sort()).toEqual(['iso14001', 'residuos'])
    const estados = documentosDeCliente(datos, c.id).map((d) => [d.nombre, estadoDocumento(d, HOY)])
    expect(estados.filter(([, e]) => e === 'por_vencer')).toEqual([['Inscripción anual como generador', 'por_vencer']])
    expect(estados.filter(([, e]) => e === 'vigente')).toHaveLength(5)
  })
})

describe('reglas sobre el seed', () => {
  it('todos los avisos salen con las variables completas', () => {
    for (const r of derivarRecordatorios(datos)) {
      expect(variablesFaltantes(textoAviso(datos, r))).toEqual([])
    }
  })
  it('hay recordatorios para la semana (para que el tablero tenga contenido)', () => {
    const semana = derivarRecordatorios(datos).filter((r) => {
      const d = diasEntre(HOY, r.fecha)
      return d >= 0 && d <= 7
    })
    expect(semana.length).toBeGreaterThanOrEqual(3)
  })
})

describe('datos ficticios', () => {
  it('todo cliente y contacto lleva "(demo)" y usa dominios y teléfonos que no existen', () => {
    for (const c of datos.clientes) {
      expect(c.razon_social).toContain('(demo)')
      expect(c.contacto_nombre).toContain('(demo)')
      expect(c.contacto_email).toMatch(/@ejemplo\.test$/)
      expect(c.contacto_telefono).toMatch(/^351 000-\d{4}$/)
    }
  })
})
