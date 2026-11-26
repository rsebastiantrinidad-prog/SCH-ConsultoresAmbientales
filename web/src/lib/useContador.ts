import { useEffect, useRef, useState } from 'react'

const reducirMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Número que "cuenta" hasta su valor: desde 0 al aparecer y desde el valor anterior cuando cambia.
 * Con "reducir movimiento" muestra el valor directo.
 */
export function useContador(valor: number, duracion = 700): number {
  const [mostrado, setMostrado] = useState(() => (reducirMovimiento() ? valor : 0))
  const desde = useRef(mostrado)

  useEffect(() => {
    if (reducirMovimiento()) {
      setMostrado(valor)
      return
    }
    const inicio = performance.now()
    const origen = desde.current
    let cuadro = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion)
      const suave = 1 - Math.pow(1 - p, 3)
      const v = Math.round(origen + (valor - origen) * suave)
      desde.current = v
      setMostrado(v)
      if (p < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracion])

  return mostrado
}
