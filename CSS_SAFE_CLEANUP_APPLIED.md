# Limpieza CSS segura aplicada

Fecha: 2026-06-03

Criterio: solo se han eliminado duplicados exactos verificados en el ZIP actual. No se han eliminado selectores meramente huérfanos del informe `CSS_CLEANUP_CANDIDATES.md`, porque esa categoría no demuestra ausencia de uso dinámico.

## Cambios aplicados

- `app/styles/30-modules.css` líneas originales 1663-1663: Duplicado exacto de *::-webkit-scrollbar ya definido en app/styles/20-components.css:555.
- `app/styles/41-theme-light.css` líneas originales 1069-1071: Duplicado exacto de .rrll-sidebar::-webkit-scrollbar-track conservado en app/styles/layout/50-sidebar.css:10.
- `app/styles/41-theme-light.css` líneas originales 1076-1080: Duplicado exacto de .rrll-nav conservado en app/styles/layout/50-sidebar.css:12.
- `app/styles/41-theme-light.css` líneas originales 1145-1149: Duplicado exacto de .rrll-sidebar-sync .save-status-dot conservado en app/styles/features/50-sidebar-sync-compact.css:9.
- `app/styles/50-module-extras.css` líneas originales 237-239: Duplicado exacto de .rrll-nav:first-of-type conservado en app/styles/60-overrides.css:33.

## Cambios descartados

- No se han eliminado reglas de modales, tablas, acciones, navegación crítica, visibilidad (`open`, `active`, `hidden`), impresión ni responsive.
- No se han tocado los 385 posibles huérfanos del informe documental. Requieren validación visual o prueba de ejecución antes de borrar CSS activo.

## Impacto medido

- Reglas CSS eliminadas: 5.
- Líneas eliminadas netas: 15.
- Riesgo estimado: bajo.
- Impacto funcional esperado: nulo; el beneficio es reducción de ruido y menor conflicto futuro en sidebar/scrollbar/sync.
