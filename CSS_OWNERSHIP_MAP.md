# Mapa de ownership CSS

**Fecha:** 2026-05-31
**Alcance:** documentación del estado actual de la cascada. No modifica CSS, HTML, JavaScript, imports ni nombres de archivo.
**Objetivo:** fijar una frontera de ownership futura por bloque visual antes de limpiar, mover reglas o reducir `!important`.

## 1. Cómo leer este mapa

La aplicación carga una sola entrada, `app/styles.css`, desde `app/dashboard.html`. El orden efectivo de la cascada es:

| Orden | Hoja |
|---:|---|
| 1 | `app/styles/00-base.css` |
| 2 | `app/styles/01-variables.css` |
| 3 | `app/styles/10-layout.css` |
| 4 | `app/styles/20-components.css` |
| 5 | `app/styles/30-modules.css` |
| 6 | `app/styles/40-theme-dark.css` |
| 7 | `app/styles/41-theme-light.css` |
| 8 | `app/styles/50-module-extras.css` |
| 9 | `app/styles/60-overrides.css` |
| 10 | `app/styles/65-normalize.css` |
| 11 | `app/styles/70-components-final.css` |
| 12 | `app/styles/90-print.css` |

En cada bloque, **archivos que intervienen** mantiene ese orden de carga y omite hojas sin reglas relevantes. **Domina actualmente** no significa que toda declaración efectiva viva en una sola hoja: identifica la última capa con peso material y avisa cuando el resultado sigue siendo mixto por especificidad, `!important`, responsive o tema. **Owner futuro** es el destino conceptual; este documento no autoriza todavía ningún movimiento.

### Principios de ownership futuro

- `01-variables.css`: tokens, colores, espaciados, sombras, radios y aliases semánticos.
- `10-layout.css`: shell, sidebar, header, top strip, layout principal y responsive estructural.
- `20-components.css`: componentes reutilizables simples que no pertenezcan a las familias finales.
- `30-modules.css`: reglas propias de módulos operativos.
- `40-theme-dark.css` y `41-theme-light.css`: únicamente overrides de tema que no puedan resolverse con tokens.
- `50-module-extras.css`: capa transitoria que debería tender a vaciarse.
- `60-overrides.css`: deuda técnica congelada; no es owner futuro salvo excepción documentada.
- `65-normalize.css`: normalización transversal mínima; no debe recibir nuevos parches.
- `70-components-final.css`: owner de componentes consolidados comunes, especialmente modales, botones, tablas, formularios y superficies.
- `90-print.css`: impresión física exclusivamente.

### Regla de seguridad global

No borrar, mover, renombrar ni reordenar reglas con este mapa como única evidencia. Antes de cualquier consolidación se deben capturar `computed styles`, comparar tema claro y oscuro, probar viewport ancho y estrecho y completar la checklist específica del bloque. Los estados dinámicos, Comité, Paritaria, tablas operativas, modales, `60-overrides.css` y `70-components-final.css` **no deben tocarse todavía**.

## 2. Mapa por bloque

### 2.1 Sidebar

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `.phase4-sidebar`, `.phase4-sidebar-brand`, `.phase4-nav`, `.phase4-nav-group`, `.phase4-nav-group-toggle`, `.phase4-nav-submenu`, `.phase4-nav-item`, `.phase4-nav-item.active`, `.is-collapsed`, `.is-expanded`. |
| Domina actualmente | Mixto: `70-components-final.css` es la última capa general, pero `60-overrides.css` conserva decisiones funcionales como la ocultación del branding y varias capas previas conservan responsive y estados. |
| Owner futuro | `10-layout.css` para geometría, responsive y estructura; `70-components-final.css` solo para controles reutilizables; tokens en `01-variables.css`. |
| Riesgo | **ALTO**. |
| Motivo | `.phase4-sidebar` y navegación se redefinen en muchas capas; ancho, overflow, padding, sombras, branding y colapso dependen de cascada y viewport. |
| Notas de seguridad | **No tocar todavía.** No retirar la ocultación del branding, no mover media queries y no consolidar estados de grupo hasta medir resolución ancha y estrecha. |
| Checklist mínima | [ ] Ver sidebar en claro/oscuro. [ ] Probar viewport ancho y estrecho. [ ] Abrir/cerrar grupos. [ ] Cambiar de módulo y volver a inicio. [ ] Confirmar estado activo. [ ] Verificar que branding, scroll y contenido principal no saltan. |

