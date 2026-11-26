# Guion de la demo · SCH Gestión

Demo de 10 minutos para Hugo, Karina y Lilian. Todo es ficticio: no se guardan datos reales ni se envía nada.
Spec completo en [spec-demo.md](spec-demo.md).

## Antes de empezar

- [ ] Abrir la URL publicada en la notebook, en pantalla completa (probado en 1366×768).
- [ ] En el pie, **Reiniciar datos de demo** y dejar **Hoy en el demo** en 26/11/2026.
- [ ] Selector de usuario de la barra en **Todos**.
- [ ] Tener la misma URL abierta en un celular de respaldo.

## Guion

| Minuto | Pantalla | Qué hacer | Qué decir |
| --- | --- | --- | --- |
| 0–1 | Tablero | Mostrar los 4 indicadores (12 activos, 2 vencimientos en 30 días y 2 ya vencidos, 3 documentos faltantes, 3 trámites en curso). Tocar **Karina** para ver que el tablero cambia por responsable y volver a **Todos**. | "Esto es lo que hoy no ven sin abrir carpetas: qué vence, qué falta y qué avanza." |
| 1–3 | Ficha de Metalúrgica Ejemplo | Desde **Necesitan atención**, entrar a Metalúrgica (rojo: análisis vencido hace 10 días). En **Qué vence y qué falta**, **Pedir al cliente** sobre el análisis. Mostrar Mail y WhatsApp y **Simular envío**. | "Así se pasa de enterarse tarde a avisar con anticipación." |
| 3–5 | Loteo Los Algarrobos → Seguimiento | Pestaña **Seguimiento**: licencia al 40%, en Estudio de Impacto Ambiental. **Marcar hecha**, escribir una nota ("Se presentó el EIA") y confirmar: pasa al 60% y queda en la bitácora. | "El cliente deja de preguntar cómo va lo suyo." |
| 5–7 | Recordatorios | Lista por grupos (Vencidos, Esta semana, Próximos 30 días). **Posponer 7 días** una visita y ver que cambia de grupo. Pasar a **Calendario**. | "Los vencimientos se calculan solos y llegan con tiempo." |
| 7–9 | Plan anual | Alimentos del Centro (sale primero): 2 auditorías de ISO, 1 visita de residuos y 5 renovaciones en 12 meses. Tocar la visita de residuos y moverla. | "Los servicios del año quedan planificados y se pueden ofrecer ordenados." |
| 9–10 | Cierre | Volver al tablero. | "¿Qué es lo que más falta acá y qué sobra?" |

Si sobra tiempo:

- **Documentación:** en la ficha de Metalúrgica, pestaña **Documentación**, cambiar la fecha del análisis vencido a una fecha futura. El cliente pasa de rojo a ámbar y el tablero baja a "1 ya vencido".
- **Vista del cliente (P2, 1 minuto):** en la ficha del Loteo, **Ver como el cliente** (o en el selector de la barra, **Cliente (demo)**). El cliente ve cómo va su licencia y los tres documentos que faltan; **Subir documento** pasa el plano a "En revisión". Con **Volver a SCH Gestión**, la ficha muestra el documento en revisión y la nota para Karina. Frase: "El cliente manda lo que falta sin que tengan que perseguirlo."

Para la vista del cliente conviene llevar un PDF cualquiera en la notebook: solo se toma su nombre, el archivo no se lee ni se guarda.

## Criterios de aceptación (spec)

Verificado el 26/11/2026 sobre el build de producción (`npm run build` + `vite preview`), en 1366×768 y 375×812.

| Criterio | Estado | Cómo se verificó |
| --- | --- | --- |
| Los cuatro indicadores del tablero se calculan desde los datos | ✅ | `indicadores()` con pruebas (`indicadores.test.ts`); cambian al filtrar por responsable y al cambiar vigencias. |
| Cambiar la vigencia de un documento actualiza el semáforo del cliente y el tablero | ✅ | Prueba en `acciones.test.ts` y en el navegador: Metalúrgica pasa de rojo a ámbar; el tablero, de "2 ya vencidos" a "1". |
| "Pedir al cliente" abre una vista previa con todas las variables completas | ✅ | Prueba sobre todos los recordatorios del seed (`seed.test.ts`, `avisos.test.ts`) y en el navegador. |
| Cada pantalla P0 funciona en 1366×768 y en celular, y carga en menos de un segundo | ✅ | Sin desborde horizontal en ninguna pantalla a 375 px; carga completa entre 50 y 85 ms en local (JS de 120 kB comprimido). |
| "Reiniciar datos de demo" deja todo como al principio | ✅ | Después de un guion completo: notas, ajustes, etapas e indicadores vuelven al seed. |
| No aparece ningún dato real de clientes de SCH | ✅ | Todos los clientes y contactos llevan "(demo)", mails `@ejemplo.test` y teléfonos `351 000-xxxx` (prueba en `seed.test.ts`). |
| Los colores usados son los de la guía de estilo | ✅ | Búsqueda de hex, `rgba` y utilidades de color en `src/`: solo la paleta. Ver nota sobre el gris de texto. |
| Todos los textos están en español rioplatense | ✅ | Revisión de textos: voseo en las indicaciones ("Buscá", "Tocá", "Escribí", "Revisá"). |
| Ninguna acción del demo envía mensajes ni guarda archivos de verdad | ✅ | Durante el guion completo, el registro de red solo muestra la imagen del logo. Adjuntar guarda solo el nombre del archivo. |

**Accesibilidad:** axe-core (WCAG 2.1 AA y buenas prácticas) da 0 problemas en todas las pantallas y en el diálogo de aviso.

## Decisiones de diseño para tener presentes

- **Gris de texto secundario `#666666`:** el gris del sitio (`#777777`) sobre blanco da 4,48:1 y no llega a AA. Se usa una versión apenas más oscura para texto, igual que el verde oscuro derivado que ya prevé el spec. `#777777` y `#727271` siguen para fondos y el pie.
- **Botón principal en 19 px negrita:** con ese tamaño, el blanco sobre el verde de marca (3,1:1) cumple AA como "texto grande", como dice el spec.
- **Encabezado del tablero sin foto:** la foto de follaje del sitio es de stock y tiene copyright de un fotógrafo. Se usa un patrón de hojas en SVG con los colores de la marca.
- **Logo:** se usa el logo real de SCH (`logo1.png` del sitio), con el visto bueno de Sebastián.

## Preguntas abiertas (PER-137)

- Vista del cliente: está hecha (H8); queda como paso opcional del guion, según cómo venga el tiempo.
- ¿Con qué nombre se presenta el sistema? Provisorio: "SCH Gestión".
- ¿Se muestra una cifra de ahorro de horas? Sin los datos del relevamiento, no hay base para una.
