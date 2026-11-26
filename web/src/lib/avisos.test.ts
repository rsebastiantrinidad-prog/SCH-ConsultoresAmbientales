import { describe, expect, it } from 'vitest'
import { simularEnvio, type Contexto } from './acciones'
import { HOY_POR_DEFECTO, sumarDias } from './formato'
import { asuntoAviso, derivarRecordatorios, recordatorioDeDocumento, textoAviso, variablesFaltantes } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)
const ctx: Contexto = { hoy: HOY, autor: 'lilian', nuevoId: (p) => `${p}-x` }
const docDe = (razon: string, nombre: string) => {
  const c = datos.clientes.find((x) => x.razon_social === razon)!
  const ids = new Set(datos.servicios.filter((s) => s.cliente_id === c.id).map((s) => s.id))
  return datos.documentos.find((d) => ids.has(d.servicio_cliente_id) && d.nombre === nombre)!
}

describe('"Pedir al cliente" desde un documento', () => {
  it('un vencido pide la renovación con "venció el" y todas las variables', () => {
    const analisis = docDe(CLIENTES_GUION.metalurgica, 'Análisis de laboratorio de efluentes')
    const r = recordatorioDeDocumento(datos, analisis.id, HOY)!
    expect(r.tipo).toBe('vencimiento')
    const texto = textoAviso(datos, r, HOY)
    expect(texto).toContain('Análisis de laboratorio de efluentes venció el 16/11/2026')
    expect(texto).toContain('Metalúrgica Ejemplo S.A. (demo)')
    expect(texto).toContain('Hugo')
    expect(variablesFaltantes(texto)).toEqual([])
    expect(asuntoAviso(datos, r, HOY)).toBe('Análisis de laboratorio de efluentes: venció el 16/11/2026')
  })
  it('uno por vencer sigue diciendo "vence el"', () => {
    const auditoria = docDe(CLIENTES_GUION.metalurgica, 'Auditoría ambiental de cumplimiento')
    expect(textoAviso(datos, recordatorioDeDocumento(datos, auditoria.id, HOY)!, HOY)).toContain(`vence el`)
  })
  it('un pendiente con fecha usa su pedido de documentación', () => {
    const plano = docDe(CLIENTES_GUION.loteo, 'Plano de mensura')
    const r = recordatorioDeDocumento(datos, plano.id, HOY)!
    expect(r).toMatchObject({ id: `ped-${plano.id}`, tipo: 'pedido_documentacion', fecha: sumarDias(HOY, 6) })
  })
  it('un pendiente sin fecha arma un pedido para dentro de 14 días', () => {
    const aviso = docDe('Municipalidad de Villa Ejemplo (demo)', 'Aviso de proyecto')
    expect(derivarRecordatorios(datos).some((r) => r.documento_id === aviso.id)).toBe(false)
    const r = recordatorioDeDocumento(datos, aviso.id, HOY)!
    expect(r).toMatchObject({ tipo: 'pedido_documentacion', fecha: sumarDias(HOY, 14), asignado_a: 'lilian' })
    expect(variablesFaltantes(textoAviso(datos, r, HOY))).toEqual([])
    // Simular el envío deja la nota aunque el recordatorio no exista entre los derivados
    const despues = simularEnvio(datos, ctx, r, 'WhatsApp')
    expect(despues.notas.at(-1)!.texto).toBe('Aviso simulado por WhatsApp: Pedir Aviso de proyecto.')
    expect(despues.ajustes_recordatorios).toEqual({})
  })
})