### 2.2 Header / top strip

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `.phase4-main`, `.phase4-main main`, `.phase4-main .top-strip`, `.top-strip`, `.top-strip-left`, `.top-strip-actions`, `.top-strip-title`, headers de tarjetas y módulos. |
| Domina actualmente | `70-components-final.css` para acabado tardío, con geometría todavía repartida entre `10-layout.css` y overrides posteriores. |
| Owner futuro | `10-layout.css` para estructura y responsive; `70-components-final.css` para controles compartidos dentro del strip. |
| Riesgo | **ALTO**. |
| Motivo | El padding efectivo y el encaje con sidebar/main cambian por posición y viewport; header y top strip tienen redefiniciones tardías. |
| Notas de seguridad | **No tocar todavía** junto con el shell. Evitar convertir ajustes locales en globales sin capturas comparativas. |
| Checklist mínima | [ ] Revisar título, acciones y alineación. [ ] Cambiar entre inicio y módulos. [ ] Probar viewport ancho/estrecho. [ ] Verificar claro/oscuro. [ ] Confirmar que no hay solape con sidebar ni scroll horizontal inesperado. |

### 2.3 Dashboard

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `.dashboard-layout`, `.dashboard-home`, `.dashboard-grid`, `.dashboard-card`, `.dashboard-card-header`, `.dashboard-card-body`, `.content-right`, `.module-card`, `.phase4-active-module`. |
| Domina actualmente | `70-components-final.css` para grid/superficies; visibilidad de vistas sigue siendo mixta con `60-overrides.css` y capas anteriores. |
| Owner futuro | `10-layout.css` para layout home/main; `70-components-final.css` para tarjetas/superficies; estados funcionales documentados antes de decidir ubicación definitiva. |
| Riesgo | **ALTO**. |
| Motivo | Dashboard, shell y visibilidad de módulos están acoplados; `.content-right`, `.module-card` y `.phase4-active-module` aparecen repetidamente. |
| Notas de seguridad | **No tocar todavía** reglas que muestran una sola vista activa. No asumir que una regla repetida es redundante. |
| Checklist mínima | [ ] Abrir inicio. [ ] Entrar en varios módulos. [ ] Volver a inicio. [ ] Confirmar una sola vista visible. [ ] Revisar grid y tarjetas en ambos temas. [ ] Probar viewport estrecho. |

### 2.4 Cards

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `.card`, `.module-card`, `.dashboard-card`, `.rrll-card`, `.rrll-pro-card`, familias `:is(...)` de superficies y headers. |
| Domina actualmente | `70-components-final.css`, con excepciones temáticas y de módulo que conservan mayor especificidad. |
| Owner futuro | `70-components-final.css`; tokens visuales en `01-variables.css`; variantes operativas excepcionales en `30-modules.css`. |
| Riesgo | **MEDIO**. |
| Motivo | Es una familia transversal extensa y tardía; consolidarla sin inventario puede borrar diferencias intencionales entre superficies comunes y tarjetas operativas. |
| Notas de seguridad | No homogeneizar todas las cards de una vez. Separar superficie común, header y variante de módulo en pruebas distintas. |
| Checklist mínima | [ ] Comparar cards de dashboard y de al menos tres módulos. [ ] Revisar headers, bordes, radios, sombras y padding. [ ] Probar claro/oscuro. [ ] Validar textos largos y estado vacío. |

### 2.5 Botones

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `button`, `.btn`, `.primary`, `.danger`, `.excel`, icon buttons, botones de acción y `button[class*="primary"]`. |
| Domina actualmente | `70-components-final.css`, después de normalización tardía de `65-normalize.css`; persisten variantes específicas anteriores con `!important`. |
| Owner futuro | `70-components-final.css`; tokens en `01-variables.css`. |
| Riesgo | **ALTO**. |
| Motivo | El selector tardío `button[class*="primary"]` tiene alcance amplio; los botones participan en formularios, tablas, acciones y estados peligrosos como `.danger`. |
| Notas de seguridad | **No reducir `!important` todavía.** No mezclar botones de fila, modales, iconos y toolbar en un único cambio. |
| Checklist mínima | [ ] Probar primary/danger/excel/icon. [ ] Revisar hover, focus, disabled y contraste en ambos temas. [ ] Verificar acciones de tabla sin propagación accidental. [ ] Revisar botones de modal y toolbar. |

