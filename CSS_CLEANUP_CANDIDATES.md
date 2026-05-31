# Candidatos conservadores para limpieza CSS

**Fecha:** 2026-05-31
**Fuentes:** `CSS_AUDIT.md` y `CSS_USAGE_MAP.md`.
**Alcance:** clasificación documental previa a cualquier retirada. Este documento **no autoriza eliminar CSS**.

## 1. Criterio de clasificación

La auditoría advierte que el grafo activo acumula overrides, estados dinámicos, temas, media queries y `!important`. También indica que una coincidencia ausente en HTML/JS no demuestra por sí sola que una regla sea innecesaria: puede existir HTML generado, datos persistidos, especificidad heredada o una dependencia visual indirecta.

Se aplican estas categorías:

1. **Eliminable con seguridad:** evidencia suficiente para una limpieza documental sin efecto en la cascada. En esta revisión no se certifica todavía ninguna retirada de una regla CSS activa.
2. **Probablemente eliminable:** rama de selector o bloque aparentemente huérfano según el mapa estático. Requiere búsqueda puntual, comprobación de HTML generado y validación visual antes de tocar CSS.
3. **No tocar:** regla efectiva, estado funcional, zona crítica o duplicado cuya retirada pueda cambiar cascada, navegación, tema, responsive, tabla, modal o impresión.

> **Importante:** cuando una entrada probable pertenece a una regla agrupada, el candidato es únicamente la **rama de selector indicada**, no el bloque completo. Las ramas vecinas pueden seguir activas.

## 2. Eliminable con seguridad

### 2.1 Reglas CSS activas

**Ninguna por ahora.** Los dos informes no aportan evidencia suficiente para borrar una regla CSS activa sin una verificación adicional. `CSS_USAGE_MAP.md` trata los huérfanos como candidatos de investigación y `CSS_AUDIT.md` exige equivalencia visual antes de retirar declaraciones tapadas o duplicadas.

### 2.2 Limpieza documental segura, fuera de CSS efectivo

Estas entradas no son reglas ni declaraciones: son comentarios obsoletos y pueden corregirse sin alterar la cascada.

| Archivo | Selector o referencia | Motivo | Evidencia encontrada |
|---|---|---|---|
| `app/styles/60-overrides.css`:5 | comentario sobre `app/styles/80-light-foundation.css` | La hoja mencionada no existe ni se importa. | `CSS_AUDIT.md` identifica expresamente esta referencia documental obsoleta; `app/styles.css` importa 12 hojas y no incluye `80-light-foundation.css`. |
| `app/styles/60-overrides.css`:11 | comentario sobre `80-light-foundation.css` | Misma referencia inexistente. | Búsqueda estática de `80-light-foundation` en `app/styles/60-overrides.css`. |
| `app/styles/60-overrides.css`:2426 | comentario de estabilización de Tareas y Peticiones | Atribuye responsabilidad a una hoja ausente. | Búsqueda estática de `80-light-foundation` y sección 5.9 de `CSS_AUDIT.md`. |
| `app/styles/60-overrides.css`:2568 | comentario de estabilización visual común | Atribuye responsabilidad a una hoja ausente. | Búsqueda estática de `80-light-foundation` y sección 5.9 de `CSS_AUDIT.md`. |
| `app/styles/60-overrides.css`:3622 | comentario sobre capa final posterior a `70-components-final.css` | Describe un orden de carga que no existe. | `app/styles.css` no importa la hoja mencionada; sección 5.9 de `CSS_AUDIT.md`. |

## 3. Probablemente eliminable

Esta tabla es la cola inicial de validación. Se han priorizado selectores acotados y señales legibles; no se propone una eliminación masiva de todos los posibles huérfanos del mapa.

