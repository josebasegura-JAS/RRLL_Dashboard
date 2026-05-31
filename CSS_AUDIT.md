# Auditoría conservadora del CSS activo

**Fecha de auditoría:** 2026-05-31
**Alcance:** diagnóstico estático de la app Electron/HTML/JS, sin cambios de CSS, HTML, JavaScript, base de datos, `main.js` ni `preload.js`.
**Objetivo:** congelar el estado real de la cascada y definir una limpieza incremental, comprobable y reversible. Este documento no autoriza una refactorización masiva.

## 1. Resumen ejecutivo

La aplicación tiene una única entrada CSS activa: `app/dashboard.html` carga `app/styles.css`, que importa 12 hojas modulares. La cascada está funcional, pero presenta deuda técnica acumulada: capas históricas, normalización tardía, componentes finales, reglas globales y parches por módulo conviven en orden sucesivo. El resultado es estable por acumulación de overrides, no porque cada responsabilidad esté aislada.

La auditoría estática contabiliza:

- **22.971 líneas** en el grafo CSS activo, incluido el agregador.
- **5.128 apariciones de `!important`**.
- **2.447 grupos aproximados de selectores únicos** y **295 grupos de selectores exactos repetidos**, con **472 apariciones adicionales** sobre la primera definición.
- Reglas de alto impacto al final de la cascada para `body`, inputs, `select`, `textarea`, botones, labels, tarjetas, tablas, modales y scrollbars.
- Referencias documentales obsoletas dentro de `app/styles/60-overrides.css` a `app/styles/80-light-foundation.css`, hoja que **no existe** ni está importada por `app/styles.css`.

### Conclusión general

No conviene eliminar CSS todavía. La prioridad es crear una matriz de comprobación visual y registrar, por bloque, cuál es la regla efectiva antes de mover o borrar declaraciones. En particular, no se debe empezar por `60-overrides.css`, `70-components-final.css`, los selectores de visibilidad `.open` / `.active` / `.hidden`, las tablas operativas ni los bloques de Comité/Paritaria.

El primer commit seguro es exclusivamente documental: añadir este archivo. No se elimina ni mueve ninguna regla.

## 2. Método y límites de la auditoría

Se revisaron:

1. El `<link>` activo de `app/dashboard.html`.
2. El orden de `@import` de `app/styles.css`.
3. El tamaño de cada hoja y el número de apariciones de `!important`.
4. Repeticiones exactas de bloques de selector mediante un escaneo estático conservador.
5. Selectores globales y reglas tardías de normalización/finalización.
6. Usos de IDs, clases dinámicas, `classList`, `onclick`, `ondblclick`, `addEventListener("dblclick", ...)`, `closest(...)` y selectores DOM en HTML/JS.
7. Las áreas críticas: tareas, peticiones, especiales, comité, paritaria, actas, teletrabajo, modales, tablas, botones de acción, sidebar, header y dashboard.

### Limitaciones

El conteo de selectores es una **señal de auditoría**, no una prueba suficiente para borrar reglas. CSS admite media queries, selectores agrupados, especificidad, herencia y estados dinámicos. Un selector repetido puede ser intencional por responsive, tema o compatibilidad. Antes de eliminar una regla hay que verificar su contexto, buscar su uso en todo el proyecto y comprobar visualmente ambos temas y resoluciones relevantes.

## 3. Grafo y orden de carga activo

`app/dashboard.html` carga `styles.css`. El orden efectivo está definido por `app/styles.css` y debe permanecer congelado durante las primeras fases:

