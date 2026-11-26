import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns'
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