| Archivo | Selector candidato | Motivo | Evidencia encontrada |
|---|---|---|---|
| `app/styles/00-base.css`:1539 | `.history-open` dentro de `.session-columns.history-open` | Estado histórico aparentemente huérfano. | `CSS_USAGE_MAP.md` no encuentra HTML, JS, `classList` ni eventos para `.history-open`; riesgo estático **BAJO**. Validar sesiones antes de retirar. |
| `app/styles/10-layout.css`:590 | rama `.update-card` | Alias aparentemente huérfano en una regla agrupada de tarjetas. | El mapa no encuentra uso HTML/JS de `.update-card`; riesgo **BAJO**. No borrar las ramas vecinas `.minute-card`, `.telework-card`, `.agenda-card` ni `.session-card`. |
| `app/styles/10-layout.css`:523 | rama `.update-text` | Alias aparentemente huérfano en una regla agrupada de texto. | El mapa no encuentra uso HTML/JS de `.update-text`; riesgo **BAJO**. Mantener las ramas vecinas. |
| `app/styles/40-theme-dark.css`:137 | rama `.year-title` | Alias oscuro aparentemente huérfano. | El mapa no encuentra uso HTML/JS de `.year-title`; riesgo **BAJO**. Retirar, si procede, solo esta rama del selector `html[data-theme="dark"]`. |
| `app/styles/30-modules.css`:1588 | rama `.type-tag` | Alias aparentemente huérfano en coloración de etiquetas. | El mapa no encuentra uso HTML/JS de `.type-tag`; riesgo **BAJO**. Mantener `.module-tag` y ramas vecinas. |
| `app/styles/30-modules.css`:1852 | rama `.view-title` | Alias tipográfico aparentemente huérfano. | El mapa no encuentra uso HTML/JS de `.view-title`; riesgo **BAJO**. Mantener títulos activos y `h1`. |
| `app/styles/41-theme-light.css`:1650 | rama `.dashboard-home` | Alias de fondo claro aparentemente huérfano. | El mapa no encuentra uso HTML/JS de `.dashboard-home`; riesgo **BAJO**. Validar dashboard light antes de retirar solo esta rama. |
| `app/styles/50-module-extras.css`:1998 | `.dashboard-search-results` | Bloque aparentemente huérfano y acotado al buscador del dashboard. | El mapa no encuentra HTML, JS, `classList` ni eventos; riesgo **BAJO**. Validar búsquedas y HTML generado antes de retirar. |
| `app/styles/50-module-extras.css`:2016, 2030, 2103 | `.dashboard-search-result` y estados derivados | Familia aparentemente huérfana del buscador del dashboard. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Tratar la familia como unidad de investigación. |
| `app/styles/50-module-extras.css`:2036 | `.dashboard-search-badge` | Badge aparentemente huérfano. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Comprobar resultados generados dinámicamente. |
| `app/styles/50-module-extras.css`:2049 | `.dashboard-search-badge--committee` | Variante aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Comprobar resultados de Comité generados dinámicamente. |
| `app/styles/50-module-extras.css`:2055 | `.dashboard-search-badge--paritaria` | Variante aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Comprobar resultados de Paritaria generados dinámicamente. |
| `app/styles/50-module-extras.css`:2061, 2067, 2076 | `.dashboard-search-main` | Familia aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Comprobar HTML generado por el buscador. |
| `app/styles/50-module-extras.css`:2082, 2089, 2109 | `.dashboard-search-meta` | Familia aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Comprobar HTML generado por el buscador. |
| `app/styles/50-module-extras.css`:2246 | `.dashboard-timeline-badge--committee` | Variante aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Validar timeline dinámico de Comité. |
| `app/styles/50-module-extras.css`:2252 | `.dashboard-timeline-badge--paritaria` | Variante aparentemente huérfana. | El mapa no encuentra uso HTML/JS; riesgo **BAJO**. Validar timeline dinámico de Paritaria. |

### 3.1 Posibles huérfanos que deben permanecer fuera de la primera tanda

Aunque el mapa no detecta uso, estos selectores no deben ser los primeros en retirarse porque pertenecen a zonas que la auditoría congela:

