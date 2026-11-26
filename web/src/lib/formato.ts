import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Fecha } from './tipos'

/** "Hoy" del demo: fijo para que se vea igual cada vez que se abre (se puede cambiar desde el pie). */
export const HOY_POR_DEFECTO: Fecha = '2026-11-26'

const iso = (d: Date): Fecha => format(d, 'yyyy-MM-dd')

export const sumarDias = (f: Fecha, n: number): Fecha => iso(addDays(parseISO(f), n))
export const sumarMeses = (f: Fecha, n: number): Fecha => iso(addMonths(parseISO(f), n))

/** Días de `desde` a `hasta` (negativo si `hasta` ya pasó). */
export const diasEntre = (desde: Fecha, hasta: Fecha): number => differenceInCalendarDays(parseISO(hasta), parseISO(desde))

/** 26/11/2026 */
export const fechaCorta = (f: Fecha): string => format(parseISO(f), 'dd/MM/yyyy')

/** jueves 26 de noviembre */
export const fechaLarga = (f: Fecha): string => format(parseISO(f), "EEEE d 'de' MMMM", { locale: es })

/** 26 nov */
export const diaMes = (f: Fecha): { dia: string; mes: string } => {
  const d = parseISO(f)
  return { dia: format(d, 'd'), mes: format(d, 'MMM', { locale: es }).replace('.', '') }
}

/** "hoy", "mañana", "en 5 días", "ayer", "hace 3 días". */
export function relativo(hoy: Fecha, f: Fecha): string {
  const n = diasEntre(hoy, f)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}