### 2.6 Formularios

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `form`, `.form-row`, `.form-grid`, `.form-group`, `.field`, `label`, `.modal-form`, familias RRLL y `:is(...)` de formularios. |
| Domina actualmente | `70-components-final.css`, con normalización base en `65-normalize.css` y excepciones por módulo. |
| Owner futuro | `70-components-final.css`; variantes estrictamente operativas en `30-modules.css`. |
| Riesgo | **MEDIO**. |
| Motivo | Los formularios son transversales y se renderizan con frecuencia dentro de modales; spacing, labels y layout están repartidos. |
| Notas de seguridad | Consolidar solo después de separar reglas estructurales de grid y acabado visual. No cambiar a la vez formularios y modales. |
| Checklist mínima | [ ] Abrir formularios cortos y largos. [ ] Revisar labels, obligatorios, ayuda y errores. [ ] Probar grid en viewport estrecho. [ ] Confirmar scroll y footer de modal. [ ] Validar ambos temas. |

### 2.7 Inputs / selects / textareas

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `input:not([type="checkbox"]):not([type="radio"]):not([type="color"])`, `select`, `textarea`, `.input`, `.select`, `.textarea`, estados `:focus`, `:disabled`, placeholders y controles específicos de filtros. |
| Domina actualmente | `70-components-final.css`, después de `65-normalize.css`; temas y módulos aún pueden ganar por especificidad. |
| Owner futuro | `70-components-final.css`; colores semánticos y focus tokens en `01-variables.css`. |
| Riesgo | **ALTO**. |
| Motivo | Los selectores tardíos abarcan casi todos los campos; pequeños cambios impactan filtros, modales y formularios de todos los módulos. |
| Notas de seguridad | **No reducir `!important` todavía.** Mantener checkbox/radio/color fuera de consolidaciones generales salvo inventario explícito. |
| Checklist mínima | [ ] Probar text, date, search, select y textarea. [ ] Revisar placeholder, focus, disabled y contraste. [ ] Ver filtros y campos dentro de modal. [ ] Comparar claro/oscuro. [ ] Probar textos largos. |