| Orden | Archivo | Líneas | `!important` | Papel observado |
|---:|---|---:|---:|---|
| 1 | `app/styles/00-base.css` | 2.019 | 60 | Base heredada, estilos iniciales y compatibilidad antigua. |
| 2 | `app/styles/01-variables.css` | 403 | 0 | Tokens y aliases semánticos; es la capa más apta para documentación y consolidación futura. |
| 3 | `app/styles/10-layout.css` | 1.840 | 297 | Layout, navegación y múltiples revisiones históricas del shell. |
| 4 | `app/styles/20-components.css` | 640 | 176 | Componentes intermedios y correcciones visuales. |
| 5 | `app/styles/30-modules.css` | 2.252 | 573 | Reglas de módulos y estilos generales de componentes operativos. |
| 6 | `app/styles/40-theme-dark.css` | 1.469 | 439 | Tema oscuro, con overrides globales y scrollbars. |
| 7 | `app/styles/41-theme-light.css` | 2.222 | 799 | Tema claro, muy cargado de overrides. |
| 8 | `app/styles/50-module-extras.css` | 2.685 | 885 | Extensiones y parches por módulo/dashboard/sidebar. |
| 9 | `app/styles/60-overrides.css` | 4.955 | 1.434 | Legacy y estabilización acumulada; capa de mayor riesgo. |
| 10 | `app/styles/65-normalize.css` | 213 | 3 | Normalización tardía de tipografía, formularios, botones, tablas y modales. |
| 11 | `app/styles/70-components-final.css` | 4.241 | 458 | Foundation/finalización tardía; afecta componentes globales y módulos concretos. |
| 12 | `app/styles/90-print.css` | 14 | 4 | Excepción final exclusiva de impresión física. |

**Observación:** el nombre numérico describe la intención de carga, pero no garantiza aislamiento. Varias hojas tempranas y tardías vuelven a definir sidebar, shell, botones, campos, tablas y componentes compartidos.

## 4. Archivos ordenados de más problemático a menos problemático

La clasificación prioriza riesgo de regresión y dificultad de demostrar equivalencia, no solo número bruto de líneas.

| Prioridad | Archivo | Nivel | Motivo |
|---:|---|---|---|
| 1 | `app/styles/60-overrides.css` | Alto | Es la hoja más grande y contiene 1.434 `!important`, ajustes de layout, visibilidad, sidebar, tablas y bloques compactos de Comité/Paritaria. También conserva comentarios que apuntan a una hoja `80-light-foundation.css` ausente. Congelar. |
| 2 | `app/styles/70-components-final.css` | Alto | Se carga casi al final y aplica foundations tardías a componentes globales, formularios, botones, labels, tablas, modales y scrollbars. Además contiene la foundation específica de Especiales. Congelar salvo correcciones muy acotadas. |
| 3 | `app/styles/50-module-extras.css` | Alto | Tiene 885 `!important`; mezcla dashboard, sidebar, sincronización y extras de módulos. Puede solaparse con `60-overrides.css` y temas. |
| 4 | `app/styles/41-theme-light.css` | Alto | Tiene 799 `!important`; contiene overrides extensos del tema claro y reglas globales de scrollbar. Cualquier limpieza exige prueba visual light completa. |
| 5 | `app/styles/30-modules.css` | Alto | Tiene 573 `!important`; concentra módulos, tablas, impresión previa y reglas globales de scrollbar. Puede afectar pantallas operativas. |
| 6 | `app/styles/40-theme-dark.css` | Medio-alto | Tiene 439 `!important`; el tema dark redefine componentes y scrollbars globales en varios puntos. |
| 7 | `app/styles/10-layout.css` | Medio-alto | El mismo sidebar aparece repetido numerosas veces; también hay múltiples revisiones de layout y responsive. Cambiarlo puede afectar navegación y visibilidad de módulos. |
| 8 | `app/styles/20-components.css` | Medio | Es más corto, pero usa 176 `!important` y contiene definiciones intermedias de componentes, impresión y scrollbars que pueden quedar tapadas más tarde. |
| 9 | `app/styles/65-normalize.css` | Medio | Tiene pocos `!important`, pero su posición tardía amplifica el alcance: normaliza selectores globales y clases compartidas. No usar como contenedor de nuevos parches. |
| 10 | `app/styles/00-base.css` | Medio-bajo | Es base heredada. Algunas reglas probablemente están tapadas, pero no se deben borrar sin matriz de equivalencia porque aún sirven como fallback. |
| 11 | `app/styles/90-print.css` | Medio-bajo | Pequeño y acotado a `@media print`. No tocar sin validar impresión física y preview. |
| 12 | `app/styles/01-variables.css` | Bajo | Sin `!important`; es la fuente principal de tokens. Aun así, cambiar valores puede tener alcance global, por lo que solo debe modificarse con inventario de consumidores. |

