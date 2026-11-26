# Spec demo — Sistema de gestión de clientes SCH (estilo del sitio)

Nov 26, 2026 · @R Sebastián

## Objetivo y alcance

El demo es un prototipo navegable, con datos ficticios, que muestra a los socios de SCH cómo se vería un único sistema para ver clientes, servicios contratados, avance de trámites, documentación y recordatorios. Sirve para abrir la conversación de relevamiento, no para operar el negocio.

- **Tesis que debe dejar clara:** con más de 40 clientes, nadie debería abrir carpetas para saber qué vence y qué falta.
- **Duración de la demostración:** 10 minutos, con tres clientes preparados (ver guión).
- **Es:** una aplicación web con datos de ejemplo, el aspecto del sitio de SCH y las reglas de recordatorio simuladas.
- **No es:** un producto. No guarda datos reales, no envía mails ni mensajes, no valida documentos y no incluye normativa verificada: las vigencias y anticipaciones son valores de ejemplo.
- **Relación con la guía de preguntas:** el demo provoca reacciones; la guía de preguntas (documento aparte) define qué se construye de verdad.

## Usuarios y escenarios

| Usuario | Qué necesita ver | Pregunta que responde |
| --- | --- | --- |
| Socio consultor (Hugo, Karina, Lilian) | Qué vence, qué falta y qué trámites avanzan, filtrado por responsable | “¿Qué tengo que hacer esta semana?” |
| Administrativo (a futuro) | Documentación por cliente, cargas y avisos pendientes | “¿A quién le tengo que pedir qué?” |
| Cliente (vista opcional) | Estado de sus servicios y documentos | “¿Cómo va lo mío?” |

**Escenarios que el demo debe resolver de punta a punta:**

1. **Lunes a la mañana.** El socio abre el tablero y ve los vencimientos de los próximos 30 días y los clientes con documentación faltante.
2. **Documento vencido.** Entra a la ficha del cliente en rojo, ve qué documento venció, pide la renovación y revisa el aviso que se le enviaría al cliente.
3. **Trámite en curso.** Abre una licencia ambiental, mueve la etapa, deja una nota en la bitácora y ve que el avance se actualiza.
4. **Año planificado.** Ve para un cliente los servicios y visitas distribuidos en los 12 meses.

## Módulos y pantallas

Prioridad: **P0** es imprescindible para la demo, **P1** si da el tiempo, **P2** solo si sobra.

| Pantalla | Qué muestra | Acciones clave | Prioridad |
| --- | --- | --- | --- |
| Tablero | Cuatro indicadores (clientes activos, vencimientos en 30 días, documentación faltante, trámites en curso) y la lista “Esta semana” | Filtrar por responsable; entrar a un cliente desde cualquier fila | P0 |
| Clientes | Tabla con cliente, rubro, localidad, responsable, servicios activos, próximo vencimiento y semáforo documental | Buscar; filtrar por rubro, responsable y semáforo; ordenar | P0 |
| Ficha de cliente | Encabezado con datos y contacto, y pestañas: Resumen, Servicios, Documentación, Seguimiento, Recordatorios, Notas | Editar datos; agregar servicio; agregar nota | P0 |
| Documentación | Checklist por servicio: documento, estado, vigente hasta, archivo y última revisión | Cambiar estado; cargar fecha de vigencia; adjuntar archivo (simulado); “Pedir al cliente” | P0 |
| Recordatorios | Lista agrupada en Vencidos, Esta semana, Próximos 30 días y Más adelante, y vista de calendario mensual | Marcar hecho; posponer; “Enviar aviso” con vista previa del mensaje | P0 |
| Seguimiento de trámite | Etapas del servicio en una línea de pasos, porcentaje de avance y bitácora con fecha, autor y nota | Avanzar o retroceder etapa; agregar nota | P1 |
| Plan anual | Grilla de 12 meses por servicio de un cliente con visitas, auditorías y renovaciones | Ver y mover una fecha planificada | P1 |
| Vista del cliente | Versión reducida: estado de sus servicios y documentos pendientes | Subir un documento (simulado) | P2 |

**Navegación:** barra superior negra con el logo de SCH y los ítems Tablero, Clientes, Recordatorios y Plan anual. Una persona selecciona su usuario en un menú simple (sin contraseña) para ver “sus” clientes.

## Modelo de datos

Un cliente tiene varios servicios; cada servicio tiene documentos requeridos y etapas; los recordatorios pueden colgar del cliente, del servicio o de un documento.

