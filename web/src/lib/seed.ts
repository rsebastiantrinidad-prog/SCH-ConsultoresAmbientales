/**
 * Datos ficticios del demo (ver docs/spec-demo.md, "Datos ficticios de demo").
 * Todo es inventado y lleva "(demo)". Las fechas se calculan como "hoy + N días", así nada queda vencido por error.
 *
 * Cartera de 42 clientes, como la de SCH (más de 40):
 * - 12 clientes detallados a mano (5 verdes, 4 ámbar, 3 rojos), entre ellos los tres preparados para el guion:
 *   Metalúrgica Ejemplo (rojo), Loteo Los Algarrobos (trámite al 40%) y Alimentos del Centro (casi todo verde).
 * - 30 clientes más generados a partir de una lista corta (20 verdes, 7 ámbar, 3 rojos), para que el tablero
 *   y las estadísticas muestren el volumen real sin cargar a mano cada documento.
 * Total: 25 verdes, 11 ámbar y 6 rojos; cada socio tiene 14 clientes y al menos un rojo.
 */
import { sumarDias, sumarMeses } from './formato'
import { ANTICIPACION_DIAS } from './reglas'
import type { Cliente, Datos, Documento, Etapa, EstadoServicio, Fecha, Nota, Servicio, ServicioCliente } from './tipos'
import type { IdUsuario } from './usuario'

export const CATALOGO: Servicio[] = [
  {
    id: 'licencia', nombre: 'Licencia ambiental', categoria: 'licencia', periodicidad_meses: null,
    documentos: [
      { nombre: 'Aviso de proyecto', emisor: 'SCH', vigencia_meses: null },
      { nombre: 'Estudio de Impacto Ambiental', emisor: 'SCH', vigencia_meses: null },
      { nombre: 'Plano de mensura', emisor: 'Agrimensor del cliente', vigencia_meses: null },
      { nombre: 'Factibilidad de agua', emisor: 'Cooperativa de servicios', vigencia_meses: null },
      { nombre: 'Factibilidad de energía', emisor: 'Distribuidora eléctrica', vigencia_meses: null },
    ],
    etapas: ['Relevamiento', 'Aviso de proyecto', 'Estudio de Impacto Ambiental', 'Presentación ante el organismo', 'Licencia otorgada'],
  },
  {
    id: 'auditoria', nombre: 'Auditoría ambiental y PGA', categoria: 'auditoria_pga', periodicidad_meses: 12,
    documentos: [
      { nombre: 'Auditoría ambiental de cumplimiento', emisor: 'SCH', vigencia_meses: 12 },
      { nombre: 'Plan de Gestión Ambiental', emisor: 'SCH', vigencia_meses: 12 },
    ],
    etapas: ['Visita de relevamiento', 'Informe de auditoría', 'Presentación'],
  },
  {
    id: 'efluentes', nombre: 'Efluentes líquidos', categoria: 'efluentes', periodicidad_meses: 6,
    documentos: [
      { nombre: 'Análisis de laboratorio de efluentes', emisor: 'Laboratorio externo', vigencia_meses: 6 },
      { nombre: 'Permiso de vuelco', emisor: 'Organismo provincial', vigencia_meses: 24 },
      { nombre: 'Declaración jurada de efluentes', emisor: 'SCH', vigencia_meses: 12 },
    ],
    etapas: ['Muestreo', 'Análisis de laboratorio', 'Informe y presentación'],
  },
  {
    id: 'residuos', nombre: 'Residuos peligrosos', categoria: 'residuos', periodicidad_meses: 12,
    documentos: [
      { nombre: 'Inscripción anual como generador', emisor: 'Organismo provincial', vigencia_meses: 12 },
      { nombre: 'Manifiestos de transporte', emisor: 'Transportista habilitado', vigencia_meses: 12 },
      { nombre: 'Certificado de disposición final', emisor: 'Operador habilitado', vigencia_meses: 12 },
    ],
    etapas: ['Relevamiento', 'Inscripción', 'Seguimiento de manifiestos'],
  },
  {
    id: 'iso14001', nombre: 'ISO 14001', categoria: 'iso', periodicidad_meses: 6,
    documentos: [
      { nombre: 'Certificado ISO 14001', emisor: 'Certificadora', vigencia_meses: 36 },
      { nombre: 'Informe de auditoría interna', emisor: 'SCH', vigencia_meses: 12 },
      { nombre: 'Revisión por la dirección', emisor: 'Cliente', vigencia_meses: 12 },
    ],
    etapas: ['Diagnóstico', 'Implementación', 'Auditoría interna', 'Certificación'],
  },
  {
    id: 'monitoreo', nombre: 'Monitoreo de emisiones y ruido', categoria: 'otros', periodicidad_meses: 12,
    documentos: [
      { nombre: 'Informe de monitoreo de emisiones', emisor: 'Laboratorio externo', vigencia_meses: 12 },
      { nombre: 'Mediciones de ruido ambiental', emisor: 'SCH', vigencia_meses: 12 },
    ],
    etapas: ['Medición en planta', 'Informe'],
  },
]

