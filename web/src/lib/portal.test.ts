import { describe, expect, it } from 'vitest'
import { subirDocumentoCliente, type Contexto } from './acciones'
import { HOY_POR_DEFECTO } from './formato'
import { semaforoCliente, vistaCliente } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)
const ctx: Contexto = { hoy: HOY, autor: 'hugo', nuevoId: (p) => `${p}-c` }
const id = (razon: string) => datos.clientes.find((c) => c.razon_social === razon)!.id

describe('vista del cliente', () => {
  it('Loteo ve su licencia al 40% y los tres documentos que faltan', () => {
    const v = vistaCliente(datos, id(CLIENTES_GUION.loteo), HOY)!
    expect(v.servicios).toEqual([expect.objectContaining({ nombre: 'Licencia ambiental', avance: 40, etapa: 'Estudio de Impacto Ambiental' })])
    expect(v.necesitamos.map((d) => d.nombre)).toEqual(['Plano de mensura', 'Estudio de Impacto Ambiental', 'Factibilidad de agua'])
    expect(v.al_dia).toHaveLength(2)
  })
  it('primero lo vencido y lo observado', () => {
    expect(vistaCliente(datos, id(CLIENTES_GUION.metalurgica), HOY)!.necesitamos.map((d) => d.estado)).toEqual(['vencido', 'por_vencer'])
    const estacion = vistaCliente(datos, id('Estación de Servicio Ruta 9 (demo)'), HOY)!
    expect(estacion.necesitamos[0]).toMatchObject({ estado: 'observado', observacion: 'Falta la firma del responsable técnico.' })
  })
  it('no trae notas internas ni datos de otros clientes', () => {
    const v = vistaCliente(datos, id(CLIENTES_GUION.metalurgica), HOY)!
    const texto = JSON.stringify(v)
    expect(texto).not.toContain('Marcela pidió') // nota interna del seed
    for (const otro of datos.clientes.filter((c) => c.razon_social !== CLIENTES_GUION.metalurgica)) expect(texto).not.toContain(otro.razon_social)
    expect(Object.keys(v)).not.toContain('notas')
  })
  it('las propuestas todavía no se muestran', () => {
    const v = vistaCliente(datos, id('Municipalidad de Villa Ejemplo (demo)'), HOY)!
    expect(v.servicios.map((s) => s.nombre)).toEqual(['Auditoría ambiental y PGA'])
  })
})

describe('el cliente sube un documento', () => {
  it('pasa a revisión, se ve en la ficha del socio y avisa al responsable', () => {
    const loteo = id(CLIENTES_GUION.loteo)
    const plano = vistaCliente(datos, loteo, HOY)!.necesitamos[0]
    const d = subirDocumentoCliente(datos, ctx, plano.id, 'plano-mensura.pdf')
    expect(d.documentos.find((x) => x.id === plano.id)).toMatchObject({ carga: 'en_revision', archivo: 'plano-mensura.pdf' })
    expect(d.notas.at(-1)).toMatchObject({ autor_id: 'karina', automatica: true, texto: 'El cliente subió "plano-mensura.pdf" para Plano de mensura. Queda en revisión.' })
    expect(vistaCliente(d, loteo, HOY)!.necesitamos).toHaveLength(2)
  })
  it('subir el análisis vencido saca a Metalúrgica del rojo mientras se revisa', () => {
    const metal = id(CLIENTES_GUION.metalurgica)
    const analisis = vistaCliente(datos, metal, HOY)!.necesitamos[0]
    const d = subirDocumentoCliente(datos, ctx, analisis.id, 'analisis-nov.pdf')
    expect(semaforoCliente(d, metal, HOY)).toBe('ambar')
  })
})