| Entidad | Campos principales | Relación |
| --- | --- | --- |
| Usuario | id, nombre, rol, email | Es responsable de clientes y servicios |
| Cliente | id, razón social, rubro, localidad, contacto (nombre, mail, teléfono), estado (Activo, En pausa, Baja), fecha de alta, responsable | Tiene N servicios, N recordatorios y N notas |
| Servicio (catálogo) | id, nombre, categoría (Licencia, Auditoría y PGA, Efluentes, Residuos, ISO, Otros), periodicidad sugerida en meses, plantilla de documentos, etapas por defecto | Se instancia en N servicios de cliente |
| Servicio de cliente | id, cliente, servicio, estado (Propuesta, En curso, Vigente, Finalizado), inicio, periodicidad en meses, próxima fecha, responsable, etapa actual, avance en % | Tiene N documentos y N etapas |
| Documento requerido | id, servicio de cliente, nombre, estado, emisor, fecha de emisión, vigente hasta, archivo, revisado por, fecha de revisión | Pertenece a un servicio de cliente |
| Etapa | id, servicio de cliente, nombre, orden, estado (Pendiente, En curso, Hecha), fecha prevista, fecha real | Pertenece a un servicio de cliente |
| Recordatorio | id, tipo (Vencimiento, Pedido de documentación, Visita, Seguimiento), fecha objetivo, anticipación en días, canal (Mail, WhatsApp, Interno), estado (Programado, Enviado, Hecho, Pospuesto), asignado a | Cuelga de un cliente, un servicio o un documento |
| Nota | id, cliente, servicio (opcional), autor, fecha, texto | Pertenece a un cliente |

En el demo todo vive en memoria y en `localStorage`; no hay base de datos. El modelo está pensado para pasar a Supabase sin cambios de estructura.

## Reglas de recordatorios y estados

Todas las fechas se calculan contra un “hoy” configurable, fijo por defecto en **26/11/2026**, para que el demo se vea igual cada vez que se abre. Las anticipaciones son valores de ejemplo, no normativa.

| Estado del documento | Condición | Color |
| --- | --- | --- |
| Pendiente | Todavía no se cargó | Gris `#777777` |
| En revisión | Cargado, sin revisar | Menta `#20d89b` |
| Vigente | Revisado y con vigencia posterior a la anticipación | Verde `#58a428` |
| Por vencer | Faltan menos días que la anticipación (60 por defecto) | Ámbar `#F2A900` |
| Vencido | La fecha de vigencia ya pasó | Rojo `#C62828` |
| Observado | Revisado con una objeción a resolver | Negro `#000000` con borde rojo |

**Reglas:**

1. Cada documento con vigencia genera un recordatorio en la fecha de vigencia menos la anticipación.
2. Cada servicio recurrente genera un recordatorio de visita según su periodicidad en meses.
3. Un documento Pendiente con fecha objetivo dentro de 14 días aparece en “Documentación faltante” y sugiere el aviso al cliente.
4. El semáforo del cliente es el peor estado de sus documentos: rojo si hay alguno Vencido u Observado, ámbar si hay Por vencer o Pendiente atrasado, verde si todo está Vigente.
5. El avance de un servicio es la cantidad de etapas hechas sobre el total.
6. “Enviar aviso” abre una vista previa con variables completas (`{cliente}`, `{documento}`, `{fecha}`, `{responsable}`) y un botón “Simular envío”. No se envía nada.
7. Posponer un recordatorio lo mueve 7 días y lo deja registrado en la bitácora.

## Datos ficticios de demo

Todo el contenido es inventado y se marca con “(demo)” en el nombre. No se usan clientes reales de SCH ni sus logos. Los responsables llevan los nombres de los tres socios para que se reconozcan en la pantalla.

- **Volumen:** 12 clientes, unos 25 servicios y unos 70 documentos.
- **Distribución del semáforo:** 5 verdes, 4 ámbar y 3 rojos, para que el tablero tenga contraste.
- **Fechas relativas:** el seed se genera con fechas calculadas como “hoy + N días”, así nada queda vencido por error.
- **Rubros incluidos:** industria metalúrgica, alimentos, estación de servicio, loteo, frigorífico, curtiembre, crematorio, parque industrial, terminal de ómnibus, taller de pintura, municipio y laboratorio.

**Tres clientes preparados para la demostración:**

| Cliente (demo) | Servicios | Situación para mostrar |
| --- | --- | --- |
| Metalúrgica Ejemplo S.A. | Efluentes, Auditoría y PGA | Semáforo rojo: un análisis de laboratorio vencido y una auditoría que vence en 30 días |
| Loteo Los Algarrobos | Licencia ambiental | Trámite en curso en la etapa de Estudio de Impacto Ambiental, con tres documentos pendientes y avance del 40% |
| Alimentos del Centro S.A. | ISO 14001, Residuos peligrosos | Casi todo verde, con una inscripción anual que se acerca y un plan anual completo de visitas y auditorías |