// ---------------------------------------------------------------- Cómo se escribe cada documento del seed

/** Especificación corta de un documento, en el orden de la plantilla del catálogo. */
type Esp =
  | { c: 'revisado'; vence: number | null } // revisado, vence en N días (null = no vence)
  | { c: 'en_revision'; vence: number | null }
  | { c: 'pendiente'; para: number | null } // se necesita en N días
  | { c: 'observado'; vence: number | null; motivo: string }

const v = (vence: number | null): Esp => ({ c: 'revisado', vence })
const r = (vence: number | null): Esp => ({ c: 'en_revision', vence })
const p = (para: number | null): Esp => ({ c: 'pendiente', para })
const o = (vence: number | null, motivo: string): Esp => ({ c: 'observado', vence, motivo })

interface EspServicio {
  servicio: string
  estado: EstadoServicio
  docs: Esp[]
  /** Etapas hechas; por defecto todas si está vigente y ninguna si es propuesta. */
  hechas?: number
  /** Próxima visita en N días (solo servicios recurrentes). */
  visita?: number
}

interface EspCliente {
  razon_social: string
  rubro: string
  localidad: string
  contacto: string
  responsable: IdUsuario
  servicios: EspServicio[]
}

const CLIENTES: EspCliente[] = [
  // ---- Hugo
  {
    razon_social: 'Metalúrgica Ejemplo S.A. (demo)', rubro: 'Industria metalúrgica', localidad: 'Córdoba', contacto: 'Marcela Ríos', responsable: 'hugo',
    servicios: [
      // Rojo: el análisis de laboratorio venció hace 10 días
      { servicio: 'efluentes', estado: 'en_curso', hechas: 1, visita: 5, docs: [v(-10), v(420), v(210)] },
      // La auditoría vence en 30 días
      { servicio: 'auditoria', estado: 'vigente', visita: 25, docs: [v(30), v(200)] },
    ],
  },
  {
    razon_social: 'Curtiembre San Roque (demo)', rubro: 'Curtiembre', localidad: 'Córdoba', contacto: 'Julio Ferreyra', responsable: 'hugo',
    servicios: [
      { servicio: 'efluentes', estado: 'vigente', visita: 20, docs: [v(25), v(500), v(300)] },
      { servicio: 'residuos', estado: 'vigente', visita: 90, docs: [v(180), v(160), v(250)] },
    ],
  },
  {
    razon_social: 'Terminal de Ómnibus Sierras (demo)', rubro: 'Terminal de ómnibus', localidad: 'Villa Carlos Paz', contacto: 'Silvina Paz', responsable: 'hugo',
    servicios: [
      { servicio: 'residuos', estado: 'vigente', visita: 60, docs: [v(150), v(150), v(200)] },
      { servicio: 'monitoreo', estado: 'vigente', visita: 120, docs: [v(190), v(190)] },
    ],
  },
  {
    razon_social: 'Laboratorio Análisis del Centro (demo)', rubro: 'Laboratorio', localidad: 'Córdoba', contacto: 'Andrés Molina', responsable: 'hugo',
    servicios: [
      { servicio: 'residuos', estado: 'vigente', visita: 75, docs: [v(240), v(240), v(260)] },
      { servicio: 'iso14001', estado: 'vigente', visita: 40, docs: [v(700), v(120), v(200)] },
      { servicio: 'efluentes', estado: 'vigente', visita: 110, docs: [v(140), v(600), v(280)] },
    ],
  },
  // ---- Karina
  {
    razon_social: 'Loteo Los Algarrobos (demo)', rubro: 'Loteo', localidad: 'Mendiolaza', contacto: 'Diego Funes', responsable: 'karina',
    servicios: [
      // Trámite en Estudio de Impacto Ambiental: 2 de 5 etapas (40%) y 3 documentos pendientes
      { servicio: 'licencia', estado: 'en_curso', hechas: 2, docs: [v(null), p(10), p(6), p(12), v(null)] },
    ],
  },
  {
    razon_social: 'Estación de Servicio Ruta 9 (demo)', rubro: 'Estación de servicio', localidad: 'Villa María', contacto: 'Carla Benítez', responsable: 'karina',
    servicios: [
      // Rojo: el PGA quedó observado
      { servicio: 'auditoria', estado: 'en_curso', hechas: 2, visita: 12, docs: [v(120), o(300, 'Falta la firma del responsable técnico.')] },
      { servicio: 'residuos', estado: 'vigente', visita: 50, docs: [v(220), v(90), v(230)] },
    ],
  },
  {
    razon_social: 'Crematorio Parque del Sol (demo)', rubro: 'Crematorio', localidad: 'Córdoba', contacto: 'Lucía Gómez', responsable: 'karina',
    servicios: [
      { servicio: 'monitoreo', estado: 'vigente', visita: 100, docs: [v(210), v(210)] },
      { servicio: 'auditoria', estado: 'vigente', visita: 150, docs: [v(300), v(300)] },
    ],
  },
  {
    razon_social: 'Taller de Pintura Hermanos Ruiz (demo)', rubro: 'Taller de pintura', localidad: 'Córdoba', contacto: 'Pablo Ruiz', responsable: 'karina',
    servicios: [
      { servicio: 'residuos', estado: 'vigente', visita: 35, docs: [v(40), v(200), v(220)] },
      { servicio: 'monitoreo', estado: 'vigente', visita: 130, docs: [v(300), r(365)] },
    ],
  },
  // ---- Lilian
  {
    razon_social: 'Alimentos del Centro S.A. (demo)', rubro: 'Alimentos', localidad: 'Río Cuarto', contacto: 'Verónica Luna', responsable: 'lilian',
    servicios: [
      { servicio: 'iso14001', estado: 'vigente', visita: 15, docs: [v(500), v(150), v(250)] },
      // La inscripción anual se acerca
      { servicio: 'residuos', estado: 'vigente', visita: 45, docs: [v(45), v(200), v(300)] },
    ],
  },
  {
    razon_social: 'Frigorífico La Pampita (demo)', rubro: 'Frigorífico', localidad: 'Jesús María', contacto: 'Ramiro Ledesma', responsable: 'lilian',
    servicios: [
      { servicio: 'efluentes', estado: 'vigente', visita: 30, docs: [v(100), v(300), v(150)] },
      // Rojo: el certificado de disposición final venció hace 20 días
      { servicio: 'residuos', estado: 'vigente', visita: 3, docs: [v(180), v(170), v(-20)] },
    ],
  },
  {
    razon_social: 'Parque Industrial Norte (demo)', rubro: 'Parque industrial', localidad: 'Córdoba', contacto: 'Gustavo Aguirre', responsable: 'lilian',
    servicios: [
      { servicio: 'licencia', estado: 'vigente', docs: [v(null), v(null), v(null), v(null), v(null)] },
      { servicio: 'auditoria', estado: 'vigente', visita: 80, docs: [v(260), v(260)] },
    ],
  },
  {
    razon_social: 'Municipalidad de Villa Ejemplo (demo)', rubro: 'Municipio', localidad: 'Colonia Caroya', contacto: 'Natalia Correa', responsable: 'lilian',
    servicios: [
      { servicio: 'auditoria', estado: 'vigente', visita: 70, docs: [v(200), v(200)] },
      // Propuesta: todavía sin documentación cargada ni fechas
      { servicio: 'licencia', estado: 'propuesta', docs: [p(null), p(null), p(null), p(null), p(null)] },
    ],
  },
]

