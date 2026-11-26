/**
 * Estadísticas de la cartera para el Tablero. Funciones puras sobre los datos y un `hoy`,
 * filtradas por responsable como el resto del tablero.
 */
import { diasEntre, mesDe, sumarDias, sumarMesesAMes } from './formato'
import {
  avance, estadoDocumento, etapaActual, etapasDeServicio, planAnual, semaforoCliente, type FiltroResponsable,
} from './reglas'
import type { CategoriaServicio, Datos, EstadoDocumento, Fecha, Semaforo } from './tipos'
import { USUARIOS, type IdUsuario } from './usuario'

/** Orden natural de los estados de un documento (de lo bueno a lo grave). */
export const ORDEN_ESTADOS: EstadoDocumento[] = ['vigente', 'en_revision', 'por_vencer', 'pendiente', 'observado', 'vencido']

export interface MesCarga {
  mes: string
  renovaciones: number
  visitas: number
}

export interface TramiteEnCurso {
  cliente_id: string
  cliente: string
  servicio: string
  avance: number
  etapa: string | null
}

export interface Estadisticas {
  /** Documentos de servicios contratados (sin propuestas), por estado. */
  documentos: Record<EstadoDocumento, number>
  documentos_total: number
  /** Porcentaje de documentos vigentes o en revisión (0 a 100). */
  pct_al_dia: number
  semaforo: Record<Semaforo, number>
  semaforo_por_responsable: { id: IdUsuario; nombre: string; semaforo: Record<Semaforo, number> }[]
  servicios_activos: number
  servicios_por_categoria: { categoria: CategoriaServicio; nombre: string; cantidad: number }[]
  visitas_30: number
  avisos_30: number
  /** Doce meses desde el mes de `hoy`: renovaciones de documentos y visitas/auditorías. */
  por_mes: MesCarga[]
  tramites: TramiteEnCurso[]
}

export const NOMBRE_CATEGORIA: Record<CategoriaServicio, string> = {
  licencia: 'Licencias',
  auditoria_pga: 'Auditoría y PGA',
  efluentes: 'Efluentes',
  residuos: 'Residuos',
  iso: 'ISO',
  otros: 'Monitoreo y otros',
}

const vacioSemaforo = (): Record<Semaforo, number> => ({ verde: 0, ambar: 0, rojo: 0 })

export function estadisticas(datos: Datos, hoy: Fecha, filtro: FiltroResponsable = 'todos'): Estadisticas {
  const clientes = datos.clientes.filter((c) => c.estado === 'activo' && (filtro === 'todos' || c.responsable_id === filtro))
  const ids = new Set(clientes.map((c) => c.id))
  const contratados = datos.servicios.filter((s) => ids.has(s.cliente_id) && s.estado !== 'propuesta')
  const idsServicios = new Set(contratados.map((s) => s.id))
  const docs = datos.documentos.filter((d) => idsServicios.has(d.servicio_cliente_id))

  const documentos = Object.fromEntries(ORDEN_ESTADOS.map((e) => [e, 0])) as Record<EstadoDocumento, number>
  for (const d of docs) documentos[estadoDocumento(d, hoy)]++
  const alDia = documentos.vigente + documentos.en_revision

  const semaforo = vacioSemaforo()
  const porResponsable = new Map(USUARIOS.map((u) => [u.id, vacioSemaforo()]))
  for (const c of clientes) {
    const s = semaforoCliente(datos, c.id, hoy)
    semaforo[s]++
    porResponsable.get(c.responsable_id)![s]++
  }

  const porCategoria = new Map<CategoriaServicio, number>()
  for (const s of contratados) {
    const cat = datos.catalogo.find((c) => c.id === s.servicio_id)?.categoria ?? 'otros'
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + 1)
  }

  const desde = mesDe(hoy)
  const meses = Array.from({ length: 12 }, (_, i) => sumarMesesAMes(desde, i))
  const por_mes: MesCarga[] = meses.map((mes) => ({ mes, renovaciones: 0, visitas: 0 }))
  for (const c of clientes) {
    for (const fila of planAnual(datos, c.id, desde)) {
      for (const e of fila.eventos) {
        const m = por_mes[meses.indexOf(mesDe(e.fecha))]
        if (!m) continue
        if (e.tipo === 'renovacion') m.renovaciones++
        else m.visitas++
      }
    }
  }

  const hace30 = sumarDias(hoy, -30)
  const avisos_30 = datos.notas.filter((n) => ids.has(n.cliente_id) && n.automatica && n.texto.startsWith('Aviso simulado') && n.fecha >= hace30 && n.fecha <= hoy).length

  const visitas_30 = contratados.filter((s) => s.proxima_fecha && (s.estado === 'vigente' || s.estado === 'en_curso') && diasEntre(hoy, s.proxima_fecha) >= 0 && diasEntre(hoy, s.proxima_fecha) <= 30).length

  const tramites: TramiteEnCurso[] = contratados
    .filter((s) => s.estado === 'en_curso')
    .map((s) => {
      const etapas = etapasDeServicio(datos, s.id)
      return {
        cliente_id: s.cliente_id,
        cliente: datos.clientes.find((c) => c.id === s.cliente_id)!.razon_social,
        servicio: datos.catalogo.find((c) => c.id === s.servicio_id)?.nombre ?? s.servicio_id,
        avance: avance(etapas),
        etapa: etapaActual(etapas)?.nombre ?? null,
      }
    })
    .sort((a, b) => a.avance - b.avance || a.cliente.localeCompare(b.cliente))

  return {
    documentos,
    documentos_total: docs.length,
    pct_al_dia: docs.length ? Math.round((alDia / docs.length) * 100) : 100,
    semaforo,
    semaforo_por_responsable: USUARIOS.filter((u) => filtro === 'todos' || u.id === filtro).map((u) => ({ id: u.id, nombre: u.nombre, semaforo: porResponsable.get(u.id)! })),
    servicios_activos: contratados.filter((s) => s.estado === 'en_curso' || s.estado === 'vigente').length,
    servicios_por_categoria: [...porCategoria.entries()]
      .map(([categoria, cantidad]) => ({ categoria, nombre: NOMBRE_CATEGORIA[categoria], cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre)),
    visitas_30,
    avisos_30,
    por_mes,
    tramites,
  }
}