**Responsables:** Hugo, Karina y Lilian reparten los 12 clientes en partes parecidas. Cada uno tiene al menos un cliente en rojo.

## Guía de estilo visual tomada del sitio

Los valores salen del sitio sch-consultores.com.ar (hoja de estilos y captura del 26/11/2026). Los colores marcados como derivados no existen en el sitio: se agregan solo para el semáforo y la legibilidad.

| Elemento | Valor | Uso en el demo |
| --- | --- | --- |
| Verde de marca | `#58a428` | Acento principal: botones, enlaces, íconos, barra de avance, estado Vigente |
| Verde menta | `#20d89b` | Resaltes, hover, insignias, estado En revisión |
| Negro | `#000000` | Barra superior de las páginas internas, títulos |
| Tinta | `#0A0A0A` | Texto de lectura |
| Gris de apoyo | `#777777` | Texto secundario, estado Pendiente |
| Gris de pie | `#727271` | Pie de página y paneles laterales |
| Blanco | `#FFFFFF` | Fondo general |
| Superficie sutil | `rgba(0,0,0,0.04)` | Filas alternas, hover de tablas, tarjetas |
| Ámbar (derivado) | `#F2A900` | Por vencer |
| Rojo (derivado) | `#C62828` | Vencido |
| Verde oscuro (derivado) | `#3F7D1A` | Texto pequeño y enlaces sobre blanco |

**Tipografía.** Títulos y navegación en **Cabin** 700 (el título de página ronda los 40 px, los subtítulos los 25 px en peso 600, la navegación 16 px). Cuerpo en **Roboto** 400. Ambas están en Google Fonts. El sitio usa 18 px con interlineado de 32 px para lectura; en tablas y formularios del demo conviene bajar a 14–15 px.

**Componentes:**

- **Barra superior:** fondo negro, logo SCH a la izquierda (`logo1.png`, 350×108, hoja y globo en verde con la palabra SCH en gris) y navegación a la derecha en Cabin 700 blanco. El ítem activo va subrayado, como “Inicio” en el sitio.
- **Botón principal:** forma de pastilla (radio de 200 px), fondo verde de marca, texto blanco en Cabin 700. El botón “Conocenos” del sitio lleva una línea corta antes del texto: se puede repetir en el botón de la acción principal de cada pantalla.
- **Tarjetas de servicio:** en el sitio son recuadros con fotografía de fondo y el título en blanco, Cabin 600, con padding de 8 px × 16 px. En el demo, las tarjetas del tablero usan fondo negro o foto de follaje con velo oscuro y el número grande en blanco.
- **Títulos de sección:** Cabin 700 en negro con una línea muy fina, verde claro, debajo, como en “Servicios”.
- **Tablas y formularios:** fondo blanco, encabezados en Cabin 700, hover con superficie sutil, sin sombras. Radio de 4 px en campos (decisión del demo, no medida en el sitio).
- **Pie de página:** gris `#727271` con texto blanco y “© 2026 SCH Consultores Ambientales. Córdoba, Argentina.”
- **Forma general:** estilo plano, sin sombras ni degradados. El único redondeo marcado es la pastilla del botón.
- **Imagen:** fotografía de follaje de bosque, con velo, para la portada o el encabezado del tablero.
- **Voz:** español rioplatense, corto y cercano (el sitio dice “Conocenos”).

**Accesibilidad.** El verde de marca sobre blanco da un contraste de aproximadamente 3,1:1: sirve para fondos de botón con texto de 18 px en negrita o más, íconos y barras, pero no para texto chico. Para enlaces y texto pequeño sobre blanco, usar el verde oscuro derivado (alrededor de 5:1). El estado nunca se indica solo con color: lleva también un texto o un ícono.

```css
:root {
  --sch-green: #58a428;
  --sch-green-dark: #3f7d1a;
  --sch-mint: #20d89b;
  --sch-black: #000000;
  --sch-ink: #0a0a0a;
  --sch-muted: #777777;
  --sch-gray: #727271;
  --sch-surface: rgba(0, 0, 0, 0.04);
  --sch-amber: #f2a900;
  --sch-red: #c62828;
  --radius-pill: 200px;
  --radius-field: 4px;
  --font-head: 'Cabin', sans-serif;
  --font-body: 'Roboto', sans-serif;
}
```

## Stack sugerido y estructura

Para llegar a mañana, la prioridad es velocidad y un resultado que se vea cuidado, no una arquitectura final.