### 2.8 Tablas

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `01-variables.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `table`, `thead`, `tbody`, `th`, `td`, `.rrll-pro-table`, `.rrll-pro-table-wrap`, `.rrll-pro-actions`, `.rrll-pro-list-actions`, filas operativas y columnas `:nth-child(...)`. |
| Domina actualmente | Mixto: `70-components-final.css` domina superficies comunes, pero `60-overrides.css` conserva anchos y correcciones operativas, especialmente Comité/Paritaria. |
| Owner futuro | `70-components-final.css` para tabla común; `30-modules.css` para columnas y excepciones de módulos operativos. |
| Riesgo | **ALTO**. |
| Motivo | Hay muchas redefiniciones, doble clic en filas, acciones embebidas, overflow horizontal y anchos operativos contradictorios. |
| Notas de seguridad | **No tocar todavía.** No alterar alturas, wrapping, overflow, `pointer-events`, display de acciones ni `nth-child(...)` sin computed styles y prueba funcional. |
| Checklist mínima | [ ] Revisar varias tablas con datos y vacías. [ ] Probar scroll horizontal. [ ] Revisar hover y textos largos. [ ] Probar doble clic. [ ] Pulsar acciones y confirmar que no dispara la fila. [ ] Validar claro/oscuro. |

### 2.9 Modales

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | `.modal-backdrop`, `.modal-backdrop.open`, `.modal-box`, `.modal-header`, `.modal-body`, `.modal-actions`, aliases RRLL, modales específicos y estado `.open`. |
| Domina actualmente | `70-components-final.css`, con visibilidad dinámica y aliases heredados repartidos por capas anteriores. |
| Owner futuro | `70-components-final.css`. |
| Riesgo | **ALTO**. |
| Motivo | La familia es transversal y funcional: apertura/cierre, backdrop, z-index, scroll interno, formularios y footers dependen de la cascada. |
| Notas de seguridad | **No tocar todavía.** No retirar aliases ni reglas `.open`; probar modales de módulos distintos antes de consolidar. |
| Checklist mínima | [ ] Abrir varios modales. [ ] Cerrar por botón y backdrop cuando aplique. [ ] Verificar centrado y z-index. [ ] Probar contenido largo, scroll interno y footer accesible. [ ] Confirmar que no queda backdrop huérfano. [ ] Validar ambos temas. |

### 2.10 Tareas

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | Familias `.task-*`, `.tarea-*`, tarjetas/listado, filtros, estados, tabla/acciones y modal de tareas. |
| Domina actualmente | Mixto: `60-overrides.css` contiene una parte considerable de correcciones operativas y `70-components-final.css` aplica acabado común tardío. |
| Owner futuro | `30-modules.css` para reglas exclusivas de tareas; `70-components-final.css` para tabla, botones, formularios y modales comunes. |
| Riesgo | **ALTO**. |
| Motivo | Combina filtros, alta/edición, estados, acciones, doble clic y familias comunes; una consolidación puede alterar comportamiento visible y targets interactivos. |
| Notas de seguridad | **No tocar todavía** junto con tablas y botones. Separar reglas de módulo de componentes compartidos solo después de instrumentar computed styles. |
| Checklist mínima | [ ] Crear y editar tarea. [ ] Probar filtros/búsqueda. [ ] Revisar estados y acciones. [ ] Probar doble clic. [ ] Confirmar que botones no disparan la fila. [ ] Ver modal y tabla en ambos temas. |

### 2.11 Peticiones

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `65-normalize.css` → `70-components-final.css`. |
| Selectores principales | Familias `.petition-*`, `.peticion-*`, listado, filtros, estados, tabla/acciones y modal de peticiones. |
| Domina actualmente | Mixto: `60-overrides.css` conserva correcciones del módulo y `70-components-final.css` aplica acabado común tardío. |
| Owner futuro | `30-modules.css` para peticiones; `70-components-final.css` para componentes transversales. |
| Riesgo | **ALTO**. |
| Motivo | Tiene el mismo cruce crítico de tabla, acciones, filtros, modal y doble clic que tareas. |
| Notas de seguridad | **No tocar todavía.** No inferir equivalencia automática entre familias `petition-*` y `peticion-*`. |
| Checklist mínima | [ ] Crear y editar petición. [ ] Probar filtros/búsqueda. [ ] Revisar estados y acciones. [ ] Probar doble clic. [ ] Confirmar ausencia de propagación accidental. [ ] Validar modal y tabla en ambos temas. |

### 2.12 Actas

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | Familias `.acta-*`, tabla de actas, estados, alegaciones, acciones y modales relacionados. |
| Domina actualmente | `60-overrides.css` para gran parte de la presentación específica; `70-components-final.css` solo añade acabado común puntual. |
| Owner futuro | `30-modules.css` para el módulo; `70-components-final.css` para componentes compartidos. |
| Riesgo | **ALTO**. |
| Motivo | El módulo combina tabla, edición, estados, alegaciones y modales; su capa efectiva específica sigue dentro de deuda técnica tardía. |
| Notas de seguridad | **No tocar todavía.** Migrar únicamente cuando exista inventario selector por selector y prueba de estados/alegaciones. |
| Checklist mínima | [ ] Revisar tabla y estado vacío. [ ] Editar y guardar acta. [ ] Ver estados. [ ] Revisar alegaciones. [ ] Abrir/cerrar modales. [ ] Confirmar acciones sobre el acta correcta. |

### 2.13 Teletrabajo

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | Familias `.teletrabajo-*`, solicitudes, histórico, importación, catálogo de puestos, tabla, filtros, acciones y modales. |
| Domina actualmente | Mixto: `60-overrides.css` concentra correcciones específicas y `70-components-final.css` contiene acabado tardío adicional. |
| Owner futuro | `30-modules.css` para reglas operativas; `70-components-final.css` para componentes comunes. |
| Riesgo | **ALTO**. |
| Motivo | Reúne varias vistas internas y flujos distintos: solicitudes, edición, histórico, importación y catálogo. |
| Notas de seguridad | **No tocar todavía.** Probar cada subflujo; una validación superficial del listado no cubre el módulo. |
| Checklist mínima | [ ] Revisar solicitudes. [ ] Editar y guardar. [ ] Ver histórico largo. [ ] Probar importación válida y mensajes. [ ] Revisar catálogo, filtros y acciones. [ ] Abrir modales en ambos temas. |

### 2.14 Comité

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `10-layout.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | Familias `.comite-*`, puntos, sesiones, orden del día, tablas/tarjetas, acciones, modales y columnas `:nth-child(...)`. |
| Domina actualmente | Mixto y frágil: `60-overrides.css` conserva anchos/correcciones operativas y `70-components-final.css` añade una capa tardía extensa. |
| Owner futuro | `30-modules.css` para Comité; `70-components-final.css` para primitives comunes. |
| Riesgo | **ALTO**. |
| Motivo | Reglas numerosas, anchos de tabla redefinidos, bindings de doble clic y componentes compartidos mezclados con decisiones operativas. |
| Notas de seguridad | **No tocar todavía.** Comité es una zona congelada; no consolidar `nth-child(...)`, tablas ni acciones en una primera fase. |
| Checklist mínima | [ ] Revisar puntos y sesiones. [ ] Ver orden del día. [ ] Probar doble clic. [ ] Abrir modales. [ ] Revisar tabla, columnas y scroll. [ ] Confirmar acciones sobre el registro correcto. |