## 5. Duplicidades y conflictos relevantes

### 5.1 Sidebar, header y dashboard

**Riesgo: alto.**

- `.phase4-sidebar` aparece en **14 bloques exactos de selector** distribuidos entre `10-layout.css`, `20-components.css`, `30-modules.css`, `41-theme-light.css`, `50-module-extras.css` y `60-overrides.css`. Se redefinen ancho, overflow, padding, fondo, borde, sombras y comportamiento responsive.
- `.phase4-nav` aparece al menos 5 veces; hay una declaración idéntica `gap: 4px !important` repetida en `41-theme-light.css` y `50-module-extras.css`.
- `.phase4-main main` aparece en 9 bloques; `.phase4-main .top-strip` aparece en 6; `.top-strip` aparece en 5. El padding efectivo depende de la posición y del viewport.
- `.phase4-sidebar-brand` aparece en varias capas y termina oculto en `60-overrides.css` mediante `display`, `visibility`, altura, padding y overflow con `!important`.

**Acción segura posterior:** construir una tabla de propiedad efectiva por resolución antes de consolidar. No retirar todavía el bloque que oculta branding ni mover reglas responsive.

### 5.2 Visibilidad de vistas y módulos

**Riesgo: alto.**

- `body.phase4-view-module .content-right` aparece en 9 bloques.
- `body.phase4-view-module .content-right > .module-card.phase4-active-module` aparece en 8 bloques.
- Hay reglas repetidas para ocultar `.module-card` y mostrar exclusivamente `.phase4-active-module`.
- La navegación JS añade y retira clases de estado como `phase4-view-home`, `phase4-view-module`, `phase4-active-module`, `active`, `open`, `hidden`, `is-collapsed` y `is-expanded`.

**Acción segura posterior:** no tocar estos selectores hasta ejecutar pruebas de navegación completas. Aunque parezcan redundantes, participan en la visibilidad funcional.

### 5.3 Modales

**Riesgo: alto.**

- `.modal-backdrop`, `.modal-box`, `.modal-actions` y aliases RRLL reciben estilos desde base, normalize y finalización.
- La visibilidad se controla dinámicamente con `.open`; múltiples módulos hacen `classList.add("open")` y `classList.remove("open")`.
- Existen modales específicos para tareas, peticiones, actas, teletrabajo, Comité, Paritaria, búsqueda, configuración, papelera, preview de impresión y otros módulos.

**Acción segura posterior:** no consolidar aliases ni retirar selectores de backdrop/box sin probar apertura, cierre por backdrop, cierre por botón, scroll interno, foco y contenido largo.

### 5.4 Tablas, acciones y doble clic

**Riesgo: alto.**

- Tablas y acciones comparten `.rrll-pro-table`, `.rrll-pro-table-wrap`, `.rrll-pro-actions`, `.rrll-pro-list-actions`, botones e icon buttons.
- Las filas de tareas, peticiones, actas, teletrabajo, plantilla, criterios, ticket restaurante, licencias y vinculograma usan doble clic o handlers asociados a fila.
- Comité y Paritaria enlazan doble clic mediante `addEventListener` en tarjetas/tablas y marcan bindings con `dataset`.
- Los bloques de Comité/Paritaria en `60-overrides.css` redefinen anchos por `nth-child(...)` varias veces. Hay duplicados exactos y también contradicciones posteriores: por ejemplo, anchos de columnas que pasan de `12/10/11/13/...` a otros porcentajes posteriores.

**Acción segura posterior:** no tocar todavía alturas de fila, wrapping, overflow, `pointer-events`, display de acciones ni anchos operativos. El primer saneamiento de tablas debe limitarse a duplicados exactos demostrados con computed styles y prueba manual de doble clic.

### 5.5 Temas claro y oscuro; scrollbars globales

**Riesgo: medio-alto.**