- **Aplicación:** Next.js (App Router) con TypeScript y Tailwind, más `lucide-react` para íconos y `date-fns` para fechas.
- **Datos:** un archivo `seed.ts` que genera los datos con fechas relativas y un estado en memoria persistido en `localStorage`. Un botón “Reiniciar datos de demo” vuelve al seed.
- **Reglas:** una función pura por regla en `lib/rules.ts` (estado del documento, semáforo, avance, recordatorios derivados), para poder probarlas sin interfaz.
- **Sin backend ni login** en esta versión. El selector de usuario es un menú.
- **Publicación:** Vercel, con un enlace privado para mostrar desde cualquier computadora.
- **Pantallas:** diseño responsive; se prueba en 1366×768 y en celular.
- **Después del demo:** pasar el estado a Supabase (el modelo ya está pensado para eso) y recién ahí sumar autenticación y archivos reales.

```text
/app
  layout.tsx            barra superior, fuentes, pie
  page.tsx              Tablero
  /clientes
    page.tsx            Lista de clientes
    /[id]/page.tsx      Ficha con pestañas
  /recordatorios/page.tsx
  /plan-anual/page.tsx
/components             Semaforo, EstadoDocumento, TarjetaIndicador, Stepper, VistaPreviaAviso
/lib
  seed.ts               datos ficticios con fechas relativas
  rules.ts              reglas de estados y recordatorios
  store.ts              estado y persistencia local
/styles/tokens.css      variables del sitio (ver guía de estilo)
```

## Guión de la demo y criterios de aceptación

**Guión de 10 minutos:**

| Minuto | Qué se muestra | Lo que se dice |
| --- | --- | --- |
| 0–1 | Tablero | “Esto es lo que hoy no ven sin abrir carpetas: qué vence, qué falta y qué avanza.” |
| 1–3 | Metalúrgica Ejemplo: ficha en rojo, documento vencido, “Pedir al cliente” y vista previa del aviso | “Así se pasa de enterarse tarde a avisar con anticipación.” |
| 3–5 | Loteo Los Algarrobos: seguimiento de licencia, avanzar una etapa, nota en la bitácora | “El cliente deja de preguntar cómo va lo suyo.” |
| 5–7 | Recordatorios: lista por semana y calendario | “Los vencimientos se calculan solos y llegan con tiempo.” |
| 7–9 | Plan anual de Alimentos del Centro | “Los servicios del año quedan planificados y se pueden ofrecer ordenados.” |
| 9–10 | Cierre | Preguntar: “¿Qué es lo que más falta acá y qué sobra?” |

**Criterios de aceptación:**

- [ ] Los cuatro indicadores del tablero se calculan desde los datos, no están escritos a mano.
- [ ] Cambiar la fecha de vigencia de un documento actualiza el semáforo del cliente y el tablero.
- [ ] “Pedir al cliente” abre una vista previa con todas las variables completas.
- [ ] Cada pantalla P0 funciona en 1366×768 y en celular, y carga en menos de un segundo.
- [ ] El botón “Reiniciar datos de demo” deja todo como al principio.
- [ ] No aparece ningún dato real de clientes de SCH.
- [ ] Los colores usados son los de la guía de estilo; no hay ninguno fuera de esa paleta.
- [ ] Todos los textos están en español rioplatense.
- [ ] Ninguna acción del demo envía mensajes ni guarda archivos de verdad.

## Supuestos, fuera de alcance y preguntas abiertas

**Supuestos:**

- Los documentos exactos que maneja SCH todavía no se confirmaron. El demo usa los que el sitio menciona y sus vigencias son de ejemplo.
- La demo se hace en una notebook y, si sobra tiempo, también en un celular.
- El demo se muestra a los tres socios, que son quienes tomarían la decisión.

**Fuera de alcance:**

- Envío real de mails o WhatsApp, inicio de sesión real y carga real de archivos.
- Cotejo automático de documentos (comparar un documento contra los requisitos del organismo). En el demo el estado del documento se cambia a mano; el cotejo automático queda como posible segunda fase, a confirmar con la guía de preguntas.
- Integración con las plataformas de los organismos.
- Facturación, cobranza y multiusuario.

**Preguntas abiertas:**

- [ ] ¿Se muestra la vista del cliente (P2) o se deja para una segunda reunión?
- [ ] ¿Se usa el logo real de SCH en la demo? Es su propio logo y la demo es solo para ellos, pero conviene que lo sepan.
- [ ] ¿Con qué nombre se presenta el sistema? Sugerencia provisoria: “SCH Gestión”.
- [ ] ¿Se muestra una cifra de ahorro de horas? Sin los datos del relevamiento, no hay base para una.
