/**
 * Acciones del demo como funciones puras: reciben los datos y devuelven datos nuevos (sin mutar).
 * El store las aplica y guarda; así se pueden probar sin interfaz y después pasar a Supabase.
 */
import { fechaCorta, sumarDias, sumarMeses } from './formato'
import { ANTICIPACION_DIAS, derivarRecordatorios, etapaActual, etapasDeServicio, fechaPospuesta } from './reglas'
import type { CargaDocumento, Cliente, Datos, Documento, Etapa, EstadoRecordatorio, Fecha, Nota } from './tipos'
import type { IdUsuario } from './usuario'

export interface Contexto {
  hoy: Fecha
  autor: IdUsuario
  /** Generador de ids nuevos (inyectable para las pruebas). */
  nuevoId: (prefijo: string) => string
}

function nota(ctx: Contexto, cliente_id: string, servicio_cliente_id: string | null, texto: string, automatica: boolean): Nota {
  return { id: ctx.nuevoId('nota'), cliente_id, servicio_cliente_id, autor_id: ctx.autor, fecha: ctx.hoy, texto, automatica }
}

function clienteDeServicio(datos: Datos, servicioId: string): string {
  const s = datos.servicios.find((x) => x.id === servicioId)
  if (!s) throw new Error(`No existe el servicio ${servicioId}`)
  return s.cliente_id
}

function cambiarDocumento(datos: Datos, id: string, f: (d: Documento) => Documento): Datos {
  return { ...datos, documentos: datos.documentos.map((d) => (d.id === id ? f(d) : d)) }
}

// ---------------------------------------------------------------- Clientes y notas

export type CambiosCliente = Partial<Omit<Cliente, 'id'>>

export function editarCliente(datos: Datos, id: string, cambios: CambiosCliente): Datos {
  return { ...datos, clientes: datos.clientes.map((c) => (c.id === id ? { ...c, ...cambios } : c)) }
}

export function agregarNota(datos: Datos, ctx: Contexto, cliente_id: string, texto: string, servicio_cliente_id: string | null = null): Datos {
  const limpio = texto.trim()
  if (!limpio) return datos
  return { ...datos, notas: [...datos.notas, nota(ctx, cliente_id, servicio_cliente_id, limpio, false)] }
}

// ---------------------------------------------------------------- Servicios

/** Instancia un servicio del catálogo para el cliente, con los documentos y las etapas de su plantilla. */
export function agregarServicio(datos: Datos, ctx: Contexto, cliente_id: string, servicio_id: string): Datos {
  const cat = datos.catalogo.find((c) => c.id === servicio_id)
  const cliente = datos.clientes.find((c) => c.id === cliente_id)
  if (!cat || !cliente) throw new Error('Servicio o cliente inexistente')
  const id = ctx.nuevoId('sc')
  const documentos: Documento[] = cat.documentos.map((p) => ({
    id: ctx.nuevoId('doc'), servicio_cliente_id: id, nombre: p.nombre, carga: 'pendiente', emisor: p.emisor,
    fecha_emision: null, vigente_hasta: null, anticipacion_dias: ANTICIPACION_DIAS, fecha_objetivo: sumarDias(ctx.hoy, 30),
    archivo: null, revisado_por: null, fecha_revision: null, observacion: null,
  }))
  const etapas: Etapa[] = cat.etapas.map((nombre, k) => ({
    id: ctx.nuevoId('et'), servicio_cliente_id: id, nombre, orden: k + 1, estado: k === 0 ? 'en_curso' : 'pendiente',
    fecha_prevista: sumarDias(ctx.hoy, 30 * k), fecha_real: null,
  }))
  return {
    ...datos,
    servicios: [...datos.servicios, {
      id, cliente_id, servicio_id, estado: 'en_curso', inicio: ctx.hoy, periodicidad_meses: cat.periodicidad_meses,
      proxima_fecha: cat.periodicidad_meses ? sumarMeses(ctx.hoy, cat.periodicidad_meses) : null, responsable_id: cliente.responsable_id,
    }],
    documentos: [...datos.documentos, ...documentos],
    etapas: [...datos.etapas, ...etapas],
    notas: [...datos.notas, nota(ctx, cliente_id, id, `Se agregó el servicio ${cat.nombre}.`, true)],
  }
}

/** Marca hecha la etapa actual y pone en curso la siguiente; deja la entrada en la bitácora. */
export function avanzarEtapa(datos: Datos, ctx: Contexto, servicioId: string): Datos {
  const etapas = etapasDeServicio(datos, servicioId)
  const actual = etapaActual(etapas)
  if (!actual) return datos
  const siguiente = etapas.find((e) => e.orden > actual.orden && e.estado !== 'hecha')
  const cambios = new Map<string, Partial<Etapa>>([[actual.id, { estado: 'hecha', fecha_real: ctx.hoy }]])
  if (siguiente) cambios.set(siguiente.id, { estado: 'en_curso' })
  const texto = siguiente ? `Etapa "${actual.nombre}" hecha. Sigue "${siguiente.nombre}".` : `Etapa "${actual.nombre}" hecha. Trámite completo.`
  return {
    ...datos,
    etapas: datos.etapas.map((e) => (cambios.has(e.id) ? { ...e, ...cambios.get(e.id) } : e)),
    servicios: siguiente ? datos.servicios : datos.servicios.map((s) => (s.id === servicioId ? { ...s, estado: 'vigente' } : s)),
    notas: [...datos.notas, nota(ctx, clienteDeServicio(datos, servicioId), servicioId, texto, true)],
  }
}