- `html[data-theme="dark"] *` y pseudo-elementos de scrollbar se redefinen en `40-theme-dark.css` y `70-components-final.css`.
- `html[data-theme="light"] *` y pseudo-elementos de scrollbar se redefinen en `41-theme-light.css`, `60-overrides.css` y `70-components-final.css`.
- `70-components-final.css` incluye selectores por fragmentos de `style` inline para corregir superficies en modo light. Esto es una señal de compatibilidad acumulada y una dependencia frágil.

**Acción segura posterior:** inventariar primero los estilos inline generados por HTML/JS. No eliminar selectores `[style*="..."]` ni reglas universales de scrollbar sin comparar ambos temas.

### 5.6 Normalización y foundation tardías

**Riesgo: medio-alto.**

- `65-normalize.css` normaliza tipografía de `body`, botones, campos, tablas, items guardados y modales casi al final.
- `70-components-final.css` vuelve a aplicar reglas comunes mediante `:is(...)` a tarjetas, headers, formularios, labels, inputs, botones y variantes primarias/danger/excel.
- El selector tardío de botones incluye `button[class*="primary"]`, que tiene alcance amplio.
- Los selectores tardíos de inputs abarcan casi todos los `input` salvo checkbox/radio/color, además de `select` y `textarea`.

**Acción segura posterior:** no reducir `!important` en estas zonas hasta identificar qué capas tempranas compiten con ellas. Primero medir computed styles representativos.

### 5.7 Impresión

**Riesgo: medio.**

- `.print-preview-content *` y `.print-preview-content th` aparecen en hojas previas y la excepción final de `90-print.css` fuerza documentos blancos dentro de `@media print`.

**Acción segura posterior:** diferenciar preview en pantalla de impresión física. No considerar redundante una regla solo porque se repite fuera y dentro de `@media print`.

### 5.8 Especiales

**Riesgo: medio.**

- Especiales está concentrado en la parte final de `70-components-final.css`, con selectores acotados por `#gestor-especiales`.
- La concentración es positiva, pero la posición final significa que define la presentación efectiva del módulo.

**Acción segura posterior:** mantener este bloque como unidad. No extraer reglas comunes hasta comparar visualmente drop zone, preview, warnings, destinatarios, tabla y acciones.

### 5.9 Comentarios obsoletos sobre una capa ausente

**Riesgo de limpieza: bajo. Riesgo operativo inmediato: bajo.**

`app/styles/60-overrides.css` menciona repetidamente `app/styles/80-light-foundation.css` como capa final, pero `app/styles.css` no la importa y el fichero no existe. Estos comentarios pueden inducir a borrar reglas creyendo que otra hoja las cubre.

**Acción segura posterior:** corregir únicamente los comentarios en un commit documental separado, después de confirmar el historial esperado. No borrar las reglas asociadas.

## 6. Abuso de `!important`

Total auditado: **5.128** apariciones.

| Archivo | `!important` | Densidad aproximada por línea |
|---|---:|---:|
| `60-overrides.css` | 1.434 | 28,9 % |
| `50-module-extras.css` | 885 | 32,9 % |
| `41-theme-light.css` | 799 | 35,9 % |
| `30-modules.css` | 573 | 25,4 % |
| `70-components-final.css` | 458 | 10,8 % |
| `40-theme-dark.css` | 439 | 29,9 % |
| `10-layout.css` | 297 | 16,1 % |
| `20-components.css` | 176 | 27,5 % |
| `00-base.css` | 60 | 3,0 % |
| `90-print.css` | 4 | 26,7 % |
| `65-normalize.css` | 3 | 1,4 % |
| `01-variables.css` | 0 | 0,0 % |

### Interpretación

El problema no es únicamente el volumen: `!important` está presente en varias capas sucesivas. Por tanto, retirar una declaración aislada puede activar una regla antigua tapada y cambiar el aspecto de forma no obvia. La reducción debe hacerse por componente, con captura de computed styles antes/después y pruebas visuales en light/dark.

## 7. Reglas y zonas que no conviene tocar todavía

### Congelar por riesgo alto

