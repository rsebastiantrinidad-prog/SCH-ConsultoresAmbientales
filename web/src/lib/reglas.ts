/**
 * Reglas de estados y recordatorios (ver docs/spec-demo.md, "Reglas de recordatorios y estados").
 * Funciones puras: todo se calcula contra un `hoy` recibido por parámetro. Las pantallas no recalculan nada por su cuenta.
 */
import { diasEntre, fechaCorta, sumarDias } from './formato'
import type {
  Cliente, Datos, Documento, Etapa, EstadoDocumento, Fecha, Recordatorio, Semaforo, ServicioCliente, TipoRecordatorio,
} from './tipos'
import { nombreUsuario, type IdUsuario } from './usuario'

/** Anticipación por defecto para pasar a "Por vencer" (valor de ejemplo, no normativa). */
export const ANTICIPACION_DIAS = 60
/** Un pendiente que se necesita dentro de estos días cuenta como documentación faltante. */
export const DIAS_FALTANTE = 14
export const DIAS_POSPONER = 7
/** Anticipación de los avisos de visita y de pedido de documentación. */
export const ANTICIPACION_VISITA = 15
export const ANTICIPACION_PEDIDO = DIAS_FALTANTE
/** Un observado se vuelve a seguir a los N días de la revisión. */
export const DIAS_SEGUIMIENTO_OBSERVADO = 7

// ---------------------------------------------------------------- Regla 1 y estados

/** Estado que se muestra de un documento, según lo cargado y su vigencia. */
export function estadoDocumento(doc: Documento, hoy: Fecha): EstadoDocumento {
  if (doc.carga === 'pendiente') return 'pendiente'
  if (doc.carga === 'observado') return 'observado'
  if (doc.carga === 'en_revision') return 'en_revision'
  if (!doc.vigente_hasta) return 'vigente'
  const dias = diasEntre(hoy, doc.vigente_hasta)
  if (dias < 0) return 'vencido'
  if (dias < doc.anticipacion_dias) return 'por_vencer'
  return 'vigente'
}

/** Regla 3: pendiente que se necesita dentro de 14 días (o que ya debía estar). */
export function esFaltante(doc: Documento, hoy: Fecha): boolean {
  return doc.carga === 'pendiente' && !!doc.fecha_objetivo && diasEntre(hoy, doc.fecha_objetivo) <= DIAS_FALTANTE
}

// ---------------------------------------------------------------- Regla 4: semáforo

/** El peor estado de los documentos: rojo (vencido u observado), ámbar (por vencer o faltante) o verde. */
export function semaforoDocumentos(docs: Documento[], hoy: Fecha): Semaforo {
  let ambar = false
  for (const d of docs) {
    const e = estadoDocumento(d, hoy)
    if (e === 'vencido' || e === 'observado') return 'rojo'
    if (e === 'por_vencer' || esFaltante(d, hoy)) ambar = true
  }
  return ambar ? 'ambar' : 'verde'
}

export function documentosDeCliente(datos: Datos, clienteId: string): Documento[] {
  const ids = new Set(datos.servicios.filter((s) => s.cliente_id === clienteId).map((s) => s.id))
  return datos.documentos.filter((d) => ids.has(d.servicio_cliente_id))
}

export function semaforoCliente(datos: Datos, clienteId: string, hoy: Fecha): Semaforo {
  return semaforoDocumentos(documentosDeCliente(datos, clienteId), hoy)
}

// ---------------------------------------------------------------- Regla 5: avance

export function etapasDeServicio(datos: Datos, servicioId: string): Etapa[] {
  return datos.etapas.filter((e) => e.servicio_cliente_id === servicioId).sort((a, b) => a.orden - b.orden)
}

/** Porcentaje de etapas hechas sobre el total (0 a 100, redondeado). */
export function avance(etapas: Etapa[]): number {
  if (!etapas.length) return 0
  return Math.round((etapas.filter((e) => e.estado === 'hecha').length / etapas.length) * 100)
}

/** Primera etapa no hecha (la que está en curso o la próxima); null si están todas hechas. */
export function etapaActual(etapas: Etapa[]): Etapa | null {
  return [...etapas].sort((a, b) => a.orden - b.orden).find((e) => e.estado !== 'hecha') ?? null
}

// ---------------------------------------------------------------- Reglas 1, 2 y 3: recordatorios derivados