### 2.15 Paritaria

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | Familias `.paritaria-*`, puntos, sesiones, orden del día, tablas/tarjetas, acciones, modales y columnas `:nth-child(...)`. |
| Domina actualmente | Mixto y frágil: `60-overrides.css` y `70-components-final.css` aportan bloques tardíos extensos con decisiones operativas. |
| Owner futuro | `30-modules.css` para Paritaria; `70-components-final.css` para primitives comunes. |
| Riesgo | **ALTO**. |
| Motivo | Es una de las áreas más redefinidas; comparte riesgos de tablas, columnas, doble clic y acciones con Comité. |
| Notas de seguridad | **No tocar todavía.** No intentar unificar Comité y Paritaria por parecido visual hasta validar diferencias funcionales. |
| Checklist mínima | [ ] Revisar puntos y sesiones. [ ] Ver orden del día. [ ] Probar doble clic. [ ] Abrir modales. [ ] Revisar tabla, columnas y scroll. [ ] Confirmar acciones sobre el registro correcto. |

### 2.16 Especiales

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `70-components-final.css`. |
| Selectores principales | Reglas acotadas por `#gestor-especiales`: shell del módulo, drop zone MSG, preview, destinatarios, warnings, tabla y acciones. |
| Domina actualmente | `70-components-final.css`, que concentra la presentación efectiva del módulo. |
| Owner futuro | `30-modules.css` para las reglas exclusivas de Especiales; componentes comunes pueden permanecer en `70-components-final.css`. |
| Riesgo | **MEDIO**. |
| Motivo | El scope por `#gestor-especiales` reduce colisiones, pero la posición final y el flujo especializado hacen peligrosa una migración sin prueba funcional. |
| Notas de seguridad | No mover todavía en el mismo cambio que componentes globales. Mantener el scope del módulo durante cualquier migración futura. |
| Checklist mínima | [ ] Entrar al módulo. [ ] Probar drop zone MSG. [ ] Revisar preview. [ ] Ver destinatarios y warnings. [ ] Revisar tabla y acciones. [ ] Comparar ambos temas. |