/**
 * Clientes generados: nombre, rubro, localidad, contacto, socio responsable, servicios del catálogo y cómo tiene que
 * quedar su semáforo. Los socios se reparten para que cada uno tenga 14 clientes y 2 rojos en total.
 * Ningún nombre va antes de "Alimentos del Centro" en orden alfabético, para que siga apareciendo primero en el Plan anual.
 */
type Extra = [razon: string, rubro: string, localidad: string, contacto: string, responsable: IdUsuario, servicios: string[], semaforo: 'verde' | 'ambar' | 'rojo']

const EXTRAS: Extra[] = [
  ['Bodega Valle Serrano (demo)', 'Bodega', 'Colonia Caroya', 'Mariana Peralta', 'hugo', ['efluentes', 'residuos'], 'verde'],
  ['Cantera Los Molles (demo)', 'Cantera', 'Malagueño', 'Oscar Villalba', 'hugo', ['auditoria', 'monitoreo'], 'ambar'],
  ['Clínica San Martín (demo)', 'Salud', 'Córdoba', 'Paula Quiroga', 'hugo', ['residuos'], 'verde'],
  ['Cooperativa Agrícola Norte (demo)', 'Agro', 'Jesús María', 'Héctor Ruarte', 'hugo', ['auditoria'], 'verde'],
  ['Depósito Fiscal Ruta 19 (demo)', 'Logística', 'Córdoba', 'Sofía Arce', 'hugo', ['auditoria', 'residuos'], 'rojo'],
  ['Destilería La Calera (demo)', 'Bebidas', 'La Calera', 'Tomás Bustos', 'hugo', ['efluentes'], 'verde'],
  ['Embotelladora Sierras (demo)', 'Bebidas', 'Río Ceballos', 'Valeria Oviedo', 'hugo', ['efluentes', 'iso14001'], 'verde'],
  ['Feedlot El Talar (demo)', 'Agro', 'Oncativo', 'Martín Cabrera', 'hugo', ['efluentes', 'auditoria'], 'ambar'],
  ['Fundición Centro (demo)', 'Industria metalúrgica', 'Córdoba', 'Rubén Olmedo', 'hugo', ['monitoreo', 'residuos'], 'verde'],
  ['Granja Avícola Las Lomas (demo)', 'Avícola', 'Río Primero', 'Laura Toledo', 'karina', ['efluentes'], 'verde'],
  ['Hospital Regional Sur (demo)', 'Salud', 'Río Cuarto', 'Gabriel Moyano', 'hugo', ['residuos', 'efluentes'], 'ambar'],
  ['Hotel Termas del Valle (demo)', 'Hotelería', 'Villa General Belgrano', 'Cecilia Brizuela', 'karina', ['efluentes'], 'verde'],
  ['Imprenta Gráfica Central (demo)', 'Gráfica', 'Córdoba', 'Nicolás Paz', 'karina', ['residuos'], 'verde'],
  ['Ladrillera El Algarrobal (demo)', 'Construcción', 'Salsipuedes', 'Ana Sosa', 'karina', ['monitoreo'], 'rojo'],
  ['Lavadero Industrial Norte (demo)', 'Servicios', 'Córdoba', 'Jorge Herrera', 'karina', ['efluentes'], 'verde'],
  ['Lácteos La Serranita (demo)', 'Alimentos', 'Villa María', 'Florencia Díaz', 'karina', ['efluentes', 'iso14001'], 'ambar'],
  ['Molino Harinero San José (demo)', 'Alimentos', 'Arroyito', 'Pedro Gaitán', 'karina', ['auditoria'], 'verde'],
  ['Planta de Asfalto Vial Sur (demo)', 'Construcción', 'Córdoba', 'Daniela Roldán', 'karina', ['monitoreo', 'auditoria'], 'verde'],
  ['Plásticos del Interior (demo)', 'Industria plástica', 'Córdoba', 'Esteban Castro', 'karina', ['residuos', 'efluentes'], 'verde'],
  ['Química Mediterránea (demo)', 'Industria química', 'Córdoba', 'Romina Vera', 'karina', ['residuos', 'iso14001'], 'ambar'],
  ['Recicladora Ambiental Centro (demo)', 'Reciclado', 'Córdoba', 'Fernando Luna', 'lilian', ['residuos'], 'verde'],
  ['Sanatorio del Parque (demo)', 'Salud', 'Córdoba', 'Inés Ferreyra', 'lilian', ['residuos'], 'verde'],
  ['Semillera Pampa Alta (demo)', 'Agro', 'Marcos Juárez', 'Diego Ledesma', 'lilian', ['auditoria'], 'verde'],
  ['Supermercado Mayorista Ruta 36 (demo)', 'Comercio', 'Río Tercero', 'Claudia Pereyra', 'lilian', ['residuos'], 'ambar'],
  ['Textil Hilados Córdoba (demo)', 'Industria textil', 'Córdoba', 'Marcelo Godoy', 'lilian', ['efluentes', 'residuos'], 'verde'],
  ['Tintorería Industrial San Vicente (demo)', 'Servicios', 'Córdoba', 'Silvia Romero', 'lilian', ['efluentes'], 'rojo'],
  ['Transporte de Cargas Mediterráneo (demo)', 'Logística', 'Córdoba', 'Walter Acosta', 'lilian', ['residuos'], 'verde'],
  ['Universidad Privada del Centro (demo)', 'Educación', 'Córdoba', 'Patricia Medina', 'lilian', ['residuos', 'licencia'], 'verde'],
  ['Vivero Forestal Calamuchita (demo)', 'Agro', 'Santa Rosa de Calamuchita', 'Lucas Ortiz', 'lilian', ['licencia', 'auditoria'], 'verde'],
  ['Yesera Cruz del Eje (demo)', 'Minería', 'Cruz del Eje', 'Graciela Rivero', 'lilian', ['monitoreo', 'efluentes'], 'ambar'],
]