function servicioPorId(datos: Datos) {
  const m = new Map(datos.servicios.map((s) => [s.id, s]))
  return (id: string) => m.get(id)
}

function nombreServicio(datos: Datos, s: ServicioCliente): string {
  return datos.catalogo.find((c) => c.id === s.servicio_id)?.nombre ?? s.servicio_id
}

/**
 * Recordatorios que salen de los datos, con los ajustes hechos a mano (hecho, pospuesto, enviado):
 * - Regla 1: cada documento con vigencia → vencimiento (avisa `anticipacion_dias` antes).
 * - Regla 2: cada servicio recurrente → visita en su próxima fecha.
 * - Regla 3: cada pendiente con fecha objetivo → pedido de documentación.
 * - Cada observado → seguimiento a los 7 días de la revisión.
 */
export function derivarRecordatorios(datos: Datos): Recordatorio[] {
  const servicio = servicioPorId(datos)
  const lista: Recordatorio[] = []

  for (const d of datos.documentos) {
    const s = servicio(d.servicio_cliente_id)
    if (!s) continue
    const base = { cliente_id: s.cliente_id, servicio_cliente_id: s.id, documento_id: d.id, asignado_a: s.responsable_id }

    if ((d.carga === 'revisado' || d.carga === 'en_revision') && d.vigente_hasta) {
      lista.push({ ...base, id: `venc-${d.id}`, tipo: 'vencimiento', fecha: d.vigente_hasta, anticipacion_dias: d.anticipacion_dias, canal: 'mail', estado: 'programado', titulo: `Vence ${d.nombre}` })
    } else if (d.carga === 'pendiente' && d.fecha_objetivo) {
      lista.push({ ...base, id: `ped-${d.id}`, tipo: 'pedido_documentacion', fecha: d.fecha_objetivo, anticipacion_dias: ANTICIPACION_PEDIDO, canal: 'whatsapp', estado: 'programado', titulo: `Pedir ${d.nombre}` })
    } else if (d.carga === 'observado' && d.fecha_revision) {
      lista.push({ ...base, id: `seg-${d.id}`, tipo: 'seguimiento', fecha: sumarDias(d.fecha_revision, DIAS_SEGUIMIENTO_OBSERVADO), anticipacion_dias: 0, canal: 'interno', estado: 'programado', titulo: `Resolver observación: ${d.nombre}` })
    }
  }

  for (const s of datos.servicios) {
    if (!s.periodicidad_meses || !s.proxima_fecha) continue
    if (s.estado !== 'vigente' && s.estado !== 'en_curso') continue
    lista.push({
      id: `vis-${s.id}`, tipo: 'visita', fecha: s.proxima_fecha, anticipacion_dias: ANTICIPACION_VISITA, canal: 'interno',
      estado: 'programado', asignado_a: s.responsable_id, cliente_id: s.cliente_id, servicio_cliente_id: s.id, documento_id: null,
      titulo: `Visita: ${nombreServicio(datos, s)}`,
    })
  }

  return lista
    .map((r) => ({ ...r, ...datos.ajustes_recordatorios[r.id] }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id))
}

export type GrupoRecordatorio = 'vencidos' | 'esta_semana' | 'proximos_30' | 'mas_adelante'

/** Grupo de la pantalla Recordatorios según cuántos días faltan para la fecha. */
export function grupoRecordatorio(r: Recordatorio, hoy: Fecha): GrupoRecordatorio {
  const dias = diasEntre(hoy, r.fecha)
  if (dias < 0) return 'vencidos'
  if (dias <= 7) return 'esta_semana'
  if (dias <= 30) return 'proximos_30'
  return 'mas_adelante'
}

/** Regla 7: posponer mueve la fecha 7 días. */
export function fechaPospuesta(r: Recordatorio): Fecha {
  return sumarDias(r.fecha, DIAS_POSPONER)
}

// ---------------------------------------------------------------- Tablero y lista de clientes

/** Filtro por responsable: 'todos' o el id de un socio. */
export type FiltroResponsable = IdUsuario | 'todos'

const deResponsable = (f: FiltroResponsable) => (id: IdUsuario) => f === 'todos' || id === f

/** Días hacia adelante que cuenta "Vencimientos en 30 días". */
export const DIAS_VENCIMIENTOS = 30

