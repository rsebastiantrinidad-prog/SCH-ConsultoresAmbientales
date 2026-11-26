/**
 * Modelo de datos del demo (ver docs/spec-demo.md, "Modelo de datos").
 * Campos en snake_case y relaciones por id, para pasar a Supabase sin cambiar la estructura.
 * Fechas como texto ISO 'YYYY-MM-DD'.
 */
import type { IdUsuario } from './usuario'

export type Fecha = string

export type EstadoCliente = 'activo' | 'en_pausa' | 'baja'

export interface Cliente {
  id: string
  razon_social: string
  rubro: string
  localidad: string
  contacto_nombre: string
  contacto_email: string
  contacto_telefono: string
  estado: EstadoCliente
  fecha_alta: Fecha
  responsable_id: IdUsuario
}

export type CategoriaServicio = 'licencia' | 'auditoria_pga' | 'efluentes' | 'residuos' | 'iso' | 'otros'

export interface PlantillaDocumento {
  nombre: string
  emisor: string
  /** Meses de vigencia desde la emisión; null = no vence. */
  vigencia_meses: number | null
}

/** Servicio del catálogo de SCH. */
export interface Servicio {
  id: string
  nombre: string
  categoria: CategoriaServicio
  /** Periodicidad sugerida en meses; null = trámite único. */
  periodicidad_meses: number | null
  documentos: PlantillaDocumento[]
  etapas: string[]
}

export type EstadoServicio = 'propuesta' | 'en_curso' | 'vigente' | 'finalizado'

/** Servicio contratado por un cliente. La etapa actual y el avance se derivan de sus etapas. */
export interface ServicioCliente {
  id: string
  cliente_id: string
  servicio_id: string
  estado: EstadoServicio
  inicio: Fecha
  periodicidad_meses: number | null
  /** Próxima visita o control; null si no es recurrente. */
  proxima_fecha: Fecha | null
  responsable_id: IdUsuario
}

/**
 * Lo que se carga a mano sobre un documento. Vigente, Por vencer y Vencido no se guardan:
 * se calculan con la fecha de vigencia (ver reglas.ts).
 */
export type CargaDocumento = 'pendiente' | 'en_revision' | 'revisado' | 'observado'

/** Estado que se muestra, derivado de la carga y la vigencia. */
export type EstadoDocumento = 'pendiente' | 'en_revision' | 'vigente' | 'por_vencer' | 'vencido' | 'observado'

export interface Documento {
  id: string
  servicio_cliente_id: string
  nombre: string
  carga: CargaDocumento
  emisor: string
  fecha_emision: Fecha | null
  vigente_hasta: Fecha | null
  /** Días antes del vencimiento en que pasa a "Por vencer" y se avisa. */
  anticipacion_dias: number
  /** Para documentos pendientes: para cuándo se necesita. */
  fecha_objetivo: Fecha | null
  /** Nombre del archivo adjunto (simulado: no se guarda el archivo). */
  archivo: string | null
  revisado_por: IdUsuario | null
  fecha_revision: Fecha | null
  observacion: string | null
}

export type EstadoEtapa = 'pendiente' | 'en_curso' | 'hecha'

export interface Etapa {
  id: string
  servicio_cliente_id: string
  nombre: string
  orden: number
  estado: EstadoEtapa
  fecha_prevista: Fecha
  fecha_real: Fecha | null
}

/** Nota del cliente o entrada de bitácora; las automáticas las deja el sistema (avances, posposiciones, avisos). */
export interface Nota {
  id: string
  cliente_id: string
  servicio_cliente_id: string | null
  autor_id: IdUsuario
  fecha: Fecha
  texto: string
  automatica: boolean
}

export type TipoRecordatorio = 'vencimiento' | 'pedido_documentacion' | 'visita' | 'seguimiento'
export type CanalRecordatorio = 'mail' | 'whatsapp' | 'interno'
export type EstadoRecordatorio = 'programado' | 'enviado' | 'hecho' | 'pospuesto'

/** Recordatorio derivado de documentos y servicios (ver reglas.ts); no se carga a mano. */
export interface Recordatorio {
  id: string
  tipo: TipoRecordatorio
  /** Fecha del hecho: vencimiento, visita o para cuándo se necesita el documento. */
  fecha: Fecha
  anticipacion_dias: number
  canal: CanalRecordatorio
  estado: EstadoRecordatorio
  asignado_a: IdUsuario
  cliente_id: string
  servicio_cliente_id: string | null
  documento_id: string | null
  titulo: string
}

/** Lo que cambió a mano sobre un recordatorio derivado (marcar hecho, posponer, enviar). */
export interface AjusteRecordatorio {
  estado?: EstadoRecordatorio
  fecha?: Fecha
}

export interface Datos {
  clientes: Cliente[]
  catalogo: Servicio[]
  servicios: ServicioCliente[]
  documentos: Documento[]
  etapas: Etapa[]
  notas: Nota[]
  ajustes_recordatorios: Record<string, AjusteRecordatorio>
}

export type Semaforo = 'verde' | 'ambar' | 'rojo'