1. Selectores de visibilidad y navegación: `.open`, `.active`, `.hidden`, `.phase4-active-module`, `.phase4-view-home`, `.phase4-view-module`, `.is-collapsed`, `.is-expanded`, `.collapsed`, `.closed-open` y clases equivalentes usadas desde JS.
2. `.modal-backdrop`, `.modal-box`, aliases de modales y modales específicos por ID.
3. `.rrll-pro-table`, wraps de tabla, acciones de fila, botones de acción, `nth-child(...)` de columnas y reglas de overflow responsive.
4. Filas y tarjetas con doble clic; clases relacionadas con tareas, peticiones, actas, teletrabajo, Comité y Paritaria.
5. Sidebar/header/dashboard: `.phase4-sidebar`, `.phase4-nav*`, `.phase4-main`, `.top-strip`, dashboard cards y widgets de sincronización.
6. Reglas globales tardías de `70-components-final.css` para inputs, `select`, `textarea`, labels, botones y tarjetas.
7. Scrollbars universales por tema y selectores `[style*="..."]` de compatibilidad light.
8. `90-print.css` hasta validar impresión física.
9. Bloque foundation de Especiales en `70-components-final.css` hasta completar su prueba visual específica.

### Candidatos iniciales, solo después de verificación

1. Comentarios obsoletos sobre `80-light-foundation.css`.
2. Duplicados exactos sin cambio de contexto ni media query, por ejemplo algunos `gap`, `resize: vertical`, scrollbar sizes y porcentajes idénticos repetidos dentro de `60-overrides.css`.
3. Declaraciones tapadas para las que se demuestre: mismo selector, mismo contexto, mismo valor efectivo, ninguna dependencia JS y equivalencia visual en ambos temas.

## 8. Clasificación de riesgo por bloque problemático

| Bloque | Riesgo | Decisión actual |
|---|---|---|
| Comentarios obsoletos de `80-light-foundation.css` | Bajo | Corregibles documentalmente en un commit separado. |
| Duplicados exactos simples, sin estados ni responsive | Bajo | Preparar lista; retirar solo uno por commit y con comparación before/after. |
| Tokens y aliases documentales de `01-variables.css` | Bajo | Documentar; no cambiar valores globales todavía. |
| Base heredada tapada por capas finales | Medio | Limpiar únicamente tras demostrar equivalencia efectiva. |
| Normalización tipográfica y de controles | Medio | Requiere prueba visual de todos los módulos y modales. |
| Temas y scrollbars universales | Medio-alto | Requiere prueba light/dark, viewport y scroll interno. |
| Especiales foundation final | Medio | Mantener unido; revisar visualmente antes de extraer comunes. |
| Sidebar/header/dashboard | Alto | Congelar por navegación, responsive y estados dinámicos. |
| Visibilidad de módulos y navegación | Alto | No tocar: afecta comportamiento visible. |
| Modales | Alto | No tocar: afecta apertura/cierre y uso operativo. |
| Tablas, acciones, columnas y overflow | Alto | No tocar todavía: afecta legibilidad, botones y doble clic. |
| Comité/Paritaria compacto y sesiones | Alto | No tocar: alta densidad de overrides y handlers dinámicos. |

## 9. Plan seguro por fases

### Fase 1 — Documentación y mapa CSS

**Objetivo:** congelar conocimiento sin cambiar UI.

- Mantener el orden de imports.
- Incorporar esta auditoría y enlazarla desde `CSS_ARCHITECTURE.md` en un commit posterior si se desea.
- Crear una matriz de pantallas × tema × viewport × estado.
- Registrar computed styles de muestras representativas: shell, sidebar, top strip, un modal, una tabla, un botón primario/secundario/danger, acciones de fila e inputs.
- Inventariar reglas por módulo y marcar cuáles dependen de estados JS.
- Confirmar históricamente si `80-light-foundation.css` fue retirado o nunca se añadió.

**Criterio de salida:** existe baseline visual reproducible y lista de reglas candidatas, sin cambios CSS.

### Fase 2 — Eliminar duplicados evidentes

**Objetivo:** reducir ruido sin cambiar reglas efectivas.