export interface Indicadores {
  clientes_activos: number
  /** Documentos que vencen de hoy a 30 días. */
  vencimientos_30: number
  /** Documentos que ya vencieron (se muestran como dato extra). */
  vencidos: number
  documentacion_faltante: number
  clientes_con_faltante: number
  tramites_en_curso: number
}

/** Los cuatro indicadores del tablero, calculados desde los datos (filtrados por responsable). */
export function indicadores(datos: Datos, hoy: Fecha, filtro: FiltroResponsable = 'todos'): Indicadores {
  const es = deResponsable(filtro)
  const clientes = datos.clientes.filter((c) => c.estado === 'activo' && es(c.responsable_id))
  const ids = new Set(clientes.map((c) => c.id))
  const servicios = datos.servicios.filter((s) => ids.has(s.cliente_id))
  const clienteDe = new Map(servicios.map((s) => [s.id, s.cliente_id]))
  const docs = datos.documentos.filter((d) => clienteDe.has(d.servicio_cliente_id))

  let vencimientos_30 = 0
  let vencidos = 0
  const faltantes = docs.filter((d) => esFaltante(d, hoy))
  for (const d of docs) {
    const e = estadoDocumento(d, hoy)
    if (e === 'vencido') vencidos++
    else if (d.vigente_hasta && (e === 'por_vencer' || e === 'vigente') && diasEntre(hoy, d.vigente_hasta) <= DIAS_VENCIMIENTOS) vencimientos_30++
  }
  return {
    clientes_activos: clientes.length,
    vencimientos_30,
    vencidos,
    documentacion_faltante: faltantes.length,
    clientes_con_faltante: new Set(faltantes.map((d) => clienteDe.get(d.servicio_cliente_id))).size,
    tramites_en_curso: servicios.filter((s) => s.estado === 'en_curso').length,
  }
}

/** Lista "Esta semana": lo atrasado y lo de los próximos 7 días que no está hecho, lo más urgente primero. */
export function recordatoriosSemana(datos: Datos, hoy: Fecha, filtro: FiltroResponsable = 'todos'): Recordatorio[] {
  const es = deResponsable(filtro)
  return derivarRecordatorios(datos).filter((r) => {
    if (r.estado === 'hecho' || !es(r.asignado_a)) return false
    const g = grupoRecordatorio(r, hoy)
    return g === 'vencidos' || g === 'esta_semana'
  })
}

const ORDEN_SEMAFORO: Record<Semaforo, number> = { rojo: 0, ambar: 1, verde: 2 }

export interface FilaCliente {
  cliente: Cliente
  semaforo: Semaforo
  servicios_activos: number
  /** Próximo vencimiento de un documento (o el último ya vencido, si hay). */
  proximo_vencimiento: { fecha: Fecha; documento: string } | null
  faltantes: number
  tramites_en_curso: number
}

/** Una fila por cliente con lo que muestra la tabla de Clientes. */
export function filasClientes(datos: Datos, hoy: Fecha): FilaCliente[] {
  return datos.clientes.map((cliente) => {
    const servicios = datos.servicios.filter((s) => s.cliente_id === cliente.id)
    const docs = documentosDeCliente(datos, cliente.id)
    const conFecha = docs.filter((d) => (d.carga === 'revisado' || d.carga === 'en_revision') && d.vigente_hasta)
    conFecha.sort((a, b) => a.vigente_hasta!.localeCompare(b.vigente_hasta!))
    const proximo = conFecha[0]
    return {
      cliente,
      semaforo: semaforoDocumentos(docs, hoy),
      servicios_activos: servicios.filter((s) => s.estado === 'en_curso' || s.estado === 'vigente').length,
      proximo_vencimiento: proximo ? { fecha: proximo.vigente_hasta!, documento: proximo.nombre } : null,
      faltantes: docs.filter((d) => esFaltante(d, hoy)).length,
      tramites_en_curso: servicios.filter((s) => s.estado === 'en_curso').length,
    }
  })
}

/**
 * Por qué el cliente no está en verde, en una frase corta: lo más grave primero
 * (vencido, observado, faltante, por vencer). null si está al día.
 */
