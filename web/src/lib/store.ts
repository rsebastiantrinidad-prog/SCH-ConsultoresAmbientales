/**
 * Estado del demo: en memoria y guardado en localStorage. No hay base de datos.
 * Las pantallas leen con `useDemo()` y cambian datos solo a través de `api`, que es la interfaz
 * que después se implementa con Supabase (como lib/api.ts de MUPREN).
 */
import { useSyncExternalStore } from 'react'
import * as acciones from './acciones'
import { HOY_POR_DEFECTO } from './formato'
import { construirSeed } from './seed'
import type { CargaDocumento, Datos, Fecha } from './tipos'
import { usuarioActual, type IdUsuario } from './usuario'

/** Subir este número cuando cambie la forma de los datos: lo guardado con otra versión se descarta. */
const VERSION = 1
const CLAVE = 'sch-demo'

export interface EstadoDemo {
  version: number
  hoy: Fecha
  datos: Datos
}

const inicial = (hoy: Fecha = HOY_POR_DEFECTO): EstadoDemo => ({ version: VERSION, hoy, datos: construirSeed(hoy) })

function cargar(): EstadoDemo {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as EstadoDemo | null
    if (guardado?.version === VERSION && guardado.hoy && guardado.datos) return guardado
  } catch {
    /* guardado roto o sin almacenamiento: se arranca del seed */
  }
  return inicial()
}

let estado: EstadoDemo = cargar()
const oyentes = new Set<() => void>()

function guardar(nuevo: EstadoDemo) {
  estado = nuevo
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  } catch {
    /* sin almacenamiento: los cambios duran hasta recargar */
  }
  oyentes.forEach((f) => f())
}

function suscribir(f: () => void) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

/** Estado completo del demo (hoy y datos). Se vuelve a renderizar con cada cambio. */
export function useDemo(): EstadoDemo {
  return useSyncExternalStore(suscribir, () => estado)
}

export const leerEstado = (): EstadoDemo => estado

/** Quién firma las notas: el usuario elegido o, si está en "Todos", el responsable del cliente. */
function autorPara(clienteId?: string): IdUsuario {
  const u = usuarioActual()
  if (u !== 'todos') return u
  return estado.datos.clientes.find((c) => c.id === clienteId)?.responsable_id ?? 'hugo'
}

const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function ctx(clienteId?: string): acciones.Contexto {
  return { hoy: estado.hoy, autor: autorPara(clienteId), nuevoId }
}

const clienteDeServicio = (servicioId: string) => estado.datos.servicios.find((s) => s.id === servicioId)?.cliente_id
const clienteDeDocumento = (docId: string) => {
  const d = estado.datos.documentos.find((x) => x.id === docId)
  return d ? clienteDeServicio(d.servicio_cliente_id) : undefined
}
const clienteDeRecordatorio = (id: string) => {
  const [, ...resto] = id.split('-')
  const ref = resto.join('-')
  return id.startsWith('vis-') ? clienteDeServicio(ref) : clienteDeDocumento(ref)
}

function aplicar(f: (d: Datos) => Datos) {
  guardar({ ...estado, datos: f(estado.datos) })
}

/** Todas las acciones del demo. Ninguna envía mensajes ni guarda archivos de verdad. */
export const api = {
  editarCliente: (id: string, cambios: acciones.CambiosCliente) => aplicar((d) => acciones.editarCliente(d, id, cambios)),
  agregarNota: (clienteId: string, texto: string, servicioId: string | null = null) =>
    aplicar((d) => acciones.agregarNota(d, ctx(clienteId), clienteId, texto, servicioId)),
  agregarServicio: (clienteId: string, servicioId: string) => aplicar((d) => acciones.agregarServicio(d, ctx(clienteId), clienteId, servicioId)),
  avanzarEtapa: (servicioId: string) => aplicar((d) => acciones.avanzarEtapa(d, ctx(clienteDeServicio(servicioId)), servicioId)),
  retrocederEtapa: (servicioId: string) => aplicar((d) => acciones.retrocederEtapa(d, ctx(clienteDeServicio(servicioId)), servicioId)),
  cambiarCarga: (docId: string, carga: CargaDocumento, observacion?: string) =>
    aplicar((d) => acciones.cambiarCarga(d, ctx(clienteDeDocumento(docId)), docId, carga, observacion ?? null)),
  cambiarVigencia: (docId: string, fecha: Fecha | null) => aplicar((d) => acciones.cambiarVigencia(d, docId, fecha)),
  adjuntarArchivo: (docId: string, nombre: string) => aplicar((d) => acciones.adjuntarArchivo(d, ctx(clienteDeDocumento(docId)), docId, nombre)),
  marcarHecho: (recordatorioId: string) => aplicar((d) => acciones.marcarHecho(d, recordatorioId)),
  posponer: (recordatorioId: string) => aplicar((d) => acciones.posponer(d, ctx(clienteDeRecordatorio(recordatorioId)), recordatorioId)),
  simularEnvio: (recordatorioId: string, canal: string) =>
    aplicar((d) => acciones.simularEnvio(d, ctx(clienteDeRecordatorio(recordatorioId)), recordatorioId, canal)),

  /** Cambia el "hoy" del demo; los datos no se tocan (es como si pasara el tiempo). */
  cambiarHoy: (hoy: Fecha) => guardar({ ...estado, hoy }),
  /** Vuelve todo al seed, relativo al hoy por defecto. */
  reiniciar: () => guardar(inicial()),
}