### 2.17 Impresión

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css` → `90-print.css`. |
| Selectores principales | `.print-preview-content`, `.print-preview-content *`, `.print-preview-content th`, controles de preview y reglas dentro de `@media print`. |
| Domina actualmente | `90-print.css` para salida física; el preview en pantalla sigue dependiendo de capas anteriores. |
| Owner futuro | `90-print.css` para impresión física; `70-components-final.css` para el componente preview en pantalla. |
| Riesgo | **MEDIO**. |
| Motivo | Preview y papel no son equivalentes: las reglas finales blancas de impresión pueden parecer duplicadas respecto a estilos en pantalla, pero cumplen otra función. |
| Notas de seguridad | No eliminar una regla por repetición sin comparar preview, PDF y papel. Mantener `90-print.css` exclusivamente para `@media print`. |
| Checklist mínima | [ ] Abrir preview. [ ] Exportar cuando aplique. [ ] Generar PDF/imprimir. [ ] Revisar títulos, tablas y saltos de página. [ ] Confirmar ausencia de controles innecesarios. [ ] Cerrar preview sin alterar la pantalla activa. |

### 2.18 Tema claro / oscuro

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `01-variables.css` → `40-theme-dark.css` → `41-theme-light.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | `html[data-theme="dark"]`, `html[data-theme="light"]`, reglas globales `*`, superficies, inputs, botones, tablas, modales, scrollbars y selectores `[style*="..."]` de compatibilidad. |
| Domina actualmente | Mixto: `70-components-final.css` contiene overrides temáticos tardíos; `40-theme-dark.css`, `41-theme-light.css` y `60-overrides.css` siguen aportando reglas efectivas por especificidad. |
| Owner futuro | Primero `01-variables.css`; solo excepciones no tokenizables en `40-theme-dark.css` y `41-theme-light.css`. `70-components-final.css` debería consumir tokens y evitar crecer como parche temático. |
| Riesgo | **ALTO**. |
| Motivo | Los temas atraviesan toda la app e incluyen reglas globales, scrollbars y selectores frágiles basados en fragmentos de `style` inline. |
| Notas de seguridad | **No tocar todavía** reglas `[style*="..."]`, universales o scrollbars. Inventariar primero estilos inline producidos por HTML/JS. |
| Checklist mínima | [ ] Cambiar claro/oscuro varias veces. [ ] Revisar shell, cards, textos, campos, botones, tablas y modales. [ ] Abrir módulos operativos. [ ] Ver hover/focus/disabled. [ ] Confirmar persistencia del tema tras navegación. |