export function motivoSemaforo(datos: Datos, clienteId: string, hoy: Fecha): string | null {
  const docs = documentosDeCliente(datos, clienteId).map((d) => ({ d, e: estadoDocumento(d, hoy) }))
  const porFecha = (a: { d: Documento }, b: { d: Documento }) => (a.d.vigente_hasta ?? '').localeCompare(b.d.vigente_hasta ?? '')
  const vencidos = docs.filter((x) => x.e === 'vencido').sort(porFecha)
  const extra = (n: number) => (n > 1 ? ` (y ${n - 1} más)` : '')
  if (vencidos.length) {
    const { d } = vencidos[0]
    return `${d.nombre} venció hace ${-diasEntre(hoy, d.vigente_hasta!)} días${extra(vencidos.length)}`
  }
  const observados = docs.filter((x) => x.e === 'observado')
  if (observados.length) return `${observados[0].d.nombre} observado${extra(observados.length)}`
  const faltantes = docs.filter((x) => esFaltante(x.d, hoy)).length
  if (faltantes) return `${faltantes} ${faltantes === 1 ? 'documento falta' : 'documentos faltan'}`
  const porVencer = docs.filter((x) => x.e === 'por_vencer').sort(porFecha)
  if (porVencer.length) {
    const { d } = porVencer[0]
    const n = diasEntre(hoy, d.vigente_hasta!)
    return `${d.nombre} vence ${n === 0 ? 'hoy' : `en ${n} días`}${extra(porVencer.length)}`
  }
  return null
}

/** Orden por defecto de la tabla: peor semáforo primero y, dentro de cada color, el vencimiento más cercano. */
export function compararFilas(a: FilaCliente, b: FilaCliente): number {
  return (
    ORDEN_SEMAFORO[a.semaforo] - ORDEN_SEMAFORO[b.semaforo] ||
    (a.proximo_vencimiento?.fecha ?? '9999').localeCompare(b.proximo_vencimiento?.fecha ?? '9999') ||
    a.cliente.razon_social.localeCompare(b.cliente.razon_social)
  )
}

// ---------------------------------------------------------------- Regla 6: avisos

export const VARIABLES_AVISO = ['cliente', 'documento', 'fecha', 'responsable'] as const
export type VariablesAviso = Record<(typeof VARIABLES_AVISO)[number], string>

export const PLANTILLAS_AVISO: Record<TipoRecordatorio, string> = {
  vencimiento:
    'Hola, {cliente}. Te escribimos de SCH Consultores Ambientales: {documento} vence el {fecha}. Para renovarlo a tiempo, avisanos y lo coordinamos. Saludos, {responsable}.',
  pedido_documentacion:
    'Hola, {cliente}. Para avanzar con tu trámite necesitamos {documento} antes del {fecha}. Podés mandárnoslo por este medio. Gracias, {responsable}.',
  visita:
    'Hola, {cliente}. Te recordamos que el {fecha} tenemos programada la visita de {documento}. Si necesitás cambiar el día, avisanos. Saludos, {responsable}.',
  seguimiento:
    'Hola, {cliente}. Revisamos {documento} y tiene una observación a resolver. ¿Podemos hablarlo antes del {fecha}? Saludos, {responsable}.',
}

/** Valores para la plantilla: razón social, documento (o servicio, en visitas), fecha y responsable. */
export function variablesAviso(datos: Datos, r: Recordatorio): VariablesAviso {
  const cliente = datos.clientes.find((c) => c.id === r.cliente_id)
  const doc = r.documento_id ? datos.documentos.find((d) => d.id === r.documento_id) : null
  const serv = r.servicio_cliente_id ? datos.servicios.find((s) => s.id === r.servicio_cliente_id) : null
  return {
    cliente: cliente?.razon_social ?? '',
    documento: doc?.nombre ?? (serv ? nombreServicio(datos, serv) : ''),
    fecha: fechaCorta(r.fecha),
    responsable: nombreUsuario(r.asignado_a),
  }
}

/** Reemplaza las {variables}; las que no tienen valor quedan como estaban, para que se noten. */
export function rellenarPlantilla(plantilla: string, vars: Partial<VariablesAviso>): string {
  return plantilla.replace(/\{(\w+)\}/g, (todo, k: string) => (vars as Record<string, string>)[k] || todo)
}

/** Variables sin completar en un texto (sirve para chequear la vista previa). */
export function variablesFaltantes(texto: string): string[] {
  return [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
}

export function textoAviso(datos: Datos, r: Recordatorio): string {
  return rellenarPlantilla(PLANTILLAS_AVISO[r.tipo], variablesAviso(datos, r))
}
