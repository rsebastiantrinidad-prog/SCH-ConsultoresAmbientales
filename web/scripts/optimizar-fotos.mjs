/**
 * Genera las fotos optimizadas que usa la app (npm run fotos).
 *
 * Lee los originales de web/fotos-originales/ y escribe en web/public/fotos/ una versión WebP por ancho
 * (nombre-480.webp, nombre-800.webp, ...), en sRGB y sin metadatos. La app las pide con srcset,
 * así cada pantalla baja solo el tamaño que necesita.
 *
 * Para sumar una foto: copiarla a fotos-originales/, agregarla en FOTOS (acá y en src/lib/fotos.ts) y correr el script.
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGEN = join(raiz, 'fotos-originales')
const DESTINO = join(raiz, 'public', 'fotos')

/** Anchos por foto: las 3:2 se usan en tarjetas y encabezados; la panorámica, a lo ancho del tablero. */
const ANCHOS_3_2 = [480, 800, 1200]
const FOTOS = {
  'efluentes-muestra': ANCHOS_3_2,
  'auditoria-planta': ANCHOS_3_2,
  'carpetas-vencimientos': ANCHOS_3_2,
  'loteo-aereo': ANCHOS_3_2,
  'ingeniera-planta': [800, 1400, 2000],
}
const CALIDAD = 68

await rm(DESTINO, { recursive: true, force: true })
await mkdir(DESTINO, { recursive: true })

const archivos = await readdir(ORIGEN)
let total = 0
for (const [nombre, anchos] of Object.entries(FOTOS)) {
  const original = archivos.find((a) => a.replace(/\.\w+$/, '') === nombre)
  if (!original) throw new Error(`Falta el original de ${nombre} en fotos-originales/`)
  const { width } = await sharp(join(ORIGEN, original)).metadata()
  for (const ancho of anchos) {
    const salida = join(DESTINO, `${nombre}-${ancho}.webp`)
    await sharp(join(ORIGEN, original))
      .resize({ width: Math.min(ancho, width), withoutEnlargement: true })
      .toColorspace('srgb')
      .webp({ quality: CALIDAD, effort: 6, smartSubsample: true })
      .toFile(salida)
    const kb = (await stat(salida)).size / 1024
    total += kb
    console.log(`${nombre}-${ancho}.webp`.padEnd(32), `${kb.toFixed(0).padStart(4)} kB`)
  }
}
console.log(`Total: ${total.toFixed(0)} kB`)