/**
 * Pasa cada cliente generado al mismo formato que los detallados. Vencimientos repartidos entre 120 y 600 días;
 * un ámbar tiene un documento que vence en 20 a 54 días, y un rojo, uno vencido hace 2 a 18 días
 * (menos que Frigorífico La Pampita, que sigue encabezando la lista de urgentes).
 */
function clienteGenerado([razon, rubro, localidad, contacto, responsable, servicios, semaforo]: Extra, i: number): EspCliente {
  return {
    razon_social: razon,
    rubro,
    localidad,
    contacto,
    responsable,
    servicios: servicios.map((servicio, j) => {
      const cat = CATALOGO.find((c) => c.id === servicio)!
      const docs = cat.documentos.map((d, k) => {
        if (d.vigencia_meses === null) return v(null)
        if (j === 0 && k === 0 && semaforo === 'ambar') return v(20 + ((i * 7) % 35))
        if (j === 0 && k === 0 && semaforo === 'rojo') return v(-(2 + ((i * 5) % 17)))
        return v(120 + ((i * 53 + j * 29 + k * 17) % 480))
      })
      return {
        servicio,
        estado: 'vigente' as const,
        visita: cat.periodicidad_meses ? 10 + ((i * 37 + j * 23) % 170) : undefined,
        docs,
      }
    }),
  }
}