| Archivo | Selector | Motivo para posponer | Evidencia encontrada |
|---|---|---|---|
| `app/styles/41-theme-light.css`:1536-1589 | `#teleworkRequestModal` y descendientes | Es un modal específico; los modales están congelados por riesgo operativo. | El mapa lo marca aparentemente huérfano con riesgo **BAJO**, pero `CSS_AUDIT.md` sección 7 congela aliases y modales específicos por ID. |
| `app/styles/41-theme-light.css`:200 | rama `.modal-overlay` | Es una rama de compatibilidad de modal. | El mapa no encuentra uso directo, pero `CSS_AUDIT.md` congela `.modal-backdrop`, `.modal-box`, aliases y modales específicos. |
| `app/styles/30-modules.css`:1661 | ramas `.config-modal` e `.import-preview-modal` | Son aliases de modal/backdrop agrupados con selectores activos. | El mapa no encuentra uso directo, pero la auditoría congela modales y exige comprobar HTML generado. |
| `app/styles/30-modules.css`:1326, 1674 | rama `.config-modal-content` | Es contenido de modal agrupado con aliases activos. | El mapa no encuentra uso directo, pero la retirada puede romper compatibilidad de modales. |

## 4. No tocar

### 4.1 Estados de navegación y visibilidad

| Archivo | Selector | Motivo | Evidencia encontrada |
|---|---|---|---|
| `app/styles/10-layout.css`:682 y 864 | `body.phase4-view-home #dashboardLayout` | Duplicado exacto, pero controla visibilidad de la vista home. | Ambas reglas declaran `display: none !important;`. `CSS_AUDIT.md` congela `.phase4-view-home`, `.phase4-view-module` y navegación. |
| `app/styles/10-layout.css`:884 y 1548 | `body.phase4-view-module .content-right > .module-card` | Duplicado exacto, pero controla visibilidad de módulos. | Ambas reglas declaran `display: none !important;`. La auditoría congela reglas de visibilidad. |
| Capas múltiples | `.open`, `.active`, `.hidden`, `.phase4-active-module`, `.is-collapsed`, `.is-expanded`, `.collapsed`, `.closed-open` | Estados funcionales y/o dinámicos. | `CSS_AUDIT.md` sección 7 los identifica expresamente como congelados; `CSS_USAGE_MAP.md` dedica atención especial a estados. |

### 4.2 Tablas operativas, columnas y acciones

Los siguientes duplicados exactos son ruido potencial, pero **no** forman parte de la primera limpieza: la auditoría congela tablas, `nth-child(...)`, overflow, acciones y Comité/Paritaria.

| Archivo | Selector | Motivo | Evidencia encontrada |
|---|---|---|---|
| `app/styles/60-overrides.css`:2491 y 2775 | `#gestor-vinculograma .vinculograma-table th:nth-child(1), ... td:nth-child(1)` | Duplicado exacto sobre anchura de columna operativa. | Ambas reglas aplican `width: 12% !important;`; validar tabla antes de cualquier retirada. |
| `app/styles/60-overrides.css`:2639 y 3589 | `#gestor-actas .rrll-pro-minutes-table th:nth-child(4), ... td:nth-child(4)` | Duplicado exacto sobre tabla de actas. | Ambas reglas aplican `width: 10% !important;`; la auditoría congela tablas y columnas. |
| `app/styles/60-overrides.css`:3158 y 3597 | `:is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table ... nth-child(2)` | Duplicado exacto en Comité/Paritaria. | Ambas reglas aplican `width: 12% !important;`; bloque de riesgo alto. |
| `app/styles/60-overrides.css`:3160 y 3599 | misma tabla, `nth-child(3)` | Duplicado exacto en Comité/Paritaria. | Ambas reglas aplican `width: 10% !important;`; bloque de riesgo alto. |
| `app/styles/60-overrides.css`:3162 y 3601 | misma tabla, `nth-child(4)` | Duplicado exacto en Comité/Paritaria. | Ambas reglas aplican `width: 11% !important;`; bloque de riesgo alto. |
| `app/styles/60-overrides.css`:3164 y 3603 | misma tabla, `nth-child(5)` | Duplicado exacto en Comité/Paritaria. | Ambas reglas aplican `width: 13% !important;`; bloque de riesgo alto. |
| `app/styles/60-overrides.css`:3168 y 3607 | misma tabla, `nth-child(7)` | Duplicado exacto en Comité/Paritaria. | Ambas reglas aplican `width: 12% !important;`; bloque de riesgo alto. |
| Capas múltiples | `.rrll-pro-table*`, `.rrll-pro-actions*`, filas y tarjetas con doble clic | Operativa, columnas, overflow y acciones de fila. | `CSS_AUDIT.md` secciones 5.4 y 7 exigen congelar estas zonas. |

