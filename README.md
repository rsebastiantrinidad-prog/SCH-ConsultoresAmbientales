# SCH Consultores Ambientales · Demo de gestión de clientes

Prototipo navegable, con datos ficticios, que muestra a los socios de SCH cómo se vería un único sistema para ver clientes, servicios contratados, avance de trámites, documentación y recordatorios. Spec completo en [docs/spec-demo.md](docs/spec-demo.md).

> Con más de 40 clientes, nadie debería abrir carpetas para saber qué vence y qué falta.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `web/` | SPA React + Vite + TypeScript + Tailwind (deploy en Vercel) |
| `web/src/lib/` | `tipos.ts` (modelo), `seed.ts` (datos de demo), `reglas.ts` (estados, semáforo, recordatorios, plan anual), `acciones.ts` (cambios puros), `store.ts` (estado + localStorage + `api`) |
| `web/src/pages/` | Tablero, Clientes, Ficha de cliente, Recordatorios, Plan anual |
| `web/src/components/` | Layout, piezas de UI, ficha (pestañas, documentación), avisos, calendario |
| `docs/` | [Spec del demo](docs/spec-demo.md) y [guion de la demo con los criterios verificados](docs/guion-demo.md) |

## Desarrollo local

```bash
cd web
npm install
npm run dev       # http://localhost:5173
npm test          # pruebas de reglas, seed y acciones (vitest)
npm run build     # build de producción en web/dist
npm run preview   # sirve el build en http://localhost:4173
```

En el pie de la app están **Hoy en el demo** (por defecto 26/11/2026) y **Reiniciar datos de demo**. Los cambios se guardan en el `localStorage` del navegador.

## Deploy

Vercel, con **Root Directory = `web`**. `web/vercel.json` reescribe todas las rutas a `index.html` (SPA).

## Plan de trabajo

El proyecto se sigue en Linear: **SCH-ConsultoresAmbientales** (equipo Driven by People v02), en nueve hitos que se trabajan en orden:

1. H1 · Base del proyecto
2. H2 · Datos de demo y reglas
3. H3 · Tablero y Clientes (P0)
4. H4 · Ficha de cliente y Documentación (P0)
5. H5 · Recordatorios y avisos (P0)
6. H6 · Seguimiento de trámite y Plan anual (P1)
7. H7 · Pulido y ensayo de la demo
8. H8 · Vista del cliente (P2)
9. H9 · Post-demo: relevamiento y paso a Supabase

Cada commit o PR referencia su issue (`PER-xxx`).

## Reglas

- Un hito por vez: no se empieza el siguiente hasta cumplir los criterios del anterior.
- Las reglas de negocio van en funciones puras de `lib/reglas.ts`, con pruebas; las pantallas no recalculan estados.
- Ningún dato real de clientes de SCH: todo el contenido es inventado y lleva "(demo)". Emails `@ejemplo.test`, teléfonos `351 000-xxxx`.
- Ninguna acción envía mails o mensajes ni sube archivos de verdad.
- Solo colores de la guía de estilo del sitio (ver spec); ámbar y rojo, únicamente para el semáforo. Para texto secundario se usa `#666666` (el `#777777` del sitio no llega a AA sobre blanco).
- Accesibilidad AA: el estado nunca se indica solo con color (ícono + texto) y se revisa con axe-core.
- Textos de la interfaz en español rioplatense.