- Trabajar de uno a cinco duplicados exactos por commit.
- Priorizar duplicados simples dentro de la misma hoja o duplicados tardíos cuyo contexto sea idéntico.
- Evitar inicialmente visibilidad, modales, botones, tablas, sidebar, responsive, impresión, temas y `[style*=...]`.
- Para cada retirada, documentar selector, ubicaciones, regla ganadora y pruebas realizadas.

**Criterio de salida:** diff pequeño y reversible; computed styles y checklist visual sin diferencias.

### Fase 3 — Mover estilos repetidos a componentes comunes

**Objetivo:** centralizar solo patrones ya demostrados equivalentes.

- Elegir un componente por iteración: por ejemplo, campos, badges o botones secundarios no críticos.
- Definir ownership claro entre `20-components.css`, `65-normalize.css` y `70-components-final.css` antes de mover nada.
- Mantener aliases existentes mientras se migra; no renombrar clases en masa.
- Separar componentes visuales de estados funcionales controlados por JS.

**Criterio de salida:** un componente consolidado por commit, con prueba visual completa.

### Fase 4 — Reducir `!important`

**Objetivo:** disminuir especificidad accidental sin despertar reglas heredadas.

- Empezar solo en componentes ya consolidados en Fase 3.
- Retirar `!important` declaración por declaración, nunca por búsqueda/reemplazo global.
- Comprobar computed styles light/dark y resoluciones relevantes.
- No empezar por `60-overrides.css`; reducir primero en áreas con ownership claro.

**Criterio de salida:** cada reducción tiene regla ganadora conocida y evidencia de equivalencia.

### Fase 5 — Consolidar estilos por módulos

**Objetivo:** aislar deuda específica después de estabilizar comunes.

Orden recomendado:

1. Especiales, porque ya está mayormente acotado por `#gestor-especiales`.
2. Actas.
3. Teletrabajo.
4. Tareas y Peticiones como pareja, debido a patrones compartidos y filas interactivas.
5. Comité y Paritaria al final, por su complejidad, subgestores, sesiones, tablas y doble clic.

Para cada módulo:

- Buscar usos HTML/JS antes de tocar clases.
- No modificar lógica JS.
- Mantener IDs y clases enlazadas a handlers.
- Probar CRUD visual, filtros, tabla/lista, acciones, modal y doble clic.

**Criterio de salida:** estilos del módulo localizados sin alterar comportamiento ni diseño general.

### Fase 6 — Limpieza final estable

**Objetivo:** retirar compatibilidad obsoleta solo cuando ya exista evidencia.

- Revisar reglas tapadas de `00-base.css`, `10-layout.css` y capas legacy.
- Actualizar comentarios y arquitectura final.
- Evaluar si `60-overrides.css` puede reducirse o dividirse.
- Mantener `90-print.css` aislado.
- No cambiar el orden de imports salvo una tarea específica con validación completa.

**Criterio de salida:** cascada explicable, reversible y respaldada por pruebas.

## 10. Primer commit recomendado

### Commit seguro inmediato

**Mensaje sugerido:**

```text
docs(css): add conservative CSS audit and cleanup plan
```

**Contenido:** añadir exclusivamente `CSS_AUDIT.md`.

### Qué no incluir

- No eliminar CSS todavía.
- No corregir todavía comentarios dentro de `60-overrides.css`; conviene hacerlo en un segundo commit documental para mantener este baseline puro.
- No cambiar imports.
- No añadir TODOs dentro de hojas críticas si no son imprescindibles.
- No tocar HTML, JS, base de datos, Electron, preload ni main.

## 11. Checklist manual después de cada fase

Ejecutar como mínimo en tema claro y oscuro. Repetir en viewport normal y estrecho cuando la fase toque layout, sidebar, tablas o responsive.

### Arranque y navegación

- [ ] La app arranca sin errores visibles.
- [ ] Inicio/dashboard carga con métricas, calendario, buscador y tarjetas.
- [ ] Sidebar mantiene grupos desplegables y navegación a cada gestor.
- [ ] Header/top strip conserva alineación, logo, título y fecha.
- [ ] Volver a Inicio funciona desde un módulo.
- [ ] Cambiar de tema light/dark no deja textos ilegibles ni superficies incorrectas.

