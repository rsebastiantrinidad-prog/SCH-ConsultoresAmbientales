import { describe, expect, it } from 'vitest'
import { moverProximaFecha, posponer, type Contexto } from './acciones'
import { HOY_POR_DEFECTO, sumarDias } from './formato'
import { derivarRecordatorios, planAnual } from './reglas'
import { CLIENTES_GUION, construirSeed } from './seed'

const HOY = HOY_POR_DEFECTO
const datos = construirSeed(HOY)
const ctx: Contexto = { hoy: HOY, autor: 'lilian', nuevoId: (p) => `${p}-p` }
const alimentos = datos.clientes.find((c) => c.razon_social === CLIENTES_GUION.alimentos)!

describe('plan anual de Alimentos del Centro', () => {
  const plan = planAnual(datos, alimentos.id, '2026-11')
  const fila = (nombre: string) => plan.find((f) => f.nombre === nombre)!

  it('ISO 14001: dos auditorías (cada 6 meses) y las renovaciones del período', () => {
    const iso = fila('ISO 14001')
    expect(iso.eventos.filter((e) => e.tipo === 'auditoria').map((e) => e.fecha)).toEqual([sumarDias(HOY, 15), '2027-06-11'])
    expect(iso.eventos.filter((e) => e.tipo === 'renovacion').map((e) => e.titulo)).toEqual([
      'Renovar Informe de auditoría interna',
      'Renovar Revisión por la dirección',
    ])
  })
  it('Residuos peligrosos: una visita anual y tres renovaciones, empezando por la inscripción', () => {
    const residuos = fila('Residuos peligrosos')
    expect(residuos.eventos.filter((e) => e.tipo === 'visita')).toHaveLength(1)
    const renov = residuos.eventos.filter((e) => e.tipo === 'renovacion')
    expect(renov).toHaveLength(3)
    expect(renov[0]).toMatchObject({ titulo: 'Renovar Inscripción anual como generador', fecha: sumarDias(HOY, 45) })
  })
  it('todo cae dentro de los 12 meses y está ordenado', () => {
    for (const f of plan) {
      for (const e of f.eventos) expect(e.fecha >= '2026-11-01' && e.fecha <= '2027-10-31').toBe(true)
      expect(f.eventos.map((e) => e.fecha)).toEqual([...f.eventos.map((e) => e.fecha)].sort())
    }
  })
  it('solo la próxima visita o auditoría se puede mover', () => {
    const movibles = plan.flatMap((f) => f.eventos.filter((e) => e.movible))
    expect(movibles).toHaveLength(2)
  })
  it('un trámite único (licencia) no tiene visitas', () => {
    const loteo = datos.clientes.find((c) => c.razon_social === CLIENTES_GUION.loteo)!
    expect(planAnual(datos, loteo.id, '2026-11')[0].eventos).toEqual([])
  })
})

describe('mover una fecha del plan', () => {
  const residuos = datos.servicios.find((s) => s.cliente_id === alimentos.id && s.servicio_id === 'residuos')!
  it('corre la visita, actualiza el recordatorio y deja nota', () => {
    const d = moverProximaFecha(datos, ctx, residuos.id, '2027-02-15')
    expect(derivarRecordatorios(d).find((r) => r.id === `vis-${residuos.id}`)).toMatchObject({ fecha: '2027-02-15', estado: 'programado' })
    expect(planAnual(d, alimentos.id, '2026-11').find((f) => f.servicio.id === residuos.id)!.eventos.find((e) => e.tipo === 'visita')!.fecha).toBe('2027-02-15')
    expect(d.notas.at(-1)!.texto).toBe('Visita reprogramada del 10/01/2027 al 15/02/2027.')
  })
  it('descarta una posposición anterior de esa visita', () => {
    const pospuesta = posponer(datos, ctx, `vis-${residuos.id}`)
    const d = moverProximaFecha(pospuesta, ctx, residuos.id, '2027-03-01')
    expect(derivarRecordatorios(d).find((r) => r.id === `vis-${residuos.id}`)).toMatchObject({ fecha: '2027-03-01', estado: 'programado' })
  })
})
