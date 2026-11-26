# SCH Consultores Ambientales · Demo de gestión de clientes

Prototipo navegable, con datos ficticios, que muestra a los socios de SCH cómo se vería un único sistema para ver clientes, servicios contratados, avance de trámites, documentación y recordatorios. Spec completo en [docs/spec-demo.md](docs/spec-demo.md).

> Con más de 40 clientes, nadie debería abrir carpetas para saber qué vence y qué falta.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `web/` | SPA React + Vite + TypeScript + Tailwind (deploy en Vercel) |
| `web/src/lib/` | `tipos.ts`, `seed.ts` (datos de demo), `reglas.ts` (estados y recordatorios), `store.ts` (estado + localStorage) |
| `docs/` | Spec del demo |

## Desarrollo local

```bash
cd web
npm install
npm run dev     # http://localhost:5173
npm test        # pruebas de reglas
```

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
- Solo colores de la guía de estilo del sitio (ver spec); ámbar y rojo, únicamente para el semáforo.
- Textos de la interfaz en español rioplatense.
