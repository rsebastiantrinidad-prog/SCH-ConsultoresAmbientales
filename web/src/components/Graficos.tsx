/**
 * Gráficos del tablero, en HTML y CSS (sin librerías). Siguen la guía de visualización:
 * una sola serie en verde de marca (la paleta no tiene un segundo tono que pase como categoría),
 * colores de estado solo para estados y siempre con ícono y texto, barras finas con punta redondeada,
 * tooltip al pasar el mouse o con el foco, y una tabla con los datos en cada tarjeta.
 */
import { ChevronDown } from 'lucide-react'
import { useState, type ComponentType, type ReactNode } from 'react'
import { useContador } from '../lib/useContador'

type Icono = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

// ---------------------------------------------------------------- Tarjeta

export function TarjetaGrafico({
  titulo, subtitulo, children, tabla, i = 0, className = '',
}: {
  titulo: string
  subtitulo?: string
  children: ReactNode
  /** Filas para "Ver datos": la primera es el encabezado. */
  tabla?: (string | number)[][]
  i?: number
  className?: string
}) {
  const [abierta, setAbierta] = useState(false)
  return (
    <section className={`animar-entrada flex min-w-0 flex-col gap-4 rounded-[4px] border border-sch-black/10 bg-white p-4 sm:p-5 ${className}`} style={{ '--i': i } as React.CSSProperties}>
      <header>
        <h3 className="text-lg font-bold">{titulo}</h3>
        {subtitulo && <p className="text-sm text-sch-muted">{subtitulo}</p>}
      </header>
      <div className="flex-1">{children}</div>
      {tabla && tabla.length > 1 && (
        <div className="border-t border-sch-black/10 pt-3">
          <button type="button" aria-expanded={abierta} onClick={() => setAbierta(!abierta)} className="inline-flex items-center gap-1 text-sm font-semibold text-sch-green-dark">
            <ChevronDown className={`h-4 w-4 transition ${abierta ? 'rotate-180' : ''}`} aria-hidden />
            {abierta ? 'Ocultar datos' : 'Ver datos'}
          </button>
          {abierta && (
            <table className="animar-aparecer mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-sch-black/15">
                  {tabla[0].map((c, k) => (
                    <th key={k} scope="col" className={`py-1 font-display font-bold ${k ? 'text-right' : 'text-left'}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabla.slice(1).map((fila, j) => (
                  <tr key={j} className="border-b border-sch-black/5">
                    {fila.map((c, k) => (
                      <td key={k} className={`py-1 ${k ? 'text-right tabular-nums' : ''}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- Cifra y medidor

/** Cifra que cuenta hasta su valor (cifras grandes en Cabin, proporcionales). */
export function Cifra({ valor, sufijo = '', className = '' }: { valor: number; sufijo?: string; className?: string }) {
  const v = useContador(valor)
  return (
    <span className={`font-display font-bold leading-none ${className}`}>
      <span aria-hidden>
        {v}
        {sufijo}
      </span>
      <span className="sr-only">
        {valor}
        {sufijo}
      </span>
    </span>
  )
}

/** Indicador chico con título, cifra y detalle; opcionalmente un medidor. */
export function TarjetaCifra({
  titulo, valor, sufijo, detalle, Icono, medidor, i = 0,
}: {
  titulo: string
  valor: number
  sufijo?: string
  detalle?: string
  Icono: Icono
  /** 0 a 100: muestra un medidor debajo de la cifra */
  medidor?: number
  i?: number
}) {
  return (
    <div className="animar-entrada levantar flex min-w-0 flex-col gap-2 rounded-[4px] border border-sch-black/10 bg-white p-4" style={{ '--i': i } as React.CSSProperties}>
      <span className="flex items-start justify-between gap-2">
        <span className="font-display text-sm font-semibold leading-tight">{titulo}</span>
        <Icono className="h-5 w-5 shrink-0 text-sch-green-dark" aria-hidden />
      </span>
      <Cifra valor={valor} sufijo={sufijo} className="text-4xl text-sch-black" />
      {medidor !== undefined && (
        <div className="h-2 overflow-hidden rounded-full bg-sch-green/20" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={medidor} aria-label={titulo}>
          <div className="crecer-x h-full rounded-full bg-sch-green" style={{ width: `${medidor}%` }} />
        </div>
      )}
      {detalle && <span className="text-xs text-sch-muted">{detalle}</span>}
    </div>
  )
}

// ---------------------------------------------------------------- Barra segmentada (una totalidad en partes)

export interface Parte {
  etiqueta: string
  valor: number
  /** Clases de fondo y texto (colores de estado) */
  clase: string
  Icono?: Icono
}

/**
 * Barra segmentada alta: cada parte con su cantidad adentro si entra, leyenda con los nombres.
 * `fina`: versión de 8 px sin texto, para filas (la cifra va al lado).
 */
export function BarraSegmentada({ partes, fina = false, etiqueta }: { partes: Parte[]; fina?: boolean; etiqueta: string }) {
  const total = partes.reduce((n, p) => n + p.valor, 0) || 1
  const visibles = partes.filter((p) => p.valor > 0)
  const resumen = partes.map((p) => `${p.etiqueta}: ${p.valor}`).join(', ')
  return (
    <div role="img" aria-label={`${etiqueta}. ${resumen}`} className={`flex w-full gap-[2px] ${fina ? 'h-2' : 'h-7'}`}>
      {visibles.map((p, k) => (
        <div
          key={p.etiqueta}
          title={`${p.etiqueta}: ${p.valor} (${Math.round((p.valor / total) * 100)}%)`}
          className={`crecer-x flex items-center overflow-hidden ${fina ? 'rounded-full' : 'rounded-[4px] px-2'} ${p.clase}`}
          style={{ width: `${(p.valor / total) * 100}%`, '--i': k } as React.CSSProperties}
        >
          {!fina && (p.valor / total) * 100 >= 9 && <span className="font-display text-sm font-bold tabular-nums">{p.valor}</span>}
        </div>
      ))}
    </div>
  )
}

export function Leyenda({ partes }: { partes: Parte[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {partes.map((p) => (
        <li key={p.etiqueta} className="inline-flex items-center gap-1.5">
          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] ${p.clase}`} aria-hidden>
            {p.Icono && <p.Icono className="h-3 w-3" aria-hidden />}
          </span>
          {p.etiqueta}
          <span className="tabular-nums text-sch-muted">{p.valor}</span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------- Barras horizontales

export interface FilaBarra {
  etiqueta: string
  valor: number
  /** Color de la barra (por defecto, verde de marca) */
  clase?: string
  Icono?: Icono
}

/** Barras horizontales con el valor en la punta. Base común a la izquierda; máximo 24 px de grosor. */
export function BarrasHorizontales({ filas, sufijo = '' }: { filas: FilaBarra[]; sufijo?: string }) {
  const max = Math.max(1, ...filas.map((f) => f.valor))
  return (
    <ul className="space-y-2.5">
      {filas.map((f, k) => (
        <li key={f.etiqueta} className="grid grid-cols-[minmax(6.5rem,40%)_minmax(0,1fr)] items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 truncate">
            {f.Icono && <f.Icono className="h-4 w-4 shrink-0 text-sch-muted" aria-hidden />}
            {f.etiqueta}
          </span>
          <span className="flex items-center gap-2" title={`${f.etiqueta}: ${f.valor}${sufijo}`}>
            {f.valor > 0 ? (
              <span
                className={`crecer-x h-4 rounded-r-[4px] ${f.clase ?? 'bg-sch-green'}`}
                style={{ width: `${(f.valor / max) * 85}%`, '--i': k } as React.CSSProperties}
              />
            ) : (
              <span className="h-4 w-px bg-sch-black/20" />
            )}
            <span className="font-display font-bold tabular-nums">
              {f.valor}
              {sufijo}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------- Columnas (serie en el tiempo)

export interface Columna {
  etiqueta: string
  /** Texto completo para el tooltip (ej. "noviembre de 2026") */
  detalle: string
  valor: number
  destacada?: boolean
}

/**
 * Columnas de una serie, con línea de base, una guía en el máximo, etiqueta solo en el máximo
 * y tooltip por columna (mouse o teclado).
 */
export function Columnas({ columnas, unidad, alto = 160 }: { columnas: Columna[]; unidad: string; alto?: number }) {
  const [activa, setActiva] = useState<number | null>(null)
  const max = Math.max(1, ...columnas.map((c) => c.valor))
  const iMax = columnas.findIndex((c) => c.valor === max)
  return (
    <div>
      <div className="relative flex items-end gap-1 border-b border-sch-black/25 pt-5" style={{ height: alto + 20 }} onPointerLeave={() => setActiva(null)}>
        {/* Guía en el máximo: la columna más alta llega justo a esta línea */}
        <div className="pointer-events-none absolute inset-x-0 top-5 border-t border-sch-black/10" aria-hidden />
        {columnas.map((c, k) => (
          <button
            key={c.etiqueta + k}
            type="button"
            className="group relative flex h-full flex-1 flex-col items-center justify-end outline-offset-1"
            onPointerEnter={() => setActiva(k)}
            onFocus={() => setActiva(k)}
            onBlur={() => setActiva(null)}
            aria-label={`${c.detalle}: ${c.valor} ${unidad}`}
          >
            {k === iMax && c.valor > 0 && <span className="mb-1 font-display text-xs font-bold tabular-nums">{c.valor}</span>}
            <span
              className={`crecer-y w-full max-w-6 rounded-t-[4px] transition-[filter] group-hover:brightness-110 ${c.destacada ? 'bg-sch-green' : 'bg-sch-green-dark'} ${activa === k ? 'brightness-125' : ''}`}
              style={{ height: `${(c.valor / max) * alto}px`, '--i': k } as React.CSSProperties}
            />
            {activa === k && (
              <span className="animar-aparecer pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-[4px] bg-sch-black px-2 py-1 text-xs text-white" role="tooltip">
                <strong className="font-display text-sm">{c.valor}</strong> {unidad} · {c.detalle}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-1 flex gap-1" aria-hidden>
        {columnas.map((c, k) => (
          <span key={k} className={`flex-1 text-center text-[11px] capitalize ${c.destacada ? 'font-bold text-sch-black' : 'text-sch-muted'}`}>
            {c.etiqueta}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Lista de medidores

export interface FilaMedidor {
  clave: string
  titulo: ReactNode
  detalle?: string
  valor: number
}

/** Una fila por ítem: nombre, barra y porcentaje alineados. */
export function ListaMedidores({ filas }: { filas: FilaMedidor[] }) {
  return (
    <ul className="space-y-3">
      {filas.map((f, k) => (
        <li key={f.clave} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{f.titulo}</span>
            <span className="font-display font-bold tabular-nums">{f.valor}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sch-green/20" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={f.valor} aria-label={`Avance: ${f.valor}%`}>
            <div className="crecer-x h-full rounded-full bg-sch-green" style={{ width: `${f.valor}%`, '--i': k } as React.CSSProperties} />
          </div>
          {f.detalle && <p className="text-xs text-sch-muted">{f.detalle}</p>}
        </li>
      ))}
    </ul>
  )
}
