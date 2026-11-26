import { describe, expect, it } from 'vitest'
import {
  adjuntarArchivo, agregarNota, agregarServicio, avanzarEtapa, cambiarCarga, cambiarVigencia, marcarHecho, posponer,
  retrocederEtapa, simularEnvio, type Contexto,
} from './acciones'
import { HOY_POR_DEFECTO, sumarDias } from './formato'
import { avance, derivarRecordatorios, documentosDeCliente, estadoDocumento, etapaActual, etapasDeServicio, semaforoCliente } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
let n = 0
const ctx: Contexto = { hoy: HOY, autor: 'karina', nuevoId: (p) => `${p}-t${++n}` }
const base = construirSeed(HOY)
const cliente = (razon: string) => base.clientes.find((c) => c.razon_social === razon)!

describe('cambiar la vigencia actualiza el semáforo', () => {
  it('renovar el análisis vencido saca a Metalúrgica Ejemplo del rojo', () => {
    const c = cliente(CLIENTES_GUION.metalurgica)
    const analisis = documentosDeCliente(base, c.id).find((d) => d.nombre === 'Análisis de laboratorio de efluentes')!
    expect(semaforoCliente(base, c.id, HOY)).toBe('rojo')
    const datos = cambiarVigencia(base, analisis.id, sumarDias(HOY, 180))
    // Queda ámbar por la auditoría que vence en 30 días
    expect(semaforoCliente(datos, c.id, HOY)).toBe('ambar')
    expect(base.documentos.find((d) => d.id === analisis.id)!.vigente_hasta).not.toBe(sumarDias(HOY, 180)) // no muta
  })
  it('el recordatorio de vencimiento se mueve con la nueva fecha', () => {
    const doc = base.documentos[0]
    const datos = cambiarVigencia(base, doc.id, '2027-05-01')
    expect(derivarRecordatorios(datos).find((r) => r.id === `venc-${doc.id}`)!.fecha).toBe('2027-05-01')
  })
})

describe('documentos', () => {
  it('observar pide motivo y deja quién lo revisó', () => {
    const doc = base.documentos[0]
    const d = cambiarCarga(base, ctx, doc.id, 'observado', '  Falta firma  ').documentos.find((x) => x.id === doc.id)!
    expect(d).toMatchObject({ carga: 'observado', observacion: 'Falta firma', revisado_por: 'karina', fecha_revision: HOY })
    expect(estadoDocumento(d, HOY)).toBe('observado')
  })
  it('adjuntar un archivo a un pendiente lo pasa a revisión (solo el nombre)', () => {
    const pendiente = base.documentos.find((d) => d.carga === 'pendiente')!
    const d = adjuntarArchivo(base, ctx, pendiente.id, 'plano.pdf').documentos.find((x) => x.id === pendiente.id)!
    expect(d).toMatchObject({ carga: 'en_revision', archivo: 'plano.pdf' })
  })
})

describe('etapas', () => {
  const licencia = base.servicios.find((s) => s.cliente_id === cliente(CLIENTES_GUION.loteo).id)!
  it('avanzar en Loteo Los Algarrobos pasa de 40% a 60% y deja nota automática', () => {
    const datos = avanzarEtapa(base, ctx, licencia.id)
    const etapas = etapasDeServicio(datos, licencia.id)
    expect(avance(etapas)).toBe(60)
    expect(etapaActual(etapas)).toMatchObject({ nombre: 'Presentación ante el organismo', estado: 'en_curso' })
    const ultima = datos.notas.at(-1)!
    expect(ultima).toMatchObject({ automatica: true, servicio_cliente_id: licencia.id, autor_id: 'karina' })
    expect(ultima.texto).toContain('Estudio de Impacto Ambiental')
  })
  it('retroceder vuelve al 20%', () => {
    const datos = retrocederEtapa(base, ctx, licencia.id)
    const etapas = etapasDeServicio(datos, licencia.id)
    expect(avance(etapas)).toBe(20)
    expect(etapaActual(etapas)).toMatchObject({ nombre: 'Aviso de proyecto', estado: 'en_curso' })
    expect(etapas.filter((e) => e.estado === 'en_curso')).toHaveLength(1)
  })
  it('completar todas las etapas deja el servicio vigente', () => {
    let datos = base
    for (let i = 0; i < 3; i++) datos = avanzarEtapa(datos, ctx, licencia.id)
    expect(avance(etapasDeServicio(datos, licencia.id))).toBe(100)
    expect(datos.servicios.find((s) => s.id === licencia.id)!.estado).toBe('vigente')
  })
})

describe('servicios y notas', () => {
  it('agregar un servicio crea sus documentos y etapas desde el catálogo', () => {
    const c = cliente('Crematorio Parque del Sol (demo)')
    const datos = agregarServicio(base, ctx, c.id, 'efluentes')
    const nuevo = datos.servicios.at(-1)!
    expect(nuevo).toMatchObject({ cliente_id: c.id, servicio_id: 'efluentes', estado: 'en_curso', responsable_id: 'karina' })
    expect(datos.documentos.filter((d) => d.servicio_cliente_id === nuevo.id)).toHaveLength(3)
    expect(etapasDeServicio(datos, nuevo.id).map((e) => e.estado)).toEqual(['en_curso', 'pendiente', 'pendiente'])
  })
  it('no guarda notas vacías', () => {
    expect(agregarNota(base, ctx, base.clientes[0].id, '   ')).toBe(base)
    expect(agregarNota(base, ctx, base.clientes[0].id, 'Llamar el lunes').notas.at(-1)).toMatchObject({ texto: 'Llamar el lunes', automatica: false })
  })
})

describe('recordatorios', () => {
  const r = derivarRecordatorios(base)[0]
  it('posponer mueve 7 días, queda pospuesto y en la bitácora', () => {
    const datos = posponer(base, ctx, r.id)
    expect(derivarRecordatorios(datos).find((x) => x.id === r.id)).toMatchObject({ estado: 'pospuesto', fecha: sumarDias(r.fecha, 7) })
    expect(datos.notas.at(-1)!.texto).toContain('pospuesto')
    // Posponer dos veces suma 14
    expect(derivarRecordatorios(posponer(datos, ctx, r.id)).find((x) => x.id === r.id)!.fecha).toBe(sumarDias(r.fecha, 14))
  })
  it('marcar hecho conserva la fecha pospuesta', () => {
    const datos = marcarHecho(posponer(base, ctx, r.id), r.id)
    expect(derivarRecordatorios(datos).find((x) => x.id === r.id)).toMatchObject({ estado: 'hecho', fecha: sumarDias(r.fecha, 7) })
  })
  it('simular envío lo marca enviado y deja nota, sin enviar nada', () => {
    const datos = simularEnvio(base, ctx, r, 'Mail')
    expect(derivarRecordatorios(datos).find((x) => x.id === r.id)!.estado).toBe('enviado')
    expect(datos.notas.at(-1)!.texto).toContain('Aviso simulado por Mail')
  })
})