const TODOS: EspCliente[] = [...CLIENTES, ...EXTRAS.map(clienteGenerado)]

/** Nombres de los clientes preparados para el guion, para ubicarlos sin depender del id. */
export const CLIENTES_GUION = {
  metalurgica: 'Metalúrgica Ejemplo S.A. (demo)',
  loteo: 'Loteo Los Algarrobos (demo)',
  alimentos: 'Alimentos del Centro S.A. (demo)',
} as const

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(demo\)/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const dos = (n: number) => String(n).padStart(2, '0')

/** Arma los datos del demo con fechas relativas a `hoy`. Determinístico: mismo `hoy`, mismos datos. */
export function construirSeed(hoy: Fecha): Datos {
  const dia = (n: number) => sumarDias(hoy, n)
  const clientes: Cliente[] = []
  const servicios: ServicioCliente[] = []
  const documentos: Documento[] = []
  const etapas: Etapa[] = []
  let nDoc = 0

  TODOS.forEach((ec, i) => {
    const clienteId = `cli-${dos(i + 1)}`
    clientes.push({
      id: clienteId,
      razon_social: ec.razon_social,
      rubro: ec.rubro,
      localidad: ec.localidad,
      contacto_nombre: `${ec.contacto} (demo)`,
      contacto_email: `${slug(ec.razon_social)}@ejemplo.test`,
      contacto_telefono: `351 000-${String(1001 + i * 17)}`,
      estado: 'activo',
      fecha_alta: dia(-(400 + i * 45)),
      responsable_id: ec.responsable,
    })

    ec.servicios.forEach((es, j) => {
      const cat = CATALOGO.find((c) => c.id === es.servicio)
      if (!cat) throw new Error(`Servicio desconocido en el seed: ${es.servicio}`)
      if (es.docs.length !== cat.documentos.length) throw new Error(`${ec.razon_social}: ${es.servicio} necesita ${cat.documentos.length} documentos`)
      const servicioId = `sc-${dos(i + 1)}-${j + 1}`
      const inicio = es.estado === 'propuesta' ? dia(20) : dia(-(200 + i * 11 + j * 7))
      servicios.push({
        id: servicioId,
        cliente_id: clienteId,
        servicio_id: cat.id,
        estado: es.estado,
        inicio,
        periodicidad_meses: cat.periodicidad_meses,
        proxima_fecha: cat.periodicidad_meses && es.visita !== undefined ? dia(es.visita) : null,
        responsable_id: ec.responsable,
      })

      // Etapas: las hechas con fecha real, la siguiente en curso (si el servicio está en curso), el resto pendientes.
      const total = cat.etapas.length
      const hechas = es.hechas ?? (es.estado === 'vigente' || es.estado === 'finalizado' ? total : 0)
      cat.etapas.forEach((nombre, k) => {
        const prevista = es.estado === 'propuesta' ? sumarDias(inicio, 30 * k) : sumarDias(inicio, Math.round((k * 180) / total))
        const estado = k < hechas ? 'hecha' : k === hechas && es.estado === 'en_curso' ? 'en_curso' : 'pendiente'
        etapas.push({
          id: `et-${servicioId}-${k + 1}`,
          servicio_cliente_id: servicioId,
          nombre,
          orden: k + 1,
          estado,
          fecha_prevista: prevista,
          fecha_real: estado === 'hecha' ? sumarDias(prevista, 3) : null,
        })
      })

      es.docs.forEach((esp, k) => {
        const plantilla = cat.documentos[k]
        nDoc++
        const id = `doc-${String(nDoc).padStart(3, '0')}`
        if (esp.c === 'pendiente') {
          documentos.push({
            id, servicio_cliente_id: servicioId, nombre: plantilla.nombre, carga: 'pendiente', emisor: plantilla.emisor,
            fecha_emision: null, vigente_hasta: null, anticipacion_dias: ANTICIPACION_DIAS,
            fecha_objetivo: esp.para === null ? null : dia(esp.para), archivo: null, revisado_por: null, fecha_revision: null, observacion: null,
          })
          return
        }
        const vigente_hasta = esp.vence === null ? null : dia(esp.vence)
        const emision = vigente_hasta && plantilla.vigencia_meses ? sumarMeses(vigente_hasta, -plantilla.vigencia_meses) : dia(-(120 + k * 15))
        const revisado = esp.c !== 'en_revision'
        documentos.push({
          id, servicio_cliente_id: servicioId, nombre: plantilla.nombre, carga: esp.c, emisor: plantilla.emisor,
          fecha_emision: emision, vigente_hasta, anticipacion_dias: ANTICIPACION_DIAS, fecha_objetivo: null,
          archivo: `${slug(plantilla.nombre)}.pdf`,
          revisado_por: revisado ? ec.responsable : null,
          // El observado se revisó hace 3 días, así su seguimiento cae esta semana
          fecha_revision: !revisado ? null : esp.c === 'observado' ? dia(-3) : sumarDias(emision, 4),
          observacion: esp.c === 'observado' ? esp.motivo : null,
        })
      })
    })
  })

  const id = (razon: string) => clientes.find((c) => c.razon_social === razon)!.id
  const servicio = (razon: string, servicioId: string) => servicios.find((s) => s.cliente_id === id(razon) && s.servicio_id === servicioId)!.id
  const notas: Nota[] = [
    { id: 'nota-01', cliente_id: id(CLIENTES_GUION.metalurgica), servicio_cliente_id: servicio(CLIENTES_GUION.metalurgica, 'efluentes'), autor_id: 'hugo', fecha: dia(-12), texto: 'Se tomó la muestra de efluentes; el laboratorio entrega en dos semanas.', automatica: false },
    { id: 'nota-02', cliente_id: id(CLIENTES_GUION.metalurgica), servicio_cliente_id: null, autor_id: 'hugo', fecha: dia(-4), texto: 'Marcela pidió que los avisos le lleguen por mail, no por WhatsApp.', automatica: false },
    { id: 'nota-03', cliente_id: id(CLIENTES_GUION.loteo), servicio_cliente_id: servicio(CLIENTES_GUION.loteo, 'licencia'), autor_id: 'karina', fecha: dia(-30), texto: 'Aviso de proyecto aprobado. Se arranca con el Estudio de Impacto Ambiental.', automatica: false },
    { id: 'nota-04', cliente_id: id(CLIENTES_GUION.loteo), servicio_cliente_id: servicio(CLIENTES_GUION.loteo, 'licencia'), autor_id: 'karina', fecha: dia(-6), texto: 'Falta que el cliente mande plano de mensura y las dos factibilidades.', automatica: false },
    { id: 'nota-05', cliente_id: id(CLIENTES_GUION.alimentos), servicio_cliente_id: null, autor_id: 'lilian', fecha: dia(-15), texto: 'Interesados en sumar monitoreo de ruido el año que viene.', automatica: false },
  ]

  return { clientes, catalogo: CATALOGO, servicios, documentos, etapas, notas, ajustes_recordatorios: {} }
}
