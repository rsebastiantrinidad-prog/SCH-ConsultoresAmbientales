/**
 * Logo de SCH Consultores Ambientales, el mismo del sitio (sch-consultores.com.ar):
 * hoja y globo en verde y gris, fondo transparente. Va sobre la barra negra, como en el sitio.
 */
export function Logo({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <img
      src="/marca/logo1.png"
      srcSet="/marca/logo1.png 1x, /marca/logo1_retina.png 2x"
      width={350}
      height={108}
      alt="SCH Consultores Ambientales"
      className={className}
    />
  )
}