### 4.3 Modales, temas, shell y componentes finales

| Archivo | Selector o bloque | Motivo | Evidencia encontrada |
|---|---|---|---|
| Capas múltiples | `.modal-backdrop`, `.modal-box`, `.rrll-modal*`, aliases y modales específicos por ID | Apertura/cierre y presentación operativa. | `CSS_AUDIT.md` sección 7 congela todos los modales. |
| `app/styles/40-theme-dark.css`, `app/styles/41-theme-light.css` | scrollbars universales y reglas de tema | Efecto transversal y posible compatibilidad por tema. | `CSS_AUDIT.md` secciones 5.6, 6 y 7 exige validación light/dark y scroll interno. |
| `app/styles/70-components-final.css` | inputs, `select`, `textarea`, labels, botones y tarjetas globales | Foundation tardía efectiva. | Se carga casi al final y afecta componentes compartidos; riesgo alto según la auditoría. |
| Capas múltiples | `.phase4-sidebar`, `.phase4-nav*`, `.phase4-main`, `.top-strip`, dashboard cards y widgets | Shell, responsive y navegación. | `CSS_AUDIT.md` congela sidebar/header/dashboard. |
| `app/styles/70-components-final.css`: bloque final de Especiales | `#gestor-especiales ...` | Presentación efectiva concentrada al final de la cascada. | `CSS_AUDIT.md` sección 5.8 exige mantener el bloque como unidad. |
| `app/styles/90-print.css` | reglas dentro de `@media print` | Impresión física no equivalente al preview en pantalla. | `CSS_AUDIT.md` sección 5.7 exige validar impresión física antes de retirar repeticiones. |

## 5. Orden recomendado para una limpieza futura

1. Corregir primero los cinco comentarios obsoletos sobre `80-light-foundation.css` en un commit exclusivamente documental.
2. Investigar de una a cinco ramas simples de la sección 3 por commit, empezando por `.history-open`, `.update-card`, `.update-text`, `.year-title` y `.type-tag`.
3. Para cada retirada futura: buscar el selector en todo el proyecto, revisar HTML generado en JS y datos persistidos, comparar computed styles antes/después y recorrer ambos temas.
4. Validar después la familia completa `.dashboard-search-*` y `.dashboard-timeline-*` con búsquedas y timeline reales antes de eliminarla como unidad.
5. Mantener congelada la sección 4 hasta disponer de comprobación visual específica por módulo, responsive, modales e impresión.
6. Regenerar `CSS_USAGE_MAP.md` después de cada tanda aceptada para conservar trazabilidad.

## 6. Resultado de esta revisión

- **Reglas CSS activas eliminables con seguridad:** ninguna certificada todavía.
- **Limpieza documental segura:** cinco comentarios obsoletos.
- **Primera cola probable de validación:** 16 entradas acotadas.
- **Zonas expresamente congeladas:** estados, navegación, modales, tablas, acciones, shell, temas, Especiales e impresión.