### 2.19 Scrollbars

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`, estados hover y scopes temáticos/globales. |
| Domina actualmente | `70-components-final.css` para varias reglas tardías, con overrides temáticos previos todavía relevantes. |
| Owner futuro | `40-theme-dark.css` y `41-theme-light.css` únicamente si el color no queda resuelto por tokens; geometría transversal mínima en `70-components-final.css`. |
| Riesgo | **MEDIO**. |
| Motivo | Son reglas globales y temáticas: una limpieza local puede cambiar modal, sidebar, tablas y contenido principal a la vez. |
| Notas de seguridad | No retirar reglas universales hasta comparar zonas con scroll real en ambos temas. Evitar nuevos parches globales. |
| Checklist mínima | [ ] Ver scroll de sidebar. [ ] Ver modal largo. [ ] Ver tabla ancha. [ ] Ver contenido principal largo. [ ] Comparar track/thumb/hover en claro y oscuro. |

### 2.20 Estados visuales dinámicos: `open`, `active`, `hidden`, `is-open`, `collapsed`

| Campo | Detalle |
|---|---|
| Archivos que intervienen | `00-base.css` → `01-variables.css` → `10-layout.css` → `20-components.css` → `30-modules.css` → `40-theme-dark.css` → `41-theme-light.css` → `50-module-extras.css` → `60-overrides.css` → `70-components-final.css`. |
| Selectores principales | `.open`, `.active`, `.hidden`, `.is-open`, `.collapsed`, `.is-collapsed`, `.is-expanded`, `.phase4-view-home`, `.phase4-view-module`, `.phase4-active-module`, `.modal-backdrop.open`, `.phase4-nav-item.active`. |
| Domina actualmente | Mixto por diseño: el resultado depende del componente, especificidad y clase mutada por JavaScript; no existe un único owner efectivo seguro. |
| Owner futuro | Mantener estados cerca del componente owner: layout/navigation en `10-layout.css`, componentes comunes en `70-components-final.css`, estados de módulo en `30-modules.css`. No crear una capa global genérica. |
| Riesgo | **ALTO**. |
| Motivo | Estas clases controlan visibilidad y navegación funcional, no solo decoración. Reglas aparentemente duplicadas pueden ser necesarias para vencer especificidad histórica. |
| Notas de seguridad | **No tocar todavía.** No renombrar clases, no globalizar `.open`/`.active`/`.hidden` y no eliminar reglas sin rastrear mutaciones JS y ejecutar navegación completa. |
| Checklist mínima | [ ] Navegar inicio/módulos. [ ] Abrir/cerrar grupos sidebar. [ ] Abrir/cerrar modales. [ ] Confirmar solo una vista activa. [ ] Revisar elementos ocultos. [ ] Probar colapso/expansión. [ ] Validar ambos temas y viewports. |

## 3. Resumen de owners futuros

| Owner futuro | Responsabilidad principal | Bloques |
|---|---|---|
| `01-variables.css` | Tokens y aliases semánticos; primera vía para reducir diferencias temáticas sin nuevos overrides. | Todos los bloques visuales; especialmente cards, botones, campos, temas y scrollbars. |
| `10-layout.css` | Estructura y responsive del shell. | Sidebar, header/top strip, dashboard y estados de navegación ligados al layout. |
| `20-components.css` | Componentes simples reutilizables no cubiertos por la foundation final. | Uso selectivo; no debe competir con `70-components-final.css`. |
| `30-modules.css` | Estilos exclusivamente operativos. | Tareas, peticiones, actas, teletrabajo, Comité, Paritaria y Especiales. |
| `40-theme-dark.css` / `41-theme-light.css` | Excepciones reales de tema no absorbibles por tokens. | Tema y, solo si es necesario, scrollbars. |
| `50-module-extras.css` | Capa temporal en retirada. | No debería recibir ownership nuevo. |
| `60-overrides.css` | Deuda técnica congelada. | No debería ser owner futuro; extraer solo con pruebas y commits pequeños. |
| `65-normalize.css` | Normalización transversal mínima. | No debería recibir nuevos parches. |
| `70-components-final.css` | Primitives visuales consolidadas. | Cards, botones, formularios, campos, tablas comunes, modales, preview en pantalla y superficies compartidas. |
| `90-print.css` | Salida física. | Impresión exclusivamente. |

## 4. Ranking de bloques más peligrosos

Orden orientativo para decidir **qué no abordar primero**:

1. **Estados visuales dinámicos**: pueden romper navegación, visibilidad y modales sin producir un error JavaScript evidente.
2. **Tablas**: combinan muchas capas, anchos operativos, scroll, acciones y doble clic.
3. **Comité y Paritaria**: concentran tablas complejas, columnas redefinidas, modales, acciones y bindings de doble clic.
4. **Sidebar + header/top strip + dashboard**: forman un shell acoplado con responsive y visibilidad de vistas.
5. **Modales**: componente transversal con estado `.open`, backdrop, z-index y scroll interno.
6. **Inputs/selects/textareas + botones + formularios**: reglas tardías globales con alcance sobre todos los módulos.
7. **Tareas, peticiones, actas y teletrabajo**: módulos operativos completos que cruzan tablas, modales, formularios y estados.
8. **Tema claro/oscuro + scrollbars**: impacto transversal y selectores globales/frágiles.
9. **Impresión**: riesgo acotado, pero requiere distinguir preview de salida física.
10. **Especiales**: mejor encapsulado por `#gestor-especiales`, aunque no debe moverse sin prueba funcional.
11. **Cards**: consolidable solo de forma incremental tras separar superficies comunes de variantes de módulo.

## 5. Secuencia segura recomendada para trabajos futuros

1. Mantener congelado el orden de imports.
2. Capturar `computed styles` representativos por bloque, tema y viewport.
3. Inventariar estilos inline antes de tocar tema claro/oscuro.
4. Separar conceptualmente componente común y excepción de módulo sin mover reglas todavía.
5. Empezar, en commits pequeños, por duplicados exactos cuya equivalencia se demuestre en contexto.
6. Evitar como primer objetivo `60-overrides.css`, `70-components-final.css`, estados dinámicos, tablas, Comité y Paritaria.
7. Ejecutar `MANUAL_TEST_CHECKLIST.md` después de cada cambio futuro de CSS.

## 6. Límites expresos de este documento

Este mapa **no** propone una limpieza agresiva. No autoriza:

- eliminar CSS;
- mover reglas;
- reducir `!important`;
- cambiar imports;
- renombrar archivos o clases;
- fusionar módulos por parecido visual;
- tratar `60-overrides.css` como una lista de reglas prescindibles;
- tratar `70-components-final.css` como fuente única ya consolidada;
- borrar selectores dinámicos porque no aparezcan literalmente en HTML.

El siguiente paso seguro sigue siendo diagnóstico medible y validación visual, no refactorización masiva.