### Tareas

- [ ] Abrir Gestión de tareas.
- [ ] Crear/expandir formulario sin saltos de layout.
- [ ] Probar filtros, búsqueda y ordenación de columnas.
- [ ] Clic simple despliega detalle de fila.
- [ ] Doble clic abre edición.
- [ ] Botones de acción funcionan sin activar accidentalmente el doble clic.
- [ ] Abrir/cerrar modal de actualización y revisar scroll interno.

### Peticiones

- [ ] Abrir Peticiones.
- [ ] Probar formulario, filtros, búsqueda y pestañas.
- [ ] Clic simple despliega detalle.
- [ ] Doble clic abre edición.
- [ ] Botones de acción de fila funcionan sin propagación accidental.
- [ ] Abrir/cerrar modal de actualización.

### Especiales

- [ ] Abrir Especiales.
- [ ] Revisar drop zone MSG, preview y estados/warnings.
- [ ] Revisar grid de destinatarios, tabla y botones de acción.
- [ ] Confirmar que textos largos no desbordan.

### Comité

- [ ] Navegar a Puntos de Comité y Sesiones de Comité.
- [ ] Expandir/cerrar subsecciones.
- [ ] Revisar tabla, filtros, acciones y anchos de columnas.
- [ ] Probar doble clic en fila/tarjeta y modal de orden.
- [ ] Abrir/cerrar modales de actualizar, seleccionar sesión, añadir punto y cerrar sesión.

### Paritaria

- [ ] Navegar a Puntos Paritaria y Sesiones Paritaria.
- [ ] Expandir/cerrar subsecciones.
- [ ] Revisar tabla, filtros, acciones y anchos de columnas.
- [ ] Probar doble clic en fila/tarjeta y modal de orden.
- [ ] Abrir/cerrar modales de actualizar, seleccionar sesión, añadir punto y cerrar sesión.

### Actas

- [ ] Abrir Actas.
- [ ] Revisar formulario, tabla, columnas y botones.
- [ ] Probar doble clic de edición.
- [ ] Abrir/cerrar modal de alegaciones y modal de edición.

### Teletrabajo

- [ ] Abrir Teletrabajo.
- [ ] Revisar cards/listas, histórico, filtros y tabla.
- [ ] Probar doble clic de edición en tarjeta y filas.
- [ ] Abrir/cerrar edición, importación y catálogo de puestos.
- [ ] Revisar scroll y tabla del catálogo.

### Modales transversales

- [ ] Abrir Configuración, Papelera, búsqueda y preview de impresión.
- [ ] Cerrar por botón y por backdrop donde corresponda.
- [ ] Confirmar que el contenido largo hace scroll sin ocultar acciones.
- [ ] Confirmar contraste y bordes en light/dark.

### Tablas y botones de acción

- [ ] Revisar cabeceras, hover, filas alternas, badges y wrapping.
- [ ] Confirmar que no desaparecen columnas ni acciones.
- [ ] Confirmar que overflow horizontal aparece cuando es necesario.
- [ ] Probar botones primary, secondary, danger, icon y excel donde existan.
- [ ] Confirmar que icon buttons conservan tamaño y área clicable.

### Impresión

- [ ] Abrir preview de impresión.
- [ ] Revisar tabla y cabeceras en preview.
- [ ] Ejecutar impresión física/PDF y confirmar fondo blanco y texto legible.

## 12. Checklist técnico por commit de limpieza futuro

- [ ] Buscar el selector en todo el proyecto antes de editarlo.
- [ ] Buscar clases/IDs relacionados en JS y HTML.
- [ ] Confirmar si el selector participa en `onclick`, `ondblclick`, `addEventListener`, `classList`, `closest`, `matches` o `dataset`.
- [ ] Registrar selector, ubicación original, ubicación ganadora y computed style before/after.
- [ ] Mantener el diff pequeño y reversible.
- [ ] No mezclar documentación, consolidación y reducción de `!important` en el mismo commit.
- [ ] Ejecutar checklist manual proporcional al bloque tocado.
- [ ] Si hay duda sobre uso o equivalencia, conservar la regla.
