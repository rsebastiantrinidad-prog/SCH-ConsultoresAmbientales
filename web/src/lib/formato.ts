import {
  addDays, addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek,
} from 'date-fns'
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

/** Mes en formato 'YYYY-MM' de una fecha. */
export const mesDe = (f: Fecha): string => f.slice(0, 7)

/** "noviembre de 2026" */
export const nombreMes = (mes: string): string => format(parseISO(`${mes}-01`), "MMMM 'de' yyyy", { locale: es })

export const sumarMesesAMes = (mes: string, n: number): string => mesDe(sumarMeses(`${mes}-01`, n))

/** Semanas (de lunes a domingo) que cubren el mes, con los días de los meses vecinos para completar. */
export function semanasDelMes(mes: string): Fecha[][] {
  const inicio = startOfWeek(startOfMonth(parseISO(`${mes}-01`)), { weekStartsOn: 1 })
  const fin = endOfWeek(endOfMonth(parseISO(`${mes}-01`)), { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin }).map(iso)
  const semanas: Fecha[][] = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  return semanas
}

/** "hoy", "mañana", "en 5 días", "ayer", "hace 3 días". */
export function relativo(hoy: Fecha, f: Fecha): string {
  const n = diasEntre(hoy, f)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}