/** Vuelve atrás la última etapa hecha (la actual queda pendiente). */
export function retrocederEtapa(datos: Datos, ctx: Contexto, servicioId: string): Datos {
  const etapas = etapasDeServicio(datos, servicioId)
  const ultimaHecha = [...etapas].reverse().find((e) => e.estado === 'hecha')
  if (!ultimaHecha) return datos
  const actual = etapaActual(etapas)
  const cambios = new Map<string, Partial<Etapa>>([[ultimaHecha.id, { estado: 'en_curso', fecha_real: null }]])
  if (actual) cambios.set(actual.id, { estado: 'pendiente' })
  return {
    ...datos,
    etapas: datos.etapas.map((e) => (cambios.has(e.id) ? { ...e, ...cambios.get(e.id) } : e)),
    servicios: datos.servicios.map((s) => (s.id === servicioId && s.estado === 'vigente' ? { ...s, estado: 'en_curso' } : s)),
    notas: [...datos.notas, nota(ctx, clienteDeServicio(datos, servicioId), servicioId, `Etapa "${ultimaHecha.nombre}" vuelve a estar en curso.`, true)],
  }
}

// ---------------------------------------------------------------- Documentos

export function cambiarCarga(datos: Datos, ctx: Contexto, id: string, carga: CargaDocumento, observacion: string | null = null): Datos {
  return cambiarDocumento(datos, id, (d) => ({
    ...d,
    carga,
    observacion: carga === 'observado' ? observacion?.trim() || 'Sin detalle.' : null,
    revisado_por: carga === 'revisado' || carga === 'observado' ? ctx.autor : carga === 'pendiente' ? null : d.revisado_por,
    fecha_revision: carga === 'revisado' || carga === 'observado' ? ctx.hoy : carga === 'pendiente' ? null : d.fecha_revision,
  }))
}

export function cambiarVigencia(datos: Datos, id: string, vigente_hasta: Fecha | null): Datos {
  return cambiarDocumento(datos, id, (d) => ({ ...d, vigente_hasta }))
}

/** Adjunta un archivo simulado: se guarda solo el nombre y el documento pasa a revisión. */
export function adjuntarArchivo(datos: Datos, ctx: Contexto, id: string, nombreArchivo: string): Datos {
  return cambiarDocumento(datos, id, (d) => ({
    ...d, archivo: nombreArchivo, carga: d.carga === 'pendiente' ? 'en_revision' : d.carga, fecha_emision: d.fecha_emision ?? ctx.hoy,
  }))
}

// ---------------------------------------------------------------- Recordatorios

function recordatorio(datos: Datos, id: string) {
  const r = derivarRecordatorios(datos).find((x) => x.id === id)
  if (!r) throw new Error(`No existe el recordatorio ${id}`)
  return r
}

function ajustar(datos: Datos, id: string, estado: EstadoRecordatorio, fecha?: Fecha): Datos {
  const previo = datos.ajustes_recordatorios[id] ?? {}
  return { ...datos, ajustes_recordatorios: { ...datos.ajustes_recordatorios, [id]: { ...previo, estado, ...(fecha ? { fecha } : {}) } } }
}

export function marcarHecho(datos: Datos, id: string): Datos {
  recordatorio(datos, id)
  return ajustar(datos, id, 'hecho')
}

/** Regla 7: mueve la fecha 7 días y lo deja en la bitácora. */
export function posponer(datos: Datos, ctx: Contexto, id: string): Datos {
  const r = recordatorio(datos, id)
  const nueva = fechaPospuesta(r)
  const conAjuste = ajustar(datos, id, 'pospuesto', nueva)
  return { ...conAjuste, notas: [...conAjuste.notas, nota(ctx, r.cliente_id, r.servicio_cliente_id, `Recordatorio pospuesto: ${r.titulo}, del ${fechaCorta(r.fecha)} al ${fechaCorta(nueva)}.`, true)] }
}

/** "Simular envío": no se envía nada; queda como enviado y en la bitácora. */
export function simularEnvio(datos: Datos, ctx: Contexto, id: string, canal: string): Datos {
  const r = recordatorio(datos, id)
  const conAjuste = ajustar(datos, id, 'enviado')
  return { ...conAjuste, notas: [...conAjuste.notas, nota(ctx, r.cliente_id, r.servicio_cliente_id, `Aviso simulado por ${canal}: ${r.titulo}.`, true)] }
}
