# Auditoría de reglas CSS duplicadas exactamente

## Objetivo y alcance

Este documento inventaría reglas CSS repetidas sin modificar, eliminar ni mover ninguna regla. Se analizaron todos los archivos `*.css` versionados o presentes en el árbol de trabajo de la aplicación, incluidos `app/styles.css` y los archivos importados desde `app/styles/`.

## Criterio de comparación

- **Duplicado exacto:** mismo selector y mismo conjunto de propiedades con los mismos valores. El orden textual de las declaraciones no cambia la clasificación.
- **Duplicado exacto seguro:** coincidencia exacta dentro del mismo contexto de cascada; es candidata a consolidación posterior, previa validación visual.
- **Duplicado exacto con riesgo:** coincidencia exacta cuyo contexto de cascada no es equivalente; no debe consolidarse sin revisar el comportamiento específico del contexto.
- **Similar pero no idéntico:** el selector se repite, pero sus declaraciones no son exactamente iguales. Estas entradas documentan capas de cascada y no son candidatas a eliminación automática.

## Resumen

- Archivos CSS analizados: **13**.
- Bloques con declaraciones analizados: **2911**.
- Grupos de duplicados exactos seguros: **20**.
- Grupos de duplicados exactos con riesgo: **1**.
- Selectores similares pero no idénticos: **284**.

> Nota: las propuestas son recomendaciones para una intervención futura. Esta auditoría no aplica cambios sobre CSS.

## 1. Duplicado exacto seguro

### 1.1 `textarea`

- **Archivo origen:** `app/styles/10-layout.css:581` (global).
- **Archivo(s) duplicado(s):** `app/styles/70-components-final.css:495` (global).
- **Propiedades:** `resize: vertical`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/10-layout.css:581` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.2 `body.phase4-view-home #dashboardLayout`

- **Archivo origen:** `app/styles/10-layout.css:682` (global).
- **Archivo(s) duplicado(s):** `app/styles/10-layout.css:864` (global).
- **Propiedades:** `display: none !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/10-layout.css:682` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.3 `body.phase4-view-module .content-right > .module-card`

- **Archivo origen:** `app/styles/10-layout.css:884` (global).
- **Archivo(s) duplicado(s):** `app/styles/10-layout.css:1544` (global).
- **Propiedades:** `display: none !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/10-layout.css:884` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.4 `.print-preview-content *`

- **Archivo origen:** `app/styles/20-components.css:554` (global).
- **Archivo(s) duplicado(s):** `app/styles/30-modules.css:1076` (global).
- **Propiedades:** `color: var(--rrll-text-main-light) !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/20-components.css:554` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.5 `*::-webkit-scrollbar`

- **Archivo origen:** `app/styles/20-components.css:587` (global).
- **Archivo(s) duplicado(s):** `app/styles/30-modules.css:1752` (global).
- **Propiedades:** `width: 10px`; `height: 10px`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/20-components.css:587` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.6 `.phase4-sidebar::-webkit-scrollbar-track`

- **Archivo origen:** `app/styles/41-theme-light.css:1065` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:2422` (global).
- **Propiedades:** `background: transparent !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/41-theme-light.css:1065` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.7 `.phase4-nav`

- **Archivo origen:** `app/styles/41-theme-light.css:1075` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:2424` (global).
- **Propiedades:** `gap: 4px !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/41-theme-light.css:1075` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.8 `.phase5-sidebar-sync .save-status-dot`

- **Archivo origen:** `app/styles/41-theme-light.css:1153` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:2537` (global).
- **Propiedades:** `width: 8px !important`; `height: 8px !important`; `margin-top: 0 !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/41-theme-light.css:1153` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.9 `.phase5-calendar-day i.cal-due, .phase5-calendar-legend i.cal-due`

- **Archivo origen:** `app/styles/50-module-extras.css:216` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:312` (global).
- **Propiedades:** `background: #f59e0b !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/50-module-extras.css:216` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.10 `.phase5-calendar-day i.cal-committee, .phase5-calendar-legend i.cal-committee`

- **Archivo origen:** `app/styles/50-module-extras.css:217` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:314` (global).
- **Propiedades:** `background: #3b82f6 !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/50-module-extras.css:217` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.11 `.phase5-calendar-day i.cal-paritaria, .phase5-calendar-legend i.cal-paritaria`

- **Archivo origen:** `app/styles/50-module-extras.css:218` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:316` (global).
- **Propiedades:** `background: #8b5cf6 !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/50-module-extras.css:218` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.12 `.phase5-calendar-day i.cal-expired, .phase5-calendar-legend i.cal-expired`

- **Archivo origen:** `app/styles/50-module-extras.css:219` (global).
- **Archivo(s) duplicado(s):** `app/styles/50-module-extras.css:318` (global).
- **Propiedades:** `background: #ef4444 !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/50-module-extras.css:219` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.13 `.phase4-nav:first-of-type`

- **Archivo origen:** `app/styles/50-module-extras.css:952` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:23` (global).
- **Propiedades:** `margin-top: 0 !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/50-module-extras.css:952` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.14 `body.phase4-view-module #gestor-vinculograma .vinculograma-table th:nth-child(1), body.phase4-view-module #gestor-vinculograma .vinculograma-table td:nth-child(1)`

- **Archivo origen:** `app/styles/60-overrides.css:2441` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:2718` (global).
- **Propiedades:** `width: 12% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:2441` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.15 `body.phase4-view-module #gestor-actas .rrll-pro-minutes-table th:nth-child(4), body.phase4-view-module #gestor-actas .rrll-pro-minutes-table td:nth-child(4)`

- **Archivo origen:** `app/styles/60-overrides.css:2589` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3512` (global).
- **Propiedades:** `width: 10% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:2589` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.16 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(2), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(2)`

- **Archivo origen:** `app/styles/60-overrides.css:3085` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3520` (global).
- **Propiedades:** `width: 12% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:3085` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.17 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(3), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(3)`

- **Archivo origen:** `app/styles/60-overrides.css:3087` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3522` (global).
- **Propiedades:** `width: 10% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:3087` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.18 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(4), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(4)`

- **Archivo origen:** `app/styles/60-overrides.css:3089` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3524` (global).
- **Propiedades:** `width: 11% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:3089` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.19 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(5), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(5)`

- **Archivo origen:** `app/styles/60-overrides.css:3091` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3526` (global).
- **Propiedades:** `width: 13% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:3091` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

### 1.20 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(7), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(7)`

- **Archivo origen:** `app/styles/60-overrides.css:3095` (global).
- **Archivo(s) duplicado(s):** `app/styles/60-overrides.css:3530` (global).
- **Propiedades:** `width: 12% !important`.
- **Motivo del riesgo:** bajo; las copias tienen selector, propiedades, valores y contexto de cascada equivalentes. Aun así, una consolidación futura debe validar el orden de carga y la interfaz.
- **Propuesta de consolidación:** conservar como fuente canónica `app/styles/60-overrides.css:3095` (global) y, en una tarea posterior con validación visual, retirar las copias redundantes indicadas.

## 2. Duplicado exacto con riesgo

### 2.1 `.print-preview-content th`

- **Archivo origen:** `app/styles/30-modules.css:1080` (global).
- **Archivo(s) duplicado(s):** `app/styles/90-print.css:10` (@media print).
- **Propiedades:** `background: var(--rrll-text-main-light) !important`; `color: #ffffff !important`.
- **Motivo del riesgo:** las declaraciones coinciden, pero aparecen bajo contextos de cascada distintos. Una copia global y una copia condicionada no son intercambiables sin comprobar impresión, especificidad, orden de carga y herencia.
- **Propuesta de consolidación:** no eliminar automáticamente. Verificar primero el comportamiento en cada contexto y consolidar solo si la regla condicionada resulta verdaderamente redundante.

## 3. Similar pero no idéntico

Los siguientes selectores reaparecen con declaraciones diferentes. Se registran para revisión manual: no cumplen la definición de duplicado exacto y pueden representar composición intencional, responsive design, tematización u overrides.

### 3.1 `:root`

- **Archivo origen:** `app/styles/00-base.css:5` (global).
- **Archivo(s) con variantes:** `app/styles/01-variables.css:5` (global), `app/styles/01-variables.css:318` (global), `app/styles/70-components-final.css:3` (global), `app/styles/70-components-final.css:3120` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:5` (global): `--bg: #dce9eb`; `--panel: #edf5f5`; `--text: #121820`; `--muted: #526a72`; `--border: rgba(73, 109, 116, .42)`; `--black: #121820`; `--red: #a73535`; `--red-dark: #8f2b2d`; `--soft-red: #ead2cf`; `--warning: #efe3ad`; `--expired: #e7b7b0`; `--chart-gray: #7f969d`; `--shadow: 0 14px 32px rgba(52, 82, 91, .16)`; `--rrll-bg-app: #dce9eb`; `--rrll-surface-base: rgba(238, 245, 245, .82)`; `--rrll-surface-card: #d8e8ea`; `--rrll-surface-raised: #e8f1f1`; `--rrll-surface-header: #c3d9dc`; `--rrll-surface-hover: #d0e2e4`; `--rrll-field-bg: #f5efdf`; `--rrll-field-bg-focus: #fff8ea`; `--rrll-border: rgba(73, 109, 116, .42)`; `--rrll-border-strong: rgba(47, 94, 102, .66)`; `--rrll-text-main: #121820`; `--rrll-text-soft: #1d2a32`; `--rrll-text-muted: #526a72`; `--rrll-shadow-soft: 0 14px 32px rgba(52, 82, 91, .16)`; `--rrll-shadow-red: 0 14px 30px rgba(167, 53, 53, .22)`; `--rrll-font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`; `--rrll-fs-page: 19px`; `--rrll-fs-section: 15px`; `--rrll-fs-card: 13px`; `--phase4-navy: #071f3d`; `--phase4-navy-2: #0b315f`; `--phase4-surface: #ffffff`; `--phase4-soft: #f8fafc`; `--phase4-sidebar-bg: #2b2f36`; `--phase4-sidebar-bg-2: #23272e`; `--phase4-sidebar-hover: #3a3f48`; `color-scheme: light`.
  - `app/styles/01-variables.css:5` (global): `--rrll-sidebar-light: #202733`; `--rrll-sidebar-hover-light: #2d3645`; `--rrll-sidebar-active-light: #3a4658`; `--rrll-text-placeholder-light: #94a3b8`; `--rrll-text-on-dark-light: #f8fafc`; `--rrll-separator-light: #d7dee7`; `--rrll-red-main: #e30613`; `--rrll-red-ui: #a73535`; `--rrll-red-hover: #8f2d2d`; `--rrll-success-light: #138a52`; `--rrll-warning-light: #b7791f`; `--rrll-error-light: #b4232a`; `--rrll-info-light: #2f6fbb`; `--bg-primary: var(--rrll-bg-app-light)`; `--bg-secondary: var(--rrll-bg-soft-light)`; `--surface: var(--rrll-bg-card-light)`; `--surface-elevated: var(--rrll-bg-panel-light)`; `--text-primary: var(--rrll-text-main-light)`; `--text-secondary: var(--rrll-text-secondary-light)`; `--text-muted: var(--rrll-text-muted-light)`; `--border-soft: var(--rrll-border-soft-light)`; `--accent-primary: var(--rrll-red-ui)`; `--success: var(--rrll-success-light)`; `--warning-color: var(--rrll-warning-light)`; `--danger: var(--rrll-error-light)`; `--info: var(--rrll-info-light)`; `--rrll-shadow-light: 0 1px 2px rgba(15, 23, 42, .035), 0 8px 22px rgba(15, 23, 42, .055)`; `--rrll-shadow-panel-light: 0 1px 2px rgba(15, 23, 42, .04), 0 14px 34px rgba(15, 23, 42, .07)`; `--rrll-shadow-dark: 0 4px 18px rgba(0,0,0,.20)`; `--bg: var(--rrll-bg-app-light)`; `--panel: var(--rrll-bg-panel-light)`; `--text: var(--rrll-text-main-light)`; `--muted: var(--rrll-text-muted-light)`; `--border: var(--rrll-border-light)`; `--black: var(--rrll-text-main-light)`; `--red: var(--rrll-red-ui)`; `--shadow: var(--rrll-shadow-panel-light)`; `--rrll-bg-app: var(--rrll-bg-app-light)`; `--rrll-surface-base: var(--rrll-bg-soft-light)`; `--rrll-surface-card: var(--rrll-bg-card-light)`; `--rrll-surface-raised: var(--rrll-bg-panel-light)`; `--rrll-surface-header: var(--rrll-bg-table-head-light)`; `--rrll-surface-hover: var(--rrll-bg-table-hover-light)`; `--rrll-field-bg: var(--rrll-bg-panel-light)`; `--rrll-field-bg-focus: var(--rrll-bg-soft-light)`; `--rrll-border: var(--rrll-border-light)`; `--rrll-border-strong: var(--rrll-separator-light)`; `--rrll-text-main: var(--rrll-text-main-light)`; `--rrll-text-soft: var(--rrll-text-secondary-light)`; `--rrll-text-muted: var(--rrll-text-muted-light)`; `--rrll-shadow-soft: var(--rrll-shadow-light)`; `--rrll-shadow-red: 0 14px 30px rgba(167, 53, 53, .18)`; `--phase4-sidebar-bg: var(--rrll-sidebar-light)`; `--phase4-sidebar-bg-2: var(--rrll-sidebar-active-light)`; `--phase4-sidebar-hover: var(--rrll-sidebar-hover-light)`; `--rrll-font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`; `--rrll-font-2xs: 10px`; `--rrll-font-xs: 11px`; `--rrll-font-sm: 12px`; `--rrll-font-md: 13px`; `--rrll-font-base: 14px`; `--rrll-font-lg: 16px`; `--rrll-font-xl: 18px`; `--rrll-font-2xl: 22px`; `--rrll-font-3xl: 26px`; `--rrll-line-tight: 1.15`; `--rrll-line-normal: 1.35`; `--rrll-line-relaxed: 1.55`; `--rrll-fs-page: var(--rrll-font-xl)`; `--rrll-fs-section: var(--rrll-font-base)`; `--rrll-fs-card: var(--rrll-font-md)`; `--rrll-space-2xs: 2px`; `--rrll-space-xs: 4px`; `--rrll-space-sm: 6px`; `--rrll-space-md: 8px`; `--rrll-space-lg: 10px`; `--rrll-space-xl: 12px`; `--rrll-space-2xl: 16px`; `--rrll-space-3xl: 20px`; `--rrll-space-4xl: 24px`; `--rrll-radius-xs: 4px`; `--rrll-radius-sm: 6px`; `--rrll-radius-md: 8px`; `--rrll-radius-lg: 12px`; `--rrll-radius-xl: 16px`; `--rrll-radius-pill: 999px`; `--rrll-control-height-sm: 28px`; `--rrll-control-height: 34px`; `--rrll-control-height-lg: 40px`; `--rrll-control-padding-x: 10px`; `--rrll-control-padding-y: 7px`; `--rrll-table-font: var(--rrll-font-md)`; `--rrll-table-head-font: var(--rrll-font-sm)`; `--rrll-table-cell-padding-y: 8px`; `--rrll-table-cell-padding-x: 10px`; `--rrll-bg-app-light: #f4f6f8`; `--rrll-bg-panel-light: #ffffff`; `--rrll-bg-card-light: #fbfbfc`; `--rrll-bg-surface-light: #ffffff`; `--rrll-bg-surface-muted-light: #fbfbfc`; `--rrll-bg-soft-light: #eef2f6`; `--rrll-bg-table-head-light: #eef2f5`; `--rrll-bg-table-header-light: #f1f5f9`; `--rrll-bg-table-row-light: #ffffff`; `--rrll-bg-table-row-alt-light: #f8fafc`; `--rrll-bg-table-hover-light: #edf3f7`; `--rrll-bg-input-light: #f8fafc`; `--rrll-text-main-light: #1f2937`; `--rrll-text-primary-light: #1f2937`; `--rrll-text-secondary-light: #4b5563`; `--rrll-text-muted-light: #6b7280`; `--rrll-text-placeholder-light: #64748b`; `--rrll-border-light: #e5e7eb`; `--rrll-border-soft: #e5e7eb`; `--rrll-border-input-light: #e5e7eb`; `--rrll-border-soft-light: rgba(209, 213, 219, .72)`; `--rrll-bg-app-dark: #222936`; `--rrll-bg-panel-dark: #2b313d`; `--rrll-bg-card-dark: #2b313d`; `--rrll-bg-soft-dark: #303746`; `--rrll-bg-table-head-dark: #343b46`; `--rrll-bg-table-row-dark: #2b313d`; `--rrll-bg-table-hover-dark: #3a4152`; `--rrll-text-main-dark: #e5e7eb`; `--rrll-text-secondary-dark: #cbd5e1`; `--rrll-text-muted-dark: #aab3c2`; `--rrll-border-dark: rgba(148, 163, 184, .18)`; `--rrll-border-soft-dark: rgba(148, 163, 184, .12)`; `--rrll-sidebar-font: var(--rrll-font-md)`; `--rrll-form-font: var(--rrll-font-md)`; `--rrll-button-font: var(--rrll-font-md)`; `--rrll-modal-font: var(--rrll-font-md)`.
  - `app/styles/01-variables.css:318` (global): `--rrll-theme-bg-app: var(--rrll-bg-app)`; `--rrll-theme-bg-panel: var(--panel)`; `--rrll-theme-bg-card: var(--rrll-surface-card)`; `--rrll-theme-bg-elevated: var(--rrll-surface-raised)`; `--rrll-theme-bg-header: var(--rrll-surface-header)`; `--rrll-theme-bg-hover: var(--rrll-surface-hover)`; `--rrll-theme-bg-input: var(--rrll-field-bg)`; `--rrll-theme-bg-input-focus: var(--rrll-field-bg-focus)`; `--rrll-theme-text-main: var(--rrll-text-main)`; `--rrll-theme-text-secondary: var(--rrll-text-soft)`; `--rrll-theme-text-muted: var(--rrll-text-muted)`; `--rrll-theme-text-placeholder: var(--rrll-text-muted)`; `--rrll-theme-text-on-accent: var(--rrll-text-on-dark-light)`; `--rrll-theme-text-on-dark: var(--rrll-text-on-dark-light)`; `--rrll-theme-accent: var(--rrll-red-ui)`; `--rrll-theme-accent-hover: var(--rrll-red-hover)`; `--rrll-theme-accent-soft: var(--soft-red)`; `--rrll-theme-accent-border: var(--rrll-red-ui)`; `--rrll-theme-success: var(--success)`; `--rrll-theme-success-bg: var(--rrll-surface-hover)`; `--rrll-theme-success-border: var(--success)`; `--rrll-theme-warning: var(--warning-color)`; `--rrll-theme-warning-bg: var(--rrll-surface-hover)`; `--rrll-theme-warning-border: var(--warning-color)`; `--rrll-theme-danger: var(--danger)`; `--rrll-theme-danger-bg: var(--rrll-surface-hover)`; `--rrll-theme-danger-border: var(--danger)`; `--rrll-theme-info: var(--info)`; `--rrll-theme-info-bg: var(--rrll-surface-hover)`; `--rrll-theme-info-border: var(--info)`; `--rrll-theme-shadow-xs: var(--rrll-shadow-soft)`; `--rrll-theme-shadow-sm: var(--rrll-shadow-soft)`; `--rrll-theme-shadow-md: var(--shadow)`; `--rrll-theme-shadow-lg: var(--shadow)`; `--rrll-theme-shadow-modal: var(--shadow)`; `--rrll-theme-shadow-focus: var(--rrll-shadow-red)`; `--rrll-card-bg: var(--rrll-surface-card)`; `--rrll-card-border: var(--rrll-border)`; `--rrll-card-radius: var(--rrll-radius-lg)`; `--rrll-card-padding: var(--rrll-space-2xl)`; `--rrll-card-shadow: var(--rrll-shadow-soft)`; `--rrll-button-height: var(--rrll-control-height)`; `--rrll-button-radius: var(--rrll-radius-md)`; `--rrll-button-padding-x: var(--rrll-control-padding-x)`; `--rrll-button-primary-bg: var(--rrll-red-ui)`; `--rrll-button-primary-bg-hover: var(--rrll-red-hover)`; `--rrll-button-secondary-bg: var(--rrll-surface-base)`; `--rrll-button-danger-bg: var(--danger)`; `--rrll-table-header-bg: var(--rrll-surface-header)`; `--rrll-table-row-bg: var(--rrll-surface-card)`; `--rrll-table-row-alt-bg: var(--rrll-surface-base)`; `--rrll-table-row-hover-bg: var(--rrll-surface-hover)`; `--rrll-table-border: var(--rrll-border)`; `--rrll-modal-bg: var(--rrll-surface-raised)`; `--rrll-modal-border: var(--rrll-border)`; `--rrll-modal-radius: var(--rrll-radius-xl)`; `--rrll-modal-shadow: var(--shadow)`.
  - `app/styles/70-components-final.css:3` (global): `--rrll-component-bg: var(--rrll-surface-card, var(--panel, #ffffff))`; `--rrll-component-bg-soft: var(--rrll-surface-raised, var(--panel, #f8fafc))`; `--rrll-component-border: var(--rrll-border, var(--border, #d9dee7))`; `--rrll-component-text: var(--rrll-text-main, var(--text, var(--rrll-text-main-light)))`; `--rrll-component-muted: var(--rrll-text-muted, var(--muted, #667085))`; `--rrll-component-red: var(--red, #ef2b2d)`; `--rrll-component-red-dark: #b91c1c`; `--rrll-component-danger: #dc2626`; `--rrll-component-shadow: var(--rrll-shadow-soft, 0 14px 34px rgba(15, 23, 42, .10))`; `--rrll-component-shadow-soft: var(--rrll-shadow-soft, 0 8px 22px rgba(15, 23, 42, .08))`.
  - `app/styles/70-components-final.css:3120` (global): `--rrll-visual-font-body: var(--rrll-font-md)`; `--rrll-visual-font-title: var(--rrll-font-lg)`; `--rrll-visual-font-subtitle: var(--rrll-font-sm)`; `--rrll-visual-control-height: 34px`; `--rrll-visual-control-height-sm: 30px`; `--rrll-visual-control-height-lg: 38px`; `--rrll-visual-control-padding-x: 11px`; `--rrll-visual-control-padding-y: 7px`; `--rrll-visual-row-min-height: 38px`; `--rrll-visual-table-padding-y: 8px`; `--rrll-visual-table-padding-x: 10px`; `--rrll-visual-card-padding: 16px`; `--rrll-visual-toolbar-padding-y: 10px`; `--rrll-visual-toolbar-padding-x: 12px`; `--rrll-visual-module-header-height: 54px`; `--rrll-visual-internal-header-height: 46px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.2 `html[data-theme="light"]`

- **Archivo origen:** `app/styles/00-base.css:65` (global).
- **Archivo(s) con variantes:** `app/styles/01-variables.css:180` (global), `app/styles/41-theme-light.css:2` (global), `app/styles/70-components-final.css:2717` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:65` (global): `--bg: #f4f7fb`; `--panel: #ffffff`; `--text: #111827`; `--muted: #64748b`; `--border: rgba(148, 163, 184, .30)`; `--black: #111827`; `--rrll-bg-app: #eef4f8`; `--rrll-surface-base: #f7fafc`; `--rrll-surface-card: #ffffff`; `--rrll-surface-raised: #f8fafc`; `--rrll-surface-header: #edf4f7`; `--rrll-surface-hover: #e8f1f5`; `--rrll-field-bg: #ffffff`; `--rrll-field-bg-focus: #f8fbff`; `--rrll-border: rgba(148, 163, 184, .32)`; `--rrll-border-strong: rgba(100, 116, 139, .42)`; `--rrll-text-main: #111827`; `--rrll-text-soft: #334155`; `--rrll-text-muted: #64748b`; `--rrll-shadow-soft: 0 12px 28px rgba(15, 23, 42, .08)`; `--rrll-shadow-red: 0 14px 30px rgba(167, 53, 53, .18)`; `color-scheme: light`.
  - `app/styles/01-variables.css:180` (global): `--bg: var(--rrll-bg-app-light)`; `--panel: var(--rrll-bg-panel-light)`; `--text: var(--rrll-text-main-light)`; `--muted: var(--rrll-text-muted-light)`; `--border: var(--rrll-border-light)`; `--black: var(--rrll-text-main-light)`; `--red: var(--rrll-red-ui)`; `--shadow: var(--rrll-shadow-panel-light)`; `--rrll-bg-app: var(--rrll-bg-app-light)`; `--rrll-surface-base: var(--rrll-bg-app-light)`; `--rrll-surface-card: var(--rrll-bg-surface-light)`; `--rrll-surface-raised: var(--rrll-bg-surface-muted-light)`; `--rrll-surface-header: var(--rrll-bg-table-header-light)`; `--rrll-surface-hover: var(--rrll-bg-table-hover-light)`; `--rrll-field-bg: var(--rrll-bg-input-light)`; `--rrll-field-bg-focus: var(--rrll-bg-surface-light)`; `--rrll-border: var(--rrll-border-light)`; `--rrll-border-strong: var(--rrll-separator-light)`; `--rrll-text-main: var(--rrll-text-main-light)`; `--rrll-text-soft: var(--rrll-text-secondary-light)`; `--rrll-text-muted: var(--rrll-text-muted-light)`; `--rrll-shadow-soft: var(--rrll-shadow-light)`; `--rrll-shadow-red: 0 14px 30px rgba(167, 53, 53, .18)`; `--phase4-sidebar-bg: var(--rrll-sidebar-light)`; `--phase4-sidebar-bg-2: var(--rrll-sidebar-active-light)`; `--phase4-sidebar-hover: var(--rrll-sidebar-hover-light)`; `--bg-primary: var(--rrll-bg-app-light)`; `--bg-secondary: var(--rrll-bg-soft-light)`; `--surface: var(--rrll-bg-card-light)`; `--surface-elevated: var(--rrll-bg-panel-light)`; `--text-primary: var(--rrll-text-main-light)`; `--text-secondary: var(--rrll-text-secondary-light)`; `--text-muted: var(--rrll-text-muted-light)`; `--border-soft: var(--rrll-border-soft-light)`; `--accent-primary: var(--rrll-red-ui)`; `--success: var(--rrll-success-light)`; `--warning-color: var(--rrll-warning-light)`; `--danger: var(--rrll-error-light)`; `--info: var(--rrll-info-light)`; `color-scheme: light`.
  - `app/styles/41-theme-light.css:2` (global): `color-scheme: light`; `--rrll-bg-app-light: var(--rrll-light-app-bg)`; `--rrll-bg-soft-light: var(--rrll-light-table-hover)`; `--rrll-bg-card-light: #fbfbfc`; `--rrll-bg-panel-light: var(--rrll-light-surface)`; `--rrll-bg-table-head-light: var(--rrll-light-table-head)`; `--rrll-bg-table-row-light: #fbfbfc`; `--rrll-bg-table-row-alt-light: #f7f9fb`; `--rrll-bg-table-hover-light: #edf3f7`; `--rrll-text-main-light: var(--rrll-light-text-primary)`; `--rrll-text-secondary-light: var(--rrll-light-text-secondary)`; `--rrll-text-muted-light: var(--rrll-light-text-muted)`; `--rrll-text-placeholder-light: #9aa4b2`; `--rrll-border-light: var(--rrll-light-border-weak)`; `--rrll-border-soft-light: rgba(209, 213, 219, .72)`; `--rrll-separator-light: #d9dee7`; `--rrll-sidebar-light: #202733`; `--rrll-sidebar-hover-light: #2d3645`; `--rrll-sidebar-active-light: #3a4658`; `--rrll-sidebar-accent-light: #b23838`; `--rrll-success-light: #138a52`; `--rrll-warning-light: #b7791f`; `--rrll-error-light: #b4232a`; `--rrll-info-light: #2f6fbb`; `--bg-primary: var(--rrll-bg-app-light)`; `--bg-secondary: var(--rrll-bg-soft-light)`; `--surface: var(--rrll-bg-card-light)`; `--surface-elevated: var(--rrll-bg-panel-light)`; `--text-primary: var(--rrll-text-main-light)`; `--text-secondary: var(--rrll-text-secondary-light)`; `--text-muted: var(--rrll-text-muted-light)`; `--border-soft: var(--rrll-border-soft-light)`; `--accent-primary: var(--rrll-red-ui)`; `--success: var(--rrll-success-light)`; `--warning-color: var(--rrll-warning-light)`; `--danger: var(--rrll-error-light)`; `--info: var(--rrll-info-light)`; `--rrll-bg-app: var(--bg-primary)`; `--rrll-surface-base: var(--bg-secondary)`; `--rrll-surface-card: var(--surface)`; `--rrll-surface-raised: var(--surface-elevated)`; `--rrll-surface-header: var(--rrll-bg-table-head-light)`; `--rrll-surface-hover: var(--rrll-bg-table-hover-light)`; `--rrll-field-bg: #f9fafb`; `--rrll-field-bg-focus: var(--rrll-light-surface)`; `--rrll-border: var(--rrll-border-light)`; `--rrll-border-strong: var(--rrll-separator-light)`; `--rrll-text-main: var(--text-primary)`; `--rrll-text-soft: var(--text-secondary)`; `--rrll-text-muted: var(--text-muted)`; `--rrll-shadow-soft: 0 1px 2px rgba(15, 23, 42, .035), 0 8px 22px rgba(15, 23, 42, .055)`; `--rrll-shadow-panel: 0 1px 2px rgba(15, 23, 42, .04), 0 14px 34px rgba(15, 23, 42, .07)`; `--rrll-shadow-focus: 0 0 0 3px rgba(167, 53, 53, .13)`; `--rrll-component-bg: var(--rrll-surface-card)`; `--rrll-component-bg-soft: var(--rrll-surface-base)`; `--rrll-component-border: var(--rrll-border)`; `--rrll-component-text: var(--rrll-text-main)`; `--rrll-component-muted: var(--rrll-text-muted)`; `--phase4-sidebar-bg: #3b4556`; `--phase4-sidebar-bg-2: #334155`; `--phase4-sidebar-hover: #475569`; `--phase4-sidebar-active: #c24141`; `--phase4-sidebar-text: var(--rrll-light-input-bg)`; `--phase4-sidebar-muted: #cbd5e1`; `--phase4-sidebar-icon: #e2e8f0`; `--dash-surface: var(--rrll-bg-card-light)`; `--dash-surface-2: var(--rrll-bg-soft-light)`; `--dash-border: var(--rrll-border-light)`; `--bg: var(--bg-primary)`; `--panel: var(--surface)`; `--text: var(--text-primary)`; `--muted: var(--text-muted)`; `--border: var(--border-soft)`; `--black: var(--rrll-text-main-light)`; `--red: var(--accent-primary)`; `--soft-red: rgba(167, 53, 53, .09)`; `--warning: rgba(183, 121, 31, .13)`; `--expired: rgba(180, 35, 42, .11)`; `--chart-gray: var(--rrll-light-text-muted)`; `--shadow: var(--rrll-shadow-panel)`; `--rrll-light-app-bg: #f4f6f8`; `--rrll-light-surface: #ffffff`; `--rrll-light-surface-soft: #fbfbfc`; `--rrll-light-table-head: #f1f5f9`; `--rrll-light-table-row: var(--rrll-light-surface)`; `--rrll-light-table-row-alt: #f8fafc`; `--rrll-light-table-hover: #eef2f7`; `--rrll-light-input-bg: #f8fafc`; `--rrll-light-border-soft: #e5e7eb`; `--rrll-light-border-input: #dbe2ea`; `--rrll-light-border-default: #dbe2ea`; `--rrll-light-table-row-hover: #eef3f8`; `--rrll-light-focus-border: #c5ced9`; `--rrll-light-focus-ring: rgba(167, 53, 53, .10)`; `--rrll-light-modal-overlay: rgba(15, 23, 42, .32)`; `--rrll-light-text-main: #1f2937`; `--rrll-light-text-secondary: #4b5563`; `--rrll-light-text-muted: #6b7280`; `--rrll-light-placeholder: #64748b`.
  - `app/styles/70-components-final.css:2717` (global): `--bg: #f4f7fb`; `--panel: #ffffff`; `--text: var(--rrll-text-main-light)`; `--muted: var(--rrll-text-muted-light)`; `--border: rgba(148, 163, 184, .30)`; `--black: var(--rrll-text-main-light)`; `--rrll-bg-app: var(--rrll-bg-app-light)`; `--rrll-surface-base: #f7fafc`; `--rrll-surface-card: var(--rrll-bg-card-light)`; `--rrll-surface-raised: #f8fafc`; `--rrll-surface-header: var(--rrll-bg-table-head-light)`; `--rrll-surface-hover: var(--rrll-bg-table-hover-light)`; `--rrll-surface-soft: var(--rrll-bg-soft-light)`; `--rrll-field-bg: var(--rrll-bg-panel-light)`; `--rrll-field-bg-focus: #f8fbff`; `--rrll-border: var(--rrll-border-light)`; `--rrll-border-strong: rgba(100, 116, 139, .42)`; `--rrll-text-main: var(--rrll-text-main-light)`; `--rrll-text-soft: var(--rrll-text-secondary-light)`; `--rrll-text-muted: var(--rrll-text-muted-light)`; `--rrll-shadow-soft: 0 12px 28px rgba(15, 23, 42, .08)`; `--rrll-shadow-panel: 0 16px 34px rgba(15, 23, 42, .10)`; `--rrll-shadow-modal: 0 22px 56px rgba(15, 23, 42, .18)`; `color-scheme: light`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.3 `html[data-theme="dark"]`

- **Archivo origen:** `app/styles/00-base.css:97` (global).
- **Archivo(s) con variantes:** `app/styles/01-variables.css:232` (global), `app/styles/70-components-final.css:2343` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:97` (global): `--bg: #222936`; `--panel: #2b313d`; `--text: #e5e7eb`; `--muted: #aab3c2`; `--border: rgba(148, 163, 184, .18)`; `--black: #343b46`; `--red: #ef4444`; `--red-dark: #dc2626`; `--soft-red: rgba(239, 68, 68, .12)`; `--warning: rgba(245, 158, 11, .14)`; `--expired: rgba(239, 68, 68, .14)`; `--chart-gray: #6b7280`; `--shadow: 0 18px 42px rgba(17, 24, 39, .22)`; `--rrll-bg-app: #222936`; `--rrll-surface-base: #242b36`; `--rrll-surface-card: #2b313d`; `--rrll-surface-raised: #303746`; `--rrll-surface-header: #343b46`; `--rrll-surface-hover: #3a4152`; `--rrll-field-bg: #343b46`; `--rrll-field-bg-focus: #3a4152`; `--rrll-border: rgba(148, 163, 184, .18)`; `--rrll-border-strong: rgba(170, 179, 194, .28)`; `--rrll-text-main: #e5e7eb`; `--rrll-text-soft: #cbd5e1`; `--rrll-text-muted: #aab3c2`; `--rrll-shadow-soft: 0 16px 36px rgba(15, 23, 42, .18)`; `--rrll-shadow-red: 0 14px 30px rgba(185, 37, 27, .23)`; `color-scheme: dark`.
  - `app/styles/01-variables.css:232` (global): `--rrll-bg-app-dark: #1f2630`; `--rrll-bg-panel-dark: #2b313d`; `--rrll-bg-card-dark: #303746`; `--rrll-bg-soft-dark: #343b46`; `--rrll-bg-table-head-dark: #343b46`; `--rrll-bg-table-row-dark: #2b313d`; `--rrll-bg-table-hover-dark: #3b4350`; `--rrll-sidebar-dark: #171c24`; `--rrll-sidebar-hover-dark: #232a35`; `--rrll-sidebar-active-dark: #2f3947`; `--rrll-text-main-dark: #f1f5f9`; `--rrll-text-secondary-dark: #cbd5e1`; `--rrll-text-muted-dark: #94a3b8`; `--rrll-text-placeholder-dark: #64748b`; `--rrll-border-dark: rgba(148,163,184,.18)`; `--rrll-border-soft-dark: rgba(148,163,184,.10)`; `--rrll-input-bg-dark: #2b313d`; `--rrll-input-focus-dark: #343b46`; `--rrll-success-dark: #22c55e`; `--rrll-warning-dark: #f59e0b`; `--rrll-error-dark: #ef4444`; `--rrll-info-dark: #60a5fa`; `--bg: var(--rrll-bg-app-dark)`; `--panel: var(--rrll-bg-panel-dark)`; `--text: var(--rrll-text-main-dark)`; `--muted: var(--rrll-text-muted-dark)`; `--border: var(--rrll-border-dark)`; `--black: var(--rrll-bg-soft-dark)`; `--red: var(--rrll-red-ui)`; `--soft-red: rgba(239, 68, 68, .12)`; `--warning: rgba(245, 158, 11, .14)`; `--expired: rgba(239, 68, 68, .14)`; `--chart-gray: #6b7280`; `--shadow: var(--rrll-shadow-dark)`; `--rrll-bg-app: var(--rrll-bg-app-dark)`; `--rrll-surface-base: var(--rrll-bg-panel-dark)`; `--rrll-surface-card: var(--rrll-bg-panel-dark)`; `--rrll-surface-raised: var(--rrll-bg-card-dark)`; `--rrll-surface-header: var(--rrll-bg-table-head-dark)`; `--rrll-surface-hover: var(--rrll-bg-table-hover-dark)`; `--rrll-field-bg: var(--rrll-input-bg-dark)`; `--rrll-field-bg-focus: var(--rrll-input-focus-dark)`; `--rrll-border: var(--rrll-border-dark)`; `--rrll-border-strong: var(--rrll-border-soft-dark)`; `--rrll-text-main: var(--rrll-text-main-dark)`; `--rrll-text-soft: var(--rrll-text-secondary-dark)`; `--rrll-text-muted: var(--rrll-text-muted-dark)`; `--rrll-shadow-soft: var(--rrll-shadow-dark)`; `--rrll-shadow-red: 0 14px 30px rgba(185, 37, 27, .23)`; `--phase4-sidebar-bg: var(--rrll-sidebar-dark)`; `--phase4-sidebar-bg-2: var(--rrll-sidebar-active-dark)`; `--phase4-sidebar-hover: var(--rrll-sidebar-hover-dark)`; `--bg-primary: var(--rrll-bg-app-dark)`; `--bg-secondary: var(--rrll-bg-soft-dark)`; `--surface: var(--rrll-bg-card-dark)`; `--surface-elevated: var(--rrll-bg-panel-dark)`; `--text-primary: var(--rrll-text-main-dark)`; `--text-secondary: var(--rrll-text-secondary-dark)`; `--text-muted: var(--rrll-text-muted-dark)`; `--border-soft: var(--rrll-border-soft-dark)`; `--accent-primary: var(--rrll-red-ui)`; `--success: var(--rrll-success-dark)`; `--warning-color: var(--rrll-warning-dark)`; `--danger: var(--rrll-error-dark)`; `--info: var(--rrll-info-dark)`; `color-scheme: dark`.
  - `app/styles/70-components-final.css:2343` (global): `--rrll-shadow-soft: 0 10px 26px rgba(15, 23, 42, .14)`; `--rrll-shadow-panel: 0 12px 30px rgba(15, 23, 42, .16)`; `--rrll-shadow-modal: 0 22px 56px rgba(15, 23, 42, .30)`; `--rrll-border: rgba(148, 163, 184, .16)`; `--rrll-border-strong: rgba(170, 179, 194, .24)`; `--rrll-component-shadow: var(--rrll-shadow-panel)`; `--rrll-component-shadow-soft: var(--rrll-shadow-soft)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.4 `*`

- **Archivo origen:** `app/styles/00-base.css:142` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1748` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:142` (global): `box-sizing: border-box`.
  - `app/styles/30-modules.css:1748` (global): `scrollbar-width: thin`; `scrollbar-color: rgba(148,163,184,.42) rgba(36,42,54,.48)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.5 `body`

- **Archivo origen:** `app/styles/00-base.css:144` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:420` (global), `app/styles/20-components.css:10` (global), `app/styles/30-modules.css:1834` (global), `app/styles/65-normalize.css:15` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:144` (global): `margin: 0`; `font-family: Arial, Helvetica, sans-serif`; `background: var(--bg)`; `color: var(--text)`.
  - `app/styles/10-layout.css:420` (global): `background: linear-gradient(180deg, #f3f6fb 0%, #eef2f7 100%)`; `-webkit-font-smoothing: antialiased`; `text-rendering: optimizeLegibility`.
  - `app/styles/20-components.css:10` (global): `font-family: Inter, Segoe UI, Arial, Helvetica, sans-serif !important`.
  - `app/styles/30-modules.css:1834` (global): `text-rendering: geometricPrecision`; `-webkit-font-smoothing: antialiased`; `-moz-osx-font-smoothing: grayscale`.
  - `app/styles/65-normalize.css:15` (global): `font-size: var(--rrll-font-base)`; `line-height: var(--rrll-line-normal)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.6 `.top-strip`

- **Archivo origen:** `app/styles/00-base.css:151` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:496` (@media (max-width: 1200px)), `app/styles/00-base.css:828` (global), `app/styles/20-components.css:28` (global), `app/styles/60-overrides.css:1916` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:151` (global): `background: white`; `border-bottom: 1px solid var(--border)`; `padding: 16px 28px`; `display: flex`; `align-items: center`; `gap: 22px`.
  - `app/styles/00-base.css:496` (@media (max-width: 1200px)): `flex-wrap: wrap`.
  - `app/styles/00-base.css:828` (global): `position: sticky`; `top: 0`; `z-index: 5000`; `padding: 8px 22px`; `min-height: 64px`.
  - `app/styles/20-components.css:28` (global): `background: rgba(8,12,18,.94) !important`; `border-bottom: 1px solid var(--border) !important`; `box-shadow: 0 14px 28px rgba(0,0,0,.22) !important`; `min-height: 56px !important`; `padding: 8px 22px !important`.
  - `app/styles/60-overrides.css:1916` (global): `min-height: 58px !important`; `padding: 10px 18px !important`; `gap: 12px !important`; `align-items: center !important`; `background: linear-gradient(135deg, rgba(28,35,47,.96), rgba(42,50,64,.92)) !important`; `border: 1px solid rgba(148,163,184,.16) !important`; `border-radius: 0 0 18px 18px !important`; `box-shadow: 0 12px 30px rgba(15,23,42,.18) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.7 `.brand-mark`

- **Archivo origen:** `app/styles/00-base.css:160` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:836` (global), `app/styles/20-components.css:36` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:160` (global): `width: 74px`; `height: 52px`; `border: 4px solid var(--red)`; `border-radius: 50%`; `position: relative`; `flex: 0 0 auto`.
  - `app/styles/00-base.css:836` (global): `width: 52px`; `height: 36px`; `border-width: 3px`.
  - `app/styles/20-components.css:36` (global): `width: 58px !important`; `height: 40px !important`; `border-color: var(--red) !important`; `opacity: .95`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.8 `.brand-mark::before, .brand-mark::after`

- **Archivo origen:** `app/styles/00-base.css:169` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:842` (global), `app/styles/20-components.css:43` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:169` (global): `content: ""`; `position: absolute`; `top: -4px`; `width: 74px`; `height: 52px`; `border: 4px solid var(--red)`; `border-radius: 50%`.
  - `app/styles/00-base.css:842` (global): `top: -3px`; `width: 52px`; `height: 36px`; `border-width: 3px`.
  - `app/styles/20-components.css:43` (global): `width: 58px !important`; `height: 40px !important`; `border-color: var(--red) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.9 `.brand-mark::before`

- **Archivo origen:** `app/styles/00-base.css:180` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:850` (global), `app/styles/20-components.css:50` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:180` (global): `left: -17px`.
  - `app/styles/00-base.css:850` (global): `left: -12px`.
  - `app/styles/20-components.css:50` (global): `left: -13px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.10 `.brand-mark::after`

- **Archivo origen:** `app/styles/00-base.css:181` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:851` (global), `app/styles/20-components.css:51` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:181` (global): `left: 17px`.
  - `app/styles/00-base.css:851` (global): `left: 12px`.
  - `app/styles/20-components.css:51` (global): `left: 13px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.11 `.brand-text`

- **Archivo origen:** `app/styles/00-base.css:183` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:853` (global), `app/styles/20-components.css:59` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:183` (global): `font-size: 30px`; `font-weight: 700`; `line-height: 1.05`.
  - `app/styles/00-base.css:853` (global): `font-size: 22px`.
  - `app/styles/20-components.css:59` (global): `font-size: 25px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.12 `.top-title`

- **Archivo origen:** `app/styles/00-base.css:196` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:495` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:196` (global): `margin-left: auto`; `text-align: right`.
  - `app/styles/00-base.css:495` (@media (max-width: 1200px)): `text-align: left`; `margin-left: 0`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.13 `.top-title h1`

- **Archivo origen:** `app/styles/00-base.css:201` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:857` (global), `app/styles/20-components.css:63` (global), `app/styles/20-components.css:611` (@media (max-width: 1100px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:201` (global): `margin: 0`; `font-size: 28px`; `font-weight: 800`.
  - `app/styles/00-base.css:857` (global): `font-size: 22px`.
  - `app/styles/20-components.css:63` (global): `font-size: 24px !important`.
  - `app/styles/20-components.css:611` (@media (max-width: 1100px)): `font-size: 20px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.14 `.top-title p`

- **Archivo origen:** `app/styles/00-base.css:207` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:861` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:207` (global): `margin: 6px 0 0`; `color: var(--muted)`; `font-size: 14px`.
  - `app/styles/00-base.css:861` (global): `font-size: 12px`; `margin-top: 3px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.15 `.grid`

- **Archivo origen:** `app/styles/00-base.css:219` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:491` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:219` (global): `display: grid`; `grid-template-columns: 390px 1fr`; `gap: 20px`; `align-items: start`.
  - `app/styles/00-base.css:491` (@media (max-width: 1200px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.16 `h2`

- **Archivo origen:** `app/styles/00-base.css:235` (global).
- **Archivo(s) con variantes:** `app/styles/65-normalize.css:35` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:235` (global): `font-size: 19px`; `margin: 0 0 14px`.
  - `app/styles/65-normalize.css:35` (global): `font-size: var(--rrll-font-xl)`; `line-height: var(--rrll-line-tight)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.17 `h3`

- **Archivo origen:** `app/styles/00-base.css:240` (global).
- **Archivo(s) con variantes:** `app/styles/65-normalize.css:36` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:240` (global): `font-size: 16px`; `margin: 0 0 10px`.
  - `app/styles/65-normalize.css:36` (global): `font-size: var(--rrll-font-lg)`; `line-height: var(--rrll-line-tight)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.18 `.quick-top`

- **Archivo origen:** `app/styles/00-base.css:273` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:870` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:273` (global): `margin-bottom: 20px`.
  - `app/styles/00-base.css:870` (global): `margin-bottom: 12px`; `padding: 8px 10px`; `border-top-width: 4px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.19 `.quick-grid.horizontal`

- **Archivo origen:** `app/styles/00-base.css:277` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:881` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:277` (global): `grid-template-columns: repeat(5, minmax(120px, 1fr))`.
  - `app/styles/00-base.css:881` (global): `grid-template-columns: repeat(6, minmax(86px, 1fr))`; `gap: 7px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.20 `.compact-menu .launch-button`

- **Archivo origen:** `app/styles/00-base.css:281` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:886` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:281` (global): `padding: 8px 10px`; `font-size: 13px`.
  - `app/styles/00-base.css:886` (global): `padding: 6px 6px`; `font-size: 11px`; `line-height: 1.1`; `min-width: 0`; `white-space: nowrap`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.21 `button, .launch-button`

- **Archivo origen:** `app/styles/00-base.css:286` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:301` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:286` (global): `cursor: pointer`; `border: 0`; `border-radius: 3px`; `padding: 11px 13px`; `font-weight: 800`; `background: var(--red)`; `color: white`; `text-align: center`; `text-decoration: none`; `display: inline-block`; `transition: transform 0.05s ease, background 0.15s ease`.
  - `app/styles/20-components.css:301` (global): `background: linear-gradient(135deg, var(--red), var(--red-dark)) !important`; `color: #fff !important`; `border: 1px solid rgba(255,255,255,.10) !important`; `border-radius: 12px !important`; `box-shadow: 0 12px 22px rgba(239,43,45,.18) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.22 `button:hover, .launch-button:hover`

- **Archivo origen:** `app/styles/00-base.css:300` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:310` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:300` (global): `background: var(--red-dark)`.
  - `app/styles/20-components.css:310` (global): `filter: brightness(1.08)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.23 `button.danger`

- **Archivo origen:** `app/styles/00-base.css:322` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:331` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:322` (global): `background: #8f1d15`.
  - `app/styles/20-components.css:331` (global): `background: linear-gradient(135deg, #e11d2e, #7f151b) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.24 `input, select, textarea`

- **Archivo origen:** `app/styles/00-base.css:346` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:574` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:346` (global): `width: 100%`; `border: 1px solid var(--border)`; `border-radius: 3px`; `padding: 10px`; `font-family: inherit`; `font-size: 14px`; `background: white`.
  - `app/styles/10-layout.css:574` (global): `border-radius: 10px`; `border-color: rgba(15,23,42,.16)`; `background: #fff`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.25 `textarea`

- **Archivo origen:** `app/styles/00-base.css:356` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:581` (global), `app/styles/65-normalize.css:67` (global), `app/styles/70-components-final.css:495` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:356` (global): `resize: vertical`; `min-height: 70px`.
  - `app/styles/10-layout.css:581` (global): `resize: vertical`.
  - `app/styles/65-normalize.css:67` (global): `min-height: 76px`; `padding: var(--rrll-control-padding-y) var(--rrll-control-padding-x)`.
  - `app/styles/70-components-final.css:495` (global): `resize: vertical`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.26 `.columns`

- **Archivo origen:** `app/styles/00-base.css:361` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:492` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:361` (global): `display: grid`; `grid-template-columns: repeat(3, 1fr)`; `gap: 14px`.
  - `app/styles/00-base.css:492` (@media (max-width: 1200px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.27 `.column`

- **Archivo origen:** `app/styles/00-base.css:367` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:354` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:367` (global): `background: #fafafa`; `border: 1px solid var(--border)`; `border-radius: 4px`; `padding: 12px`; `min-height: 420px`.
  - `app/styles/20-components.css:354` (global): `background: linear-gradient(180deg, rgba(17,24,32,.96), rgba(12,18,25,.96)) !important`; `border-radius: 18px !important`; `padding: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.28 `.column-header`

- **Archivo origen:** `app/styles/00-base.css:375` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:617` (global), `app/styles/20-components.css:360` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:375` (global): `display: flex`; `justify-content: space-between`; `align-items: center`; `margin-bottom: 12px`; `border-bottom: 3px solid var(--red)`; `padding-bottom: 8px`.
  - `app/styles/10-layout.css:617` (global): `gap: 8px`.
  - `app/styles/20-components.css:360` (global): `background: rgba(255,255,255,.035) !important`; `border: 1px solid rgba(255,255,255,.06) !important`; `border-radius: 14px !important`; `padding: 11px 12px !important`; `margin-bottom: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.29 `.muted`

- **Archivo origen:** `app/styles/00-base.css:460` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:583` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:460` (global): `color: var(--muted)`; `font-size: 13px`; `line-height: 1.4`.
  - `app/styles/10-layout.css:583` (global): `color: var(--phase4-muted)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.30 `.telework-columns`

- **Archivo origen:** `app/styles/00-base.css:572` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:628` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:572` (global): `display: grid`; `grid-template-columns: repeat(4, 1fr)`; `gap: 14px`.
  - `app/styles/00-base.css:628` (@media (max-width: 1200px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.31 `.modal-backdrop`

- **Archivo origen:** `app/styles/00-base.css:679` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:627` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:679` (global): `position: fixed`; `inset: 0`; `background: rgba(0, 0, 0, 0.45)`; `display: none`; `align-items: flex-start`; `justify-content: center`; `z-index: 9999`; `padding: 20px`; `overflow-y: auto`.
  - `app/styles/10-layout.css:627` (global): `backdrop-filter: blur(5px)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.32 `.modal-actions`

- **Archivo origen:** `app/styles/00-base.css:780` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1043` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:780` (global): `display: flex`; `justify-content: flex-end`; `gap: 8px`; `margin-top: 12px`; `position: sticky`; `bottom: -18px`; `background: white`; `padding-top: 10px`; `padding-bottom: 4px`; `border-top: 1px solid #eee`.
  - `app/styles/30-modules.css:1043` (global): `background: rgba(255,255,255,.035) !important`; `border-top: 1px solid rgba(255,255,255,.08) !important`; `border-radius: 0 0 18px 18px !important`; `padding: 14px 0 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.33 `.agenda-form-v18, .paritaria-form-v18`

- **Archivo origen:** `app/styles/00-base.css:793` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:809` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:793` (global): `display: grid`; `grid-template-columns: 140px 1fr 150px 120px`; `gap: 10px`; `margin-bottom: 12px`.
  - `app/styles/00-base.css:809` (@media (max-width: 1200px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.34 `.rrll-title`

- **Archivo origen:** `app/styles/00-base.css:866` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:72` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:866` (global): `color: var(--red)`.
  - `app/styles/20-components.css:72` (global): `color: var(--red) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.35 `.dashboard-layout`

- **Archivo origen:** `app/styles/00-base.css:894` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:953` (@media (max-width: 1200px)), `app/styles/00-base.css:1807` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:894` (global): `display: grid !important`; `grid-template-columns: minmax(260px, 25%) minmax(0, 75%) !important`; `gap: 20px`; `align-items: start`; `width: 100%`.
  - `app/styles/00-base.css:953` (@media (max-width: 1200px)): `grid-template-columns: 1fr !important`.
  - `app/styles/00-base.css:1807` (global): `transition: grid-template-columns 0.18s ease, gap 0.18s ease`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.36 `.sidebar-left`

- **Archivo origen:** `app/styles/00-base.css:902` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1808` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:902` (global): `min-width: 0`; `width: 100%`.
  - `app/styles/00-base.css:1808` (global): `position: relative`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.37 `.quick-top.compact-quick-panel`

- **Archivo origen:** `app/styles/00-base.css:958` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1820` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:958` (global): `padding: 8px 10px`; `border-top-width: 3px`.
  - `app/styles/00-base.css:1820` (global): `padding: 5px 7px !important`; `margin-bottom: 10px !important`; `border-top-width: 3px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.38 `.quick-card-grid`

- **Archivo origen:** `app/styles/00-base.css:959` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1826` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:959` (global): `display: grid`; `grid-template-columns: repeat(auto-fit, minmax(128px, 1fr))`; `gap: 7px`; `width: 100%`.
  - `app/styles/00-base.css:1826` (global): `grid-template-columns: repeat(6, minmax(86px, 1fr)) !important`; `gap: 5px !important`; `align-items: stretch !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.39 `.quick-card`

- **Archivo origen:** `app/styles/00-base.css:960` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1832` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:960` (global): `position: relative`; `min-width: 0`; `border: 1px solid var(--border)`; `border-left: 4px solid var(--red)`; `background: #fafafa`; `border-radius: 4px`; `padding: 7px`; `display: grid`; `grid-template-columns: 36px minmax(0, 1fr)`; `grid-template-areas: "pie title" "pie legend"`; `column-gap: 7px`; `align-items: center`; `min-height: 58px`; `color: var(--text)`; `text-decoration: none`; `cursor: pointer`.
  - `app/styles/00-base.css:1832` (global): `border-left-width: 3px !important`; `padding: 5px 6px !important`; `min-height: 44px !important`; `grid-template-columns: 28px minmax(0, 1fr) !important`; `column-gap: 5px !important`; `border-radius: 4px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.40 `.quick-card-title`

- **Archivo origen:** `app/styles/00-base.css:962` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1846` (global), `app/styles/65-normalize.css:203` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:962` (global): `grid-area: title`; `display: flex`; `align-items: center`; `gap: 4px`; `font-size: 11px`; `font-weight: 900`; `line-height: 1.15`; `white-space: nowrap`; `overflow: hidden`; `text-overflow: ellipsis`.
  - `app/styles/00-base.css:1846` (global): `font-size: 10px !important`; `line-height: 1.05 !important`; `gap: 3px !important`.
  - `app/styles/65-normalize.css:203` (global): `font-size: var(--rrll-font-xs) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.41 `.quick-card-legend`

- **Archivo origen:** `app/styles/00-base.css:964` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1859` (global), `app/styles/65-normalize.css:207` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:964` (global): `grid-area: legend`; `display: grid`; `grid-template-columns: minmax(0, 1fr) auto`; `gap: 1px 4px`; `font-size: 9.5px`; `color: var(--muted)`; `line-height: 1.12`.
  - `app/styles/00-base.css:1859` (global): `font-size: 8.7px !important`; `line-height: 1.05 !important`; `gap: 0 3px !important`.
  - `app/styles/65-normalize.css:207` (global): `font-size: var(--rrll-font-2xs) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.42 `.module-title`

- **Archivo origen:** `app/styles/00-base.css:1045` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:558` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1045` (global): `display: inline-flex`; `align-items: center`; `gap: 8px`.
  - `app/styles/10-layout.css:558` (global): `min-width: 0`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.43 `.summary-actions`

- **Archivo origen:** `app/styles/00-base.css:1074` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:564` (global), `app/styles/10-layout.css:656` (@media (max-width: 680px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1074` (global): `float: right`; `display: inline-flex`; `gap: 6px`; `align-items: center`; `margin-left: 8px`.
  - `app/styles/10-layout.css:564` (global): `display: inline-flex`; `align-items: center`; `gap: 6px`; `flex-wrap: wrap`.
  - `app/styles/10-layout.css:656` (@media (max-width: 680px)): `width: 100%`; `justify-content: flex-start`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.44 `.summary-counts`

- **Archivo origen:** `app/styles/00-base.css:1083` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:559` (global), `app/styles/10-layout.css:649` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1083` (global): `margin-left: 8px`; `color: var(--muted)`; `font-size: 12px`; `font-weight: 800`; `white-space: nowrap`.
  - `app/styles/10-layout.css:559` (global): `color: var(--phase4-muted)`; `font-weight: 750`; `white-space: nowrap`.
  - `app/styles/10-layout.css:649` (@media (max-width: 980px)): `white-space: normal`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.45 `.summary-icon-button`

- **Archivo origen:** `app/styles/00-base.css:1087` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:565` (global), `app/styles/20-components.css:335` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1087` (global): `background: transparent`; `color: var(--text)`; `border: 1px solid var(--border)`; `padding: 2px 7px`; `font-size: 13px`; `line-height: 1.2`; `border-radius: 3px`; `min-width: 30px`.
  - `app/styles/10-layout.css:565` (global): `border-radius: 10px`; `min-width: 34px`; `min-height: 32px`; `display: inline-flex`; `align-items: center`; `justify-content: center`.
  - `app/styles/20-components.css:335` (global): `min-width: 40px !important`; `min-height: 40px !important`; `border-radius: 13px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.46 `.excel-icon`

- **Archivo origen:** `app/styles/00-base.css:1103` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:341` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1103` (global): `color: #217346`; `font-weight: 900`.
  - `app/styles/20-components.css:341` (global): `color: #9ef0b2 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.47 `.minutes-columns`

- **Archivo origen:** `app/styles/00-base.css:1143` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1148` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1143` (global): `grid-template-columns: repeat(4, minmax(0, 1fr))`.
  - `app/styles/00-base.css:1148` (@media (max-width: 1200px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.48 `.priority-high`

- **Archivo origen:** `app/styles/00-base.css:1190` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:429` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1190` (global): `background: #fff0d6`; `border-color: #e2b84e`.
  - `app/styles/20-components.css:429` (global): `background: rgba(245,158,11,.18) !important`; `border-color: rgba(245,158,11,.42) !important`; `color: #ffd08a !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.49 `.priority-critical`

- **Archivo origen:** `app/styles/00-base.css:1191` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:435` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1191` (global): `background: #ffe4e0`; `border-color: var(--red)`; `color: #8f1d15`.
  - `app/styles/20-components.css:435` (global): `background: rgba(239,43,45,.18) !important`; `border-color: rgba(239,43,45,.46) !important`; `color: #ff989a !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.50 `.task.due-soon, .petition.due-soon`

- **Archivo origen:** `app/styles/00-base.css:1193` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:407` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1193` (global): `background: var(--warning)`.
  - `app/styles/20-components.css:407` (global): `background: rgba(245,158,11,.12) !important`; `border-left-color: #f59e0b !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.51 `.task.expired, .petition.expired`

- **Archivo origen:** `app/styles/00-base.css:1194` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:413` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1194` (global): `background: var(--expired)`.
  - `app/styles/20-components.css:413` (global): `background: rgba(239,68,68,.16) !important`; `border-left-color: #ef4444 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.52 `.print-preview-box`

- **Archivo origen:** `app/styles/00-base.css:1240` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1060` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1240` (global): `width: min(1100px, 96vw)`; `max-height: 92vh`; `display: flex`; `flex-direction: column`.
  - `app/styles/30-modules.css:1060` (global): `max-width: min(1180px, calc(100vw - 42px)) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.53 `.print-preview-content`

- **Archivo origen:** `app/styles/00-base.css:1247` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:549` (global), `app/styles/30-modules.css:1068` (global), `app/styles/30-modules.css:2178` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1247` (global): `border: 1px solid var(--border)`; `background: white`; `padding: 14px`; `overflow: auto`; `max-height: 70vh`; `margin-top: 10px`.
  - `app/styles/20-components.css:549` (global): `background: #fff !important`; `color: var(--rrll-text-main-light) !important`.
  - `app/styles/30-modules.css:1068` (global): `background: #ffffff !important`; `color: var(--rrll-text-main-light) !important`; `border: 0 !important`; `border-radius: 2px !important`; `box-shadow: 0 18px 45px rgba(0,0,0,.28) !important`.
  - `app/styles/30-modules.css:2178` (global): `font-size: 12px !important`; `line-height: 1.35 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.54 `.print-preview-content th`

- **Archivo origen:** `app/styles/00-base.css:1275` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:558` (global), `app/styles/30-modules.css:1080` (global), `app/styles/90-print.css:10` (@media print).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1275` (global): `background: var(--black)`; `color: white`; `text-align: left`.
  - `app/styles/20-components.css:558` (global): `background: var(--rrll-text-main-light) !important`; `color: #fff !important`.
  - `app/styles/30-modules.css:1080` (global): `background: var(--rrll-text-main-light) !important`; `color: #ffffff !important`.
  - `app/styles/90-print.css:10` (@media print): `background: var(--rrll-text-main-light) !important`; `color: #ffffff !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.55 `.print-preview-content th, .print-preview-content td`

- **Archivo origen:** `app/styles/00-base.css:1281` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:2187` (global), `app/styles/30-modules.css:2237` (@media print).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1281` (global): `border: 1px solid #bbbbbb`; `padding: 6px`; `vertical-align: top`.
  - `app/styles/30-modules.css:2187` (global): `font-size: 11px !important`; `line-height: 1.32 !important`; `padding: 7px 8px !important`.
  - `app/styles/30-modules.css:2237` (@media print): `font-size: 10px !important`; `padding: 5px 6px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.56 `.workflow-columns:not(.closed-open) .workflow-closed-column`

- **Archivo origen:** `app/styles/00-base.css:1323` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1376` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1323` (global): `padding: 8px 4px`; `min-height: 420px`; `background: var(--soft-red)`; `border-left: 3px solid var(--red)`.
  - `app/styles/00-base.css:1376` (@media (max-width: 1200px)): `min-height: 48px`; `padding: 10px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.57 `.workflow-columns:not(.closed-open) .workflow-closed-column .column-header`

- **Archivo origen:** `app/styles/00-base.css:1330` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1381` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1330` (global): `height: 100%`; `min-height: 390px`; `padding: 0`; `border-bottom: 0`; `justify-content: center`; `align-items: center`; `flex-direction: column`; `gap: 8px`.
  - `app/styles/00-base.css:1381` (@media (max-width: 1200px)): `min-height: auto`; `height: auto`; `flex-direction: row`; `justify-content: space-between`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.58 `.workflow-columns:not(.closed-open) .workflow-closed-column h3`

- **Archivo origen:** `app/styles/00-base.css:1341` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1388` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1341` (global): `writing-mode: vertical-rl`; `transform: rotate(180deg)`; `white-space: nowrap`; `font-size: 13px`; `margin: 0`.
  - `app/styles/00-base.css:1388` (@media (max-width: 1200px)): `writing-mode: horizontal-tb`; `transform: none`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.59 `.db-sync-notice`

- **Archivo origen:** `app/styles/00-base.css:1413` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:223` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1413` (global): `display: none`; `margin-top: 8px`; `padding: 8px 10px`; `border-left: 4px solid var(--red)`; `background: var(--soft-red)`; `font-size: 12px`; `font-weight: 800`.
  - `app/styles/50-module-extras.css:223` (global): `background: rgba(48,55,70,.88) !important`; `color: #cbd5e1 !important`; `border: 1px solid rgba(148,163,184,.18) !important`; `border-left: 3px solid #3b82f6 !important`; `border-radius: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.60 `.save-status-widget`

- **Archivo origen:** `app/styles/00-base.css:1428` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1513` (@media (max-width: 700px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1428` (global): `position: fixed`; `right: 18px`; `bottom: 18px`; `z-index: 6000`; `display: flex`; `align-items: center`; `gap: 8px`; `min-width: 210px`; `max-width: 340px`; `padding: 9px 12px`; `border: 1px solid var(--border)`; `border-left: 5px solid #8a8a8a`; `background: rgba(255, 255, 255, 0.96)`; `box-shadow: var(--shadow)`; `border-radius: 6px`; `font-size: 12px`; `color: var(--text)`.
  - `app/styles/00-base.css:1513` (@media (max-width: 700px)): `left: 12px`; `right: 12px`; `bottom: 12px`; `max-width: none`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.61 `.session-form`

- **Archivo origen:** `app/styles/00-base.css:1522` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:879` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1522` (global): `display: grid`; `grid-template-columns: 160px 180px 1fr 120px`; `gap: 10px`; `margin-bottom: 12px`.
  - `app/styles/30-modules.css:879` (global): `display: grid !important`; `grid-template-columns: 170px 210px minmax(280px, 1fr) auto !important`; `gap: 12px !important`; `background: rgba(255,255,255,.030) !important`; `border: 1px solid rgba(255,255,255,.08) !important`; `border-radius: 16px !important`; `margin: 16px 18px 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.62 `.session-columns`

- **Archivo origen:** `app/styles/00-base.css:1529` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:909` (global), `app/styles/30-modules.css:981` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1529` (global): `display: grid`; `grid-template-columns: minmax(360px, 1fr) 44px`; `gap: 14px`; `transition: grid-template-columns 0.2s ease`.
  - `app/styles/30-modules.css:909` (global): `display: grid !important`; `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important`; `gap: 16px !important`; `padding: 0 18px 18px !important`.
  - `app/styles/30-modules.css:981` (@media (max-width: 1250px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.63 `.session-panel`

- **Archivo origen:** `app/styles/00-base.css:1540` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:916` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1540` (global): `overflow: hidden`; `transition: background 0.2s ease`.
  - `app/styles/30-modules.css:916` (global): `background: rgba(255,255,255,.030) !important`; `border: 1px solid rgba(255,255,255,.08) !important`; `border-radius: 16px !important`; `overflow: hidden !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.64 `.session-panel-collapsed .column-header`

- **Archivo origen:** `app/styles/00-base.css:1552` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1983` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1552` (global): `height: 100%`; `min-height: 390px`; `padding: 8px 0 0`; `border-bottom: 0`; `justify-content: flex-start`; `align-items: center`; `flex-direction: column`; `gap: 8px`.
  - `app/styles/00-base.css:1983` (global): `cursor: pointer`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.65 `.session-year-block`

- **Archivo origen:** `app/styles/00-base.css:1591` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:960` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1591` (global): `border: 1px solid var(--border)`; `border-left: 5px solid var(--red)`; `background: #ffffff`; `border-radius: 3px`; `margin-bottom: 10px`; `box-shadow: 0 3px 10px rgba(0,0,0,.04)`; `overflow: hidden`.
  - `app/styles/30-modules.css:960` (global): `background: rgba(255,255,255,.025) !important`; `border: 1px solid rgba(255,255,255,.075) !important`; `border-radius: 14px !important`; `overflow: hidden !important`; `margin-bottom: 10px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.66 `.session-title`

- **Archivo origen:** `app/styles/00-base.css:1654` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:943` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1654` (global): `font-weight: 800`; `margin-bottom: 6px`.
  - `app/styles/30-modules.css:943` (global): `color: #fff !important`; `font-weight: 850 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.67 `.session-meta, .session-item-meta`

- **Archivo origen:** `app/styles/00-base.css:1659` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:948` (global).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1659` (global): `color: var(--muted)`; `font-size: 12px`; `line-height: 1.35`; `white-space: pre-wrap`.
  - `app/styles/30-modules.css:948` (global): `color: rgba(148,163,184,.88) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.68 `.dashboard-layout.sidebar-collapsed`

- **Archivo origen:** `app/styles/00-base.css:1811` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1816` (@media (max-width:1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1811` (global): `grid-template-columns: 44px minmax(0,1fr) !important`; `gap: 10px`.
  - `app/styles/00-base.css:1816` (@media (max-width:1200px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.69 `.dashboard-layout.sidebar-collapsed .sidebar-left`

- **Archivo origen:** `app/styles/00-base.css:1813` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1816` (@media (max-width:1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1813` (global): `min-width: 44px`; `width: 44px`.
  - `app/styles/00-base.css:1816` (@media (max-width:1200px)): `width: 100%`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.70 `.dashboard-layout.sidebar-collapsed .sidebar-collapse-toggle`

- **Archivo origen:** `app/styles/00-base.css:1814` (global).
- **Archivo(s) con variantes:** `app/styles/00-base.css:1816` (@media (max-width:1200px)).
- **Propiedades por aparición:**
  - `app/styles/00-base.css:1814` (global): `min-height: 150px`; `padding: 10px 5px`; `writing-mode: vertical-rl`; `text-orientation: mixed`; `white-space: nowrap`.
  - `app/styles/00-base.css:1816` (@media (max-width:1200px)): `writing-mode: horizontal-tb`; `min-height: 0`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.71 `.phase4-shell`

- **Archivo origen:** `app/styles/10-layout.css:4` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:158` (@media (max-width: 980px)), `app/styles/10-layout.css:637` (@media (max-width: 1280px)), `app/styles/20-components.css:15` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:4` (global): `display: grid`; `grid-template-columns: 260px minmax(0, 1fr)`; `min-height: 100vh`; `background: #f4f6fa`.
  - `app/styles/10-layout.css:158` (@media (max-width: 980px)): `grid-template-columns: 1fr`.
  - `app/styles/10-layout.css:637` (@media (max-width: 1280px)): `grid-template-columns: 230px minmax(0, 1fr)`.
  - `app/styles/20-components.css:15` (global): `background: transparent !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.72 `.phase4-sidebar`

- **Archivo origen:** `app/styles/10-layout.css:11` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:162` (@media (max-width: 980px)), `app/styles/10-layout.css:426` (global), `app/styles/10-layout.css:638` (@media (max-width: 1280px)), `app/styles/10-layout.css:644` (@media (max-width: 980px)), `app/styles/10-layout.css:1209` (global), `app/styles/10-layout.css:1716` (global), `app/styles/20-components.css:77` (global), `app/styles/30-modules.css:1297` (global), `app/styles/41-theme-light.css:1054` (global), `app/styles/41-theme-light.css:1201` (@media (max-height: 820px)), `app/styles/50-module-extras.css:946` (global), `app/styles/50-module-extras.css:2414` (global), `app/styles/60-overrides.css:19` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:11` (global): `position: sticky`; `top: 0`; `height: 100vh`; `background: linear-gradient(180deg, #082a50 0%, #051b35 100%)`; `color: #eef5ff`; `padding: 18px 14px`; `box-sizing: border-box`; `display: flex`; `flex-direction: column`; `gap: 14px`; `box-shadow: 4px 0 18px rgba(0, 0, 0, 0.16)`; `z-index: 30`.
  - `app/styles/10-layout.css:162` (@media (max-width: 980px)): `position: relative`; `height: auto`; `display: block`; `padding-bottom: 10px`.
  - `app/styles/10-layout.css:426` (global): `width: 260px`; `overflow-y: auto`; `scrollbar-width: thin`; `scrollbar-color: rgba(255,255,255,.28) transparent`.
  - `app/styles/10-layout.css:638` (@media (max-width: 1280px)): `width: 230px`.
  - `app/styles/10-layout.css:644` (@media (max-width: 980px)): `width: 100%`; `height: auto`; `max-height: none`.
  - `app/styles/10-layout.css:1209` (global): `background: linear-gradient(180deg, var(--phase4-sidebar-bg) 0%, var(--phase4-sidebar-bg-2) 100%) !important`; `color: var(--phase4-sidebar-text) !important`; `box-shadow: 4px 0 18px rgba(0, 0, 0, 0.18)`.
  - `app/styles/10-layout.css:1716` (global): `background: linear-gradient(180deg, #2b2f36 0%, #22262d 100%) !important`; `border-right: 1px solid rgba(255,255,255,.08) !important`.
  - `app/styles/20-components.css:77` (global): `background: linear-gradient(180deg, #0f141b 0%, #080d13 100%) !important`; `border-right: 1px solid var(--border) !important`; `box-shadow: 18px 0 38px rgba(0,0,0,.32) !important`.
  - `app/styles/30-modules.css:1297` (global): `background: linear-gradient(180deg, #202734 0%, #1e2430 54%, #1b212b 100%) !important`; `border-right: 1px solid rgba(148,163,184,.20) !important`; `box-shadow: 18px 0 48px rgba(3,7,18,.18) !important`.
  - `app/styles/41-theme-light.css:1054` (global): `gap: 9px !important`; `overflow-x: hidden !important`; `overflow-y: auto !important`; `scrollbar-width: thin !important`; `scrollbar-color: rgba(203, 213, 225, .24) transparent !important`.
  - `app/styles/41-theme-light.css:1201` (@media (max-height: 820px)): `gap: 7px !important`; `padding-top: 10px !important`; `padding-bottom: 10px !important`.
  - `app/styles/50-module-extras.css:946` (global): `padding-top: 14px !important`.
  - `app/styles/50-module-extras.css:2414` (global): `padding: 12px 10px !important`; `gap: 8px !important`; `overflow-x: hidden !important`; `scrollbar-width: thin !important`; `scrollbar-color: rgba(148,163,184,.34) transparent !important`.
  - `app/styles/60-overrides.css:19` (global): `padding-top: 12px !important`; `background: linear-gradient(180deg, #242b36 0%, var(--rrll-bg-app-dark) 100%) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.73 `.phase4-sidebar-brand`

- **Archivo origen:** `app/styles/10-layout.css:26` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:434` (global), `app/styles/10-layout.css:645` (@media (max-width: 980px)), `app/styles/10-layout.css:1215` (global), `app/styles/20-components.css:83` (global), `app/styles/30-modules.css:1329` (global), `app/styles/50-module-extras.css:949` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:26` (global): `display: flex`; `align-items: center`; `gap: 12px`; `padding: 6px 8px 18px`; `border-bottom: 1px solid rgba(255, 255, 255, 0.12)`.
  - `app/styles/10-layout.css:434` (global): `position: sticky`; `top: 0`; `background: linear-gradient(180deg, rgba(8,42,80,.98), rgba(8,42,80,.92))`; `z-index: 2`; `backdrop-filter: blur(10px)`.
  - `app/styles/10-layout.css:645` (@media (max-width: 980px)): `position: static`.
  - `app/styles/10-layout.css:1215` (global): `background: linear-gradient(180deg, rgba(43,47,54,.98), rgba(35,39,46,.94)) !important`; `border-bottom-color: rgba(229, 231, 235, 0.12) !important`.
  - `app/styles/20-components.css:83` (global): `border-bottom: 1px solid var(--border) !important`.
  - `app/styles/30-modules.css:1329` (global): `box-shadow: none !important`; `background: rgba(48,56,69,.55) !important`.
  - `app/styles/50-module-extras.css:949` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.74 `.phase4-sidebar-logo`

- **Archivo origen:** `app/styles/10-layout.css:34` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:441` (global), `app/styles/20-components.css:100` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:34` (global): `width: 38px`; `height: 38px`; `border-radius: 12px`; `display: grid`; `place-items: center`; `font-weight: 900`; `background: #e30613`; `color: white`; `letter-spacing: -1px`.
  - `app/styles/10-layout.css:441` (global): `box-shadow: 0 10px 22px rgba(227, 6, 19, .28)`.
  - `app/styles/20-components.css:100` (global): `background: linear-gradient(135deg, #ef2b2d, #9f171b) !important`; `color: #fff !important`; `box-shadow: 0 16px 30px rgba(239,43,45,.24) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.75 `.phase4-nav`

- **Archivo origen:** `app/styles/10-layout.css:59` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:169` (@media (max-width: 980px)), `app/styles/41-theme-light.css:1075` (global), `app/styles/41-theme-light.css:1206` (@media (max-height: 820px)), `app/styles/50-module-extras.css:2424` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:59` (global): `display: flex`; `flex-direction: column`; `gap: 6px`.
  - `app/styles/10-layout.css:169` (@media (max-width: 980px)): `display: grid`; `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))`.
  - `app/styles/41-theme-light.css:1075` (global): `gap: 4px !important`.
  - `app/styles/41-theme-light.css:1206` (@media (max-height: 820px)): `gap: 3px !important`.
  - `app/styles/50-module-extras.css:2424` (global): `gap: 4px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.76 `.phase4-sidebar-section`

- **Archivo origen:** `app/styles/10-layout.css:65` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1101` (global), `app/styles/41-theme-light.css:1219` (@media (max-height: 820px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:65` (global): `margin: 12px 8px 2px`; `color: rgba(238, 245, 255, 0.58)`; `text-transform: uppercase`; `font-size: 11px`; `letter-spacing: 0.09em`; `font-weight: 800`.
  - `app/styles/41-theme-light.css:1101` (global): `margin: 8px 8px 1px !important`; `letter-spacing: .075em !important`.
  - `app/styles/41-theme-light.css:1219` (@media (max-height: 820px)): `margin-top: 6px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.77 `.phase4-nav-item`

- **Archivo origen:** `app/styles/10-layout.css:74` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:442` (global), `app/styles/10-layout.css:639` (@media (max-width: 1280px)), `app/styles/41-theme-light.css:1084` (global), `app/styles/41-theme-light.css:1209` (@media (max-height: 820px)), `app/styles/50-module-extras.css:2425` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:74` (global): `display: flex`; `align-items: center`; `gap: 10px`; `min-height: 38px`; `padding: 8px 10px`; `border-radius: 10px`; `color: rgba(238, 245, 255, 0.86)`; `text-decoration: none`; `font-weight: 750`; `font-size: 14px`; `transition: background 0.15s ease, color 0.15s ease, transform 0.05s ease`.
  - `app/styles/10-layout.css:442` (global): `border: 1px solid transparent`; `line-height: 1.15`.
  - `app/styles/10-layout.css:639` (@media (max-width: 1280px)): `font-size: 13px`.
  - `app/styles/41-theme-light.css:1084` (global): `min-height: 33px !important`; `padding: 6px 9px !important`; `border-radius: 9px !important`.
  - `app/styles/41-theme-light.css:1209` (@media (max-height: 820px)): `min-height: 31px !important`; `padding-top: 5px !important`; `padding-bottom: 5px !important`.
  - `app/styles/50-module-extras.css:2425` (global): `min-height: 34px !important`; `padding: 7px 9px !important`; `gap: 9px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.78 `.phase4-sidebar-footer`

- **Archivo origen:** `app/styles/10-layout.css:98` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:174` (@media (max-width: 980px)), `app/styles/50-module-extras.css:4` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:98` (global): `margin-top: auto`; `padding: 14px 8px 4px`; `border-top: 1px solid rgba(255, 255, 255, 0.12)`; `color: rgba(238, 245, 255, 0.62)`; `font-size: 12px`.
  - `app/styles/10-layout.css:174` (@media (max-width: 980px)): `display: none`.
  - `app/styles/50-module-extras.css:4` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.79 `.phase4-main`

- **Archivo origen:** `app/styles/10-layout.css:106` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:19` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:106` (global): `min-width: 0`.
  - `app/styles/20-components.css:19` (global): `background: linear-gradient(180deg, #090e14 0%, #070b10 100%) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.80 `.phase4-main .top-strip`

- **Archivo origen:** `app/styles/10-layout.css:110` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:178` (@media (max-width: 980px)), `app/styles/10-layout.css:458` (global), `app/styles/10-layout.css:646` (@media (max-width: 980px)), `app/styles/10-layout.css:1085` (global), `app/styles/10-layout.css:1602` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:110` (global): `position: sticky`; `top: 0`; `z-index: 20`; `min-height: 64px`; `padding: 12px 24px`; `box-sizing: border-box`; `box-shadow: 0 5px 18px rgba(12, 29, 54, 0.07)`.
  - `app/styles/10-layout.css:178` (@media (max-width: 980px)): `position: static`.
  - `app/styles/10-layout.css:458` (global): `background: rgba(255,255,255,.92)`; `backdrop-filter: blur(10px)`; `border-bottom: 1px solid var(--phase4-line)`.
  - `app/styles/10-layout.css:646` (@media (max-width: 980px)): `flex-wrap: wrap`; `gap: 10px`.
  - `app/styles/10-layout.css:1085` (global): `min-height: 54px`; `padding: 8px 18px`.
  - `app/styles/10-layout.css:1602` (global): `min-height: 54px !important`; `padding-top: 8px !important`; `padding-bottom: 8px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.81 `.phase4-main .top-title h1`

- **Archivo origen:** `app/styles/10-layout.css:141` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:463` (global), `app/styles/10-layout.css:1089` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:141` (global): `font-size: 22px`.
  - `app/styles/10-layout.css:463` (global): `color: var(--phase4-text)`; `letter-spacing: -0.02em`.
  - `app/styles/10-layout.css:1089` (global): `font-size: 20px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.82 `.phase4-main main`

- **Archivo origen:** `app/styles/10-layout.css:145` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:465` (global), `app/styles/10-layout.css:640` (@media (max-width: 1280px)), `app/styles/10-layout.css:653` (@media (max-width: 680px)), `app/styles/10-layout.css:711` (@media (max-width: 1366px)), `app/styles/10-layout.css:1082` (global), `app/styles/10-layout.css:1598` (global), `app/styles/20-components.css:23` (global), `app/styles/20-components.css:607` (@media (max-width: 1100px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:145` (global): `max-width: none`; `margin: 0`; `padding: 20px 22px 28px`.
  - `app/styles/10-layout.css:465` (global): `padding-top: 18px`.
  - `app/styles/10-layout.css:640` (@media (max-width: 1280px)): `padding-left: 16px`; `padding-right: 16px`.
  - `app/styles/10-layout.css:653` (@media (max-width: 680px)): `padding: 12px`.
  - `app/styles/10-layout.css:711` (@media (max-width: 1366px)): `padding-left: 14px`; `padding-right: 14px`.
  - `app/styles/10-layout.css:1082` (global): `padding: 10px 14px 18px`.
  - `app/styles/10-layout.css:1598` (global): `padding-top: 12px !important`.
  - `app/styles/20-components.css:23` (global): `max-width: none !important`; `padding: 18px 24px 28px !important`.
  - `app/styles/20-components.css:607` (@media (max-width: 1100px)): `padding: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.83 `.phase4-home-hero`

- **Archivo origen:** `app/styles/10-layout.css:189` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:370` (@media (max-width: 860px)), `app/styles/10-layout.css:474` (global), `app/styles/10-layout.css:654` (@media (max-width: 680px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:189` (global): `display: flex`; `justify-content: space-between`; `gap: 16px`; `align-items: center`; `padding: 20px 22px`; `border: 1px solid rgba(15, 23, 42, 0.08)`; `border-radius: 22px`; `background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))`; `box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08)`.
  - `app/styles/10-layout.css:370` (@media (max-width: 860px)): `flex-direction: column`; `align-items: stretch`.
  - `app/styles/10-layout.css:474` (global): `overflow: hidden`; `position: relative`.
  - `app/styles/10-layout.css:654` (@media (max-width: 680px)): `padding: 16px`; `border-radius: 18px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.84 `.phase4-home-hero h2`

- **Archivo origen:** `app/styles/10-layout.css:200` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:486` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:200` (global): `margin: 2px 0 6px`; `font-size: 24px`; `color: #0f172a`.
  - `app/styles/10-layout.css:486` (global): `letter-spacing: -0.03em`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.85 `.phase4-home-date`

- **Archivo origen:** `app/styles/10-layout.css:216` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:487` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:216` (global): `min-width: 190px`; `text-align: center`; `padding: 12px 14px`; `border-radius: 16px`; `border: 1px solid rgba(37, 99, 235, .15)`; `background: #fff`; `color: #1e293b`; `font-weight: 700`.
  - `app/styles/10-layout.css:487` (global): `box-shadow: 0 8px 20px rgba(15, 23, 42, .06)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.86 `.phase4-metric-grid`

- **Archivo origen:** `app/styles/10-layout.css:226` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:366` (@media (max-width: 1280px)), `app/styles/10-layout.css:371` (@media (max-width: 860px)), `app/styles/10-layout.css:712` (@media (max-width: 1366px)), `app/styles/20-components.css:467` (global), `app/styles/30-modules.css:1942` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:226` (global): `display: grid`; `grid-template-columns: repeat(6, minmax(140px, 1fr))`; `gap: 12px`.
  - `app/styles/10-layout.css:366` (@media (max-width: 1280px)): `grid-template-columns: repeat(3, minmax(160px, 1fr))`.
  - `app/styles/10-layout.css:371` (@media (max-width: 860px)): `grid-template-columns: 1fr`.
  - `app/styles/10-layout.css:712` (@media (max-width: 1366px)): `grid-template-columns: repeat(3, minmax(150px, 1fr))`.
  - `app/styles/20-components.css:467` (global): `gap: 14px !important`.
  - `app/styles/30-modules.css:1942` (global): `gap: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.87 `.phase4-metric-card`

- **Archivo origen:** `app/styles/10-layout.css:231` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:477` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:231` (global): `border: 1px solid rgba(15, 23, 42, 0.08)`; `background: #fff`; `border-radius: 18px`; `padding: 14px`; `text-align: left`; `display: grid`; `grid-template-columns: 42px 1fr`; `grid-template-areas: "icon label" "icon value" "icon sub"`; `column-gap: 12px`; `cursor: pointer`; `box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06)`.
  - `app/styles/20-components.css:477` (global): `text-align: left !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.88 `.phase4-metric-card strong`

- **Archivo origen:** `app/styles/10-layout.css:259` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:515` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:259` (global): `grid-area: value`; `color: #0f172a`; `font-size: 25px`; `line-height: 1.05`.
  - `app/styles/10-layout.css:515` (global): `letter-spacing: -0.03em`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.89 `.phase4-dashboard-grid`

- **Archivo origen:** `app/styles/10-layout.css:261` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:367` (@media (max-width: 1280px)), `app/styles/10-layout.css:372` (@media (max-width: 860px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:261` (global): `display: grid`; `grid-template-columns: 1.2fr 1fr 1fr`; `gap: 14px`.
  - `app/styles/10-layout.css:367` (@media (max-width: 1280px)): `grid-template-columns: 1fr 1fr`.
  - `app/styles/10-layout.css:372` (@media (max-width: 860px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.90 `.phase4-dashboard-card`

- **Archivo origen:** `app/styles/10-layout.css:266` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:516` (global), `app/styles/10-layout.css:713` (@media (max-width: 1366px)), `app/styles/30-modules.css:732` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:266` (global): `border: 1px solid rgba(15, 23, 42, 0.08)`; `border-radius: 20px`; `background: #fff`; `padding: 16px`; `box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06)`; `min-height: 230px`.
  - `app/styles/10-layout.css:516` (global): `min-width: 0`.
  - `app/styles/10-layout.css:713` (@media (max-width: 1366px)): `min-height: 210px`.
  - `app/styles/30-modules.css:732` (global): `overflow: hidden !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.91 `.phase4-status-layout`

- **Archivo origen:** `app/styles/10-layout.css:284` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:373` (@media (max-width: 860px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:284` (global): `display: grid`; `grid-template-columns: 190px 1fr`; `gap: 18px`; `align-items: center`.
  - `app/styles/10-layout.css:373` (@media (max-width: 860px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.92 `.phase4-donut`

- **Archivo origen:** `app/styles/10-layout.css:290` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:491` (global), `app/styles/30-modules.css:1625` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:290` (global): `--done: 0%`; `--progress: 0%`; `width: 170px`; `height: 170px`; `border-radius: 50%`; `background: conic-gradient(#22c55e 0 var(--done), #3b82f6 var(--done) var(--progress), #f59e0b var(--progress) 100%)`; `position: relative`; `display: grid`; `place-items: center`; `margin: auto`.
  - `app/styles/20-components.css:491` (global): `background: conic-gradient(var(--red) 0 var(--done, 0%), #f59e0b var(--done, 0%) var(--progress, 0%), rgba(255,255,255,.10) var(--progress, 0%) 100%) !important`.
  - `app/styles/30-modules.css:1625` (global): `background: conic-gradient(#22c55e 0 var(--done), #3b82f6 var(--done) var(--progress), #f59e0b var(--progress) 100%) !important`; `box-shadow: inset 0 0 0 1px rgba(148,163,184,.14), 0 16px 32px rgba(3,7,18,.22) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.93 `.phase4-donut::after`

- **Archivo origen:** `app/styles/10-layout.css:302` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:495` (global), `app/styles/30-modules.css:1630` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:302` (global): `content: ""`; `position: absolute`; `width: 102px`; `height: 102px`; `border-radius: 50%`; `background: #fff`.
  - `app/styles/20-components.css:495` (global): `background: #10161d !important`.
  - `app/styles/30-modules.css:1630` (global): `background: #242a36 !important`; `border: 1px solid rgba(148,163,184,.16) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.94 `.phase4-donut span, .phase4-donut small`

- **Archivo origen:** `app/styles/10-layout.css:310` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1635` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:310` (global): `position: relative`; `z-index: 1`; `display: block`; `text-align: center`; `color: #0f172a`.
  - `app/styles/30-modules.css:1635` (global): `color: rgba(229,231,235,.92) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.95 `.phase4-list-row`

- **Archivo origen:** `app/styles/10-layout.css:329` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:518` (global), `app/styles/10-layout.css:657` (@media (max-width: 680px)), `app/styles/30-modules.css:520` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:329` (global): `border: 0`; `background: #f8fafc`; `border-radius: 12px`; `padding: 10px 12px`; `display: grid`; `grid-template-columns: 90px 1fr`; `gap: 4px 10px`; `text-align: left`; `cursor: pointer`; `color: #0f172a`.
  - `app/styles/10-layout.css:518` (global): `border: 1px solid transparent`.
  - `app/styles/10-layout.css:657` (@media (max-width: 680px)): `grid-template-columns: 1fr`.
  - `app/styles/30-modules.css:520` (global): `min-height: 46px !important`; `padding: 9px 11px !important`; `border-radius: 11px !important`; `grid-template-columns: 82px 1fr !important`; `background: rgba(255,255,255,.035) !important`; `border: 1px solid rgba(255,255,255,.07) !important`; `color: rgba(226,232,240,.90) !important`; `box-shadow: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.96 `.phase4-list-row:hover`

- **Archivo origen:** `app/styles/10-layout.css:341` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:519` (global), `app/styles/30-modules.css:531` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:341` (global): `background: #eef2ff`.
  - `app/styles/10-layout.css:519` (global): `border-color: rgba(37, 99, 235, .18)`; `transform: translateY(-1px)`.
  - `app/styles/30-modules.css:531` (global): `background: rgba(255,255,255,.055) !important`; `border-color: rgba(255,255,255,.12) !important`; `transform: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.97 `.phase4-list-row span`

- **Archivo origen:** `app/styles/10-layout.css:342` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:537` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:342` (global): `color: #2563eb`; `font-size: 12px`; `font-weight: 800`.
  - `app/styles/30-modules.css:537` (global): `color: rgba(148,163,184,.95) !important`; `font-size: 11px !important`; `text-transform: uppercase`; `letter-spacing: .05em`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.98 `.phase4-list-row b`

- **Archivo origen:** `app/styles/10-layout.css:343` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:544` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:343` (global): `font-size: 13px`; `overflow-wrap: anywhere`.
  - `app/styles/30-modules.css:544` (global): `color: rgba(248,250,252,.94) !important`; `font-size: 13px !important`; `line-height: 1.25 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.99 `.phase4-list-row small`

- **Archivo origen:** `app/styles/10-layout.css:344` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:658` (@media (max-width: 680px)), `app/styles/30-modules.css:550` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:344` (global): `grid-column: 2`; `color: #64748b`.
  - `app/styles/10-layout.css:658` (@media (max-width: 680px)): `grid-column: 1`.
  - `app/styles/30-modules.css:550` (global): `color: rgba(148,163,184,.82) !important`; `font-size: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.100 `.phase4-list-row.danger`

- **Archivo origen:** `app/styles/10-layout.css:345` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:555` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:345` (global): `background: #fef2f2`.
  - `app/styles/30-modules.css:555` (global): `background: rgba(239, 68, 68, .13) !important`; `border-color: rgba(239, 68, 68, .28) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.101 `.phase4-list-row.warning`

- **Archivo origen:** `app/styles/10-layout.css:346` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:565` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:346` (global): `background: #fff7ed`.
  - `app/styles/30-modules.css:565` (global): `background: rgba(245, 158, 11, .09) !important`; `border-color: rgba(245, 158, 11, .20) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.102 `.phase4-list-row.info`

- **Archivo origen:** `app/styles/10-layout.css:347` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:575` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:347` (global): `background: #eff6ff`.
  - `app/styles/30-modules.css:575` (global): `background: rgba(59, 130, 246, .08) !important`; `border-color: rgba(59, 130, 246, .18) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.103 `.phase4-workload button`

- **Archivo origen:** `app/styles/10-layout.css:350` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:585` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:350` (global): `border: 0`; `background: transparent`; `display: grid`; `grid-template-columns: 105px 1fr 32px`; `align-items: center`; `gap: 10px`; `padding: 6px 0`; `text-align: left`; `cursor: pointer`; `color: #334155`.
  - `app/styles/30-modules.css:585` (global): `min-height: 38px !important`; `padding: 7px 8px !important`; `border-radius: 10px !important`; `background: rgba(255,255,255,.028) !important`; `border: 1px solid rgba(255,255,255,.06) !important`; `color: rgba(226,232,240,.88) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.104 `.phase4-workload div`

- **Archivo origen:** `app/styles/10-layout.css:362` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:604` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:362` (global): `height: 9px`; `border-radius: 999px`; `background: #e2e8f0`; `overflow: hidden`.
  - `app/styles/30-modules.css:604` (global): `height: 7px !important`; `background: rgba(255,255,255,.10) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.105 `.phase4-workload i`

- **Archivo origen:** `app/styles/10-layout.css:363` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:609` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:363` (global): `display: block`; `height: 100%`; `border-radius: 999px`; `background: #2563eb`.
  - `app/styles/30-modules.css:609` (global): `background: linear-gradient(90deg, #60a5fa, #2563eb) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.106 `.phase4-workload b`

- **Archivo origen:** `app/styles/10-layout.css:364` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:613` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:364` (global): `text-align: right`; `color: #0f172a`.
  - `app/styles/30-modules.css:613` (global): `color: rgba(248,250,252,.92) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.107 `body.phase4-view-home #dashboardLayout`

- **Archivo origen:** `app/styles/10-layout.css:378` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:682` (global), `app/styles/10-layout.css:864` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:378` (global): `display: none`.
  - `app/styles/10-layout.css:682` (global): `display: none !important`.
  - `app/styles/10-layout.css:864` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.108 `body.phase4-view-module .phase4-home-dashboard, body.phase4-view-module .quick-top, body.phase4-view-module #alertsPanel`

- **Archivo origen:** `app/styles/10-layout.css:382` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1038` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:382` (global): `display: none`.
  - `app/styles/10-layout.css:1038` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.109 `body.phase4-view-module #dashboardLayout`

- **Archivo origen:** `app/styles/10-layout.css:388` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:868` (global), `app/styles/10-layout.css:1524` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:388` (global): `display: block`.
  - `app/styles/10-layout.css:868` (global): `display: block !important`; `width: 100%`; `max-width: none`; `margin: 0 !important`; `padding: 0`.
  - `app/styles/10-layout.css:1524` (global): `display: block !important`; `width: 100% !important`; `max-width: none !important`; `margin: 0 !important`; `padding: 0 !important`; `background: transparent !important`; `box-shadow: none !important`; `border: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.110 `body.phase4-view-module .sidebar-left`

- **Archivo origen:** `app/styles/10-layout.css:392` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:738` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:392` (global): `display: none`.
  - `app/styles/10-layout.css:738` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.111 `body.phase4-view-module .content-right`

- **Archivo origen:** `app/styles/10-layout.css:396` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:741` (global), `app/styles/10-layout.css:876` (global), `app/styles/10-layout.css:1101` (global), `app/styles/10-layout.css:1535` (global), `app/styles/20-components.css:575` (global), `app/styles/50-module-extras.css:957` (global), `app/styles/60-overrides.css:1957` (global), `app/styles/60-overrides.css:2233` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:396` (global): `width: 100%`; `max-width: none`.
  - `app/styles/10-layout.css:741` (global): `display: block !important`; `width: 100% !important`; `max-width: none !important`; `min-width: 0 !important`.
  - `app/styles/10-layout.css:876` (global): `display: block`; `width: 100%`; `max-width: none !important`; `min-width: 0`; `padding: 0`.
  - `app/styles/10-layout.css:1101` (global): `width: 100% !important`; `max-width: none !important`; `padding: 0 !important`; `display: block !important`.
  - `app/styles/10-layout.css:1535` (global): `display: block !important`; `width: 100% !important`; `max-width: none !important`; `margin: 0 !important`; `padding: 14px 22px 28px !important`; `box-sizing: border-box !important`.
  - `app/styles/20-components.css:575` (global): `padding: 14px 22px 28px !important`.
  - `app/styles/50-module-extras.css:957` (global): `background: linear-gradient(135deg, var(--rrll-bg-app-dark) 0%, #242b36 56%, var(--rrll-bg-app-dark) 100%) !important`.
  - `app/styles/60-overrides.css:1957` (global): `gap: 12px !important`.
  - `app/styles/60-overrides.css:2233` (global): `padding-top: 6px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.112 `body.phase4-view-module .content-right > .module-card`

- **Archivo origen:** `app/styles/10-layout.css:401` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:747` (global), `app/styles/10-layout.css:884` (global), `app/styles/10-layout.css:1544` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:401` (global): `display: none`.
  - `app/styles/10-layout.css:747` (global): `display: none !important`; `width: 100% !important`; `max-width: none !important`; `min-width: 0 !important`.
  - `app/styles/10-layout.css:884` (global): `display: none !important`.
  - `app/styles/10-layout.css:1544` (global): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.113 `body.phase4-view-module .content-right > .module-card.phase4-active-module`

- **Archivo origen:** `app/styles/10-layout.css:405` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:537` (global), `app/styles/10-layout.css:753` (global), `app/styles/10-layout.css:888` (global), `app/styles/10-layout.css:1107` (global), `app/styles/10-layout.css:1258` (global), `app/styles/10-layout.css:1548` (global), `app/styles/20-components.css:173` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:405` (global): `display: block`.
  - `app/styles/10-layout.css:537` (global): `border-radius: 18px`; `border-top-width: 4px`; `overflow: hidden`.
  - `app/styles/10-layout.css:753` (global): `display: block !important`; `width: 100% !important`; `max-width: none !important`.
  - `app/styles/10-layout.css:888` (global): `display: block !important`; `width: 100%`; `max-width: none`; `margin: 0 0 24px 0`; `padding: 0`; `border: 1px solid rgba(15, 23, 42, 0.09)`; `border-radius: 22px`; `background: #fff`; `box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08)`; `overflow: hidden`.
  - `app/styles/10-layout.css:1107` (global): `width: 100% !important`; `max-width: none !important`; `margin: 0 !important`; `box-sizing: border-box`.
  - `app/styles/10-layout.css:1258` (global): `background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%) !important`.
  - `app/styles/10-layout.css:1548` (global): `display: block !important`; `width: 100% !important`; `max-width: none !important`; `margin: 0 !important`; `padding: 0 0 20px !important`; `border-radius: 20px !important`; `overflow: visible !important`.
  - `app/styles/20-components.css:173` (global): `background: transparent !important`; `border: 0 !important`; `box-shadow: none !important`; `border-radius: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.114 `body.phase4-view-module .content-right > .module-card.phase4-active-module > summary`

- **Archivo origen:** `app/styles/10-layout.css:409` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:542` (global), `app/styles/10-layout.css:648` (@media (max-width: 980px)), `app/styles/10-layout.css:758` (global), `app/styles/10-layout.css:901` (global), `app/styles/10-layout.css:1113` (global), `app/styles/10-layout.css:1262` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:409` (global): `cursor: default`.
  - `app/styles/10-layout.css:542` (global): `position: sticky`; `top: 65px`; `z-index: 10`; `background: rgba(255,255,255,.96)`; `backdrop-filter: blur(10px)`; `border-bottom: 1px solid rgba(15,23,42,.08)`; `padding-bottom: 12px`.
  - `app/styles/10-layout.css:648` (@media (max-width: 980px)): `position: static`.
  - `app/styles/10-layout.css:758` (global): `display: flex !important`; `flex-wrap: wrap`; `align-items: center`; `gap: 10px`.
  - `app/styles/10-layout.css:901` (global): `display: flex`; `align-items: center`; `gap: 12px`; `min-height: 72px`; `padding: 18px 22px`; `border-bottom: 1px solid rgba(15, 23, 42, 0.08)`; `background: linear-gradient(90deg, #f8fafc, #ffffff)`; `list-style: none`.
  - `app/styles/10-layout.css:1113` (global): `top: 55px`; `padding: 12px 16px`.
  - `app/styles/10-layout.css:1262` (global): `min-height: 60px !important`; `padding: 14px 18px !important`; `background: linear-gradient(90deg, #ffffff 0%, #f8fafc 100%) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.115 `body.phase4-view-module .dashboard-layout`

- **Archivo origen:** `app/styles/10-layout.css:413` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:531` (global), `app/styles/10-layout.css:1095` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:413` (global): `margin-top: 18px`.
  - `app/styles/10-layout.css:531` (global): `display: grid`; `grid-template-columns: minmax(0, 1fr)`; `max-width: 1560px`; `margin: 18px 0 0`.
  - `app/styles/10-layout.css:1095` (global): `max-width: none !important`; `width: 100% !important`; `margin: 0 !important`; `display: block !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.116 `html`

- **Archivo origen:** `app/styles/10-layout.css:419` (global).
- **Archivo(s) con variantes:** `app/styles/65-normalize.css:3` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:419` (global): `scroll-behavior: smooth`.
  - `app/styles/65-normalize.css:3` (global): `font-size: 14px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.117 `.phase4-sidebar::-webkit-scrollbar`

- **Archivo origen:** `app/styles/10-layout.css:432` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1061` (global), `app/styles/50-module-extras.css:2421` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:432` (global): `width: 8px`.
  - `app/styles/41-theme-light.css:1061` (global): `width: 5px !important`; `height: 5px !important`.
  - `app/styles/50-module-extras.css:2421` (global): `width: 5px !important`; `height: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.118 `.phase4-sidebar::-webkit-scrollbar-thumb`

- **Archivo origen:** `app/styles/10-layout.css:433` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1252` (global), `app/styles/41-theme-light.css:1068` (global), `app/styles/50-module-extras.css:2423` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:433` (global): `background: rgba(255,255,255,.22)`; `border-radius: 999px`.
  - `app/styles/10-layout.css:1252` (global): `background: rgba(229, 231, 235, .24) !important`.
  - `app/styles/41-theme-light.css:1068` (global): `background: rgba(203, 213, 225, .22) !important`; `border-radius: 999px !important`.
  - `app/styles/50-module-extras.css:2423` (global): `background: rgba(148,163,184,.28) !important`; `border-radius: 999px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.119 `.phase4-nav-secondary .phase4-nav-item`

- **Archivo origen:** `app/styles/10-layout.css:456` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2444` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:456` (global): `min-height: 34px`; `font-size: 13px`; `opacity: .92`.
  - `app/styles/50-module-extras.css:2444` (global): `width: 100% !important`; `min-height: 32px !important`; `padding: 6px 8px !important`; `font-size: 12.5px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.120 `.phase4-main .top-title p`

- **Archivo origen:** `app/styles/10-layout.css:464` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1092` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:464` (global): `color: var(--phase4-muted)`.
  - `app/styles/10-layout.css:1092` (global): `margin: 2px 0 0`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.121 `.phase4-dashboard-card .phase4-list`

- **Archivo origen:** `app/styles/10-layout.css:517` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:516` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:517` (global): `max-height: 330px`; `overflow: auto`; `padding-right: 2px`.
  - `app/styles/30-modules.css:516` (global): `gap: 7px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.122 `body.phase4-view-module .phase4-main main`

- **Archivo origen:** `app/styles/10-layout.css:764` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1608` (global), `app/styles/50-module-extras.css:1201` (global), `app/styles/60-overrides.css:2221` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:764` (global): `overflow-x: hidden`.
  - `app/styles/10-layout.css:1608` (global): `padding-left: 0 !important`; `padding-right: 0 !important`.
  - `app/styles/50-module-extras.css:1201` (global): `padding-top: 22px !important`.
  - `app/styles/60-overrides.css:2221` (global): `padding-top: 4px !important`; `padding-left: 10px !important`; `padding-right: 10px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.123 `.phase4-nav-submenu`

- **Archivo origen:** `app/styles/10-layout.css:821` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1248` (global), `app/styles/41-theme-light.css:1089` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:821` (global): `display: none`; `margin: -2px 0 6px 28px`; `padding-left: 10px`; `border-left: 1px solid rgba(255,255,255,.18)`.
  - `app/styles/10-layout.css:1248` (global): `border-left-color: rgba(229, 231, 235, 0.16) !important`.
  - `app/styles/41-theme-light.css:1089` (global): `margin: -1px 0 4px 24px !important`; `padding-left: 8px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.124 `.phase4-nav-submenu.open`

- **Archivo origen:** `app/styles/10-layout.css:828` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1093` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:828` (global): `display: grid`; `gap: 4px`.
  - `app/styles/41-theme-light.css:1093` (global): `gap: 3px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.125 `.phase4-nav-subitem`

- **Archivo origen:** `app/styles/10-layout.css:833` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1096` (global), `app/styles/41-theme-light.css:1214` (@media (max-height: 820px)), `app/styles/50-module-extras.css:2430` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:833` (global): `display: flex`; `align-items: center`; `gap: 8px`; `min-height: 30px`; `padding: 7px 10px`; `border-radius: 10px`; `color: rgba(255,255,255,.82)`; `font-size: 12.5px`; `font-weight: 700`; `text-decoration: none`.
  - `app/styles/41-theme-light.css:1096` (global): `min-height: 27px !important`; `padding: 5px 8px !important`; `border-radius: 8px !important`.
  - `app/styles/41-theme-light.css:1214` (@media (max-height: 820px)): `min-height: 25px !important`; `padding-top: 4px !important`; `padding-bottom: 4px !important`.
  - `app/styles/50-module-extras.css:2430` (global): `min-height: 30px !important`; `padding-top: 6px !important`; `padding-bottom: 6px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.126 `body.phase4-view-module .summary-counts`

- **Archivo origen:** `app/styles/10-layout.css:922` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1064` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:922` (global): `margin-left: auto`; `color: #64748b`; `font-weight: 800`; `white-space: nowrap`.
  - `app/styles/10-layout.css:1064` (@media (max-width: 760px)): `display: none`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.127 `body.phase4-view-module .summary-actions`

- **Archivo origen:** `app/styles/10-layout.css:929` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1702` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:929` (global): `display: inline-flex`; `gap: 8px`; `margin-left: 8px`.
  - `app/styles/10-layout.css:1702` (global): `display: flex !important`; `gap: 8px !important`; `align-items: center !important`; `margin-left: auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.128 `body.phase4-view-module .enhanced-task-form, body.phase4-view-module .enhanced-petition-form, body.phase4-view-module .agenda-form-v18, body.phase4-view-module .session-form, body.phase4-view-module .telework-form, body.phase4-view-module .form-inline`

- **Archivo origen:** `app/styles/10-layout.css:940` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1045` (@media (max-width: 1100px)), `app/styles/10-layout.css:1056` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:940` (global): `margin-top: 22px`; `display: grid`; `grid-template-columns: minmax(220px, 2fr) minmax(140px, 1fr) minmax(130px, .8fr) auto`; `gap: 12px`; `align-items: center`.
  - `app/styles/10-layout.css:1045` (@media (max-width: 1100px)): `grid-template-columns: 1fr 1fr`.
  - `app/styles/10-layout.css:1056` (@media (max-width: 760px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.129 `body.phase4-view-module .workflow-columns, body.phase4-view-module .minutes-columns, body.phase4-view-module .telework-columns, body.phase4-view-module .session-columns`

- **Archivo origen:** `app/styles/10-layout.css:960` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1430` (global), `app/styles/10-layout.css:1643` (global), `app/styles/20-components.css:579` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:960` (global): `display: grid`; `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`; `gap: 16px`; `align-items: start`; `width: calc(100% - 44px)`.
  - `app/styles/10-layout.css:1430` (global): `margin-top: 16px !important`.
  - `app/styles/10-layout.css:1643` (global): `width: calc(100% - 32px) !important`; `margin: 16px 16px 0 !important`; `display: grid !important`; `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important`; `gap: 14px !important`; `align-items: start !important`.
  - `app/styles/20-components.css:579` (global): `margin-top: 14px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.130 `body.phase4-view-module .column`

- **Archivo origen:** `app/styles/10-layout.css:971` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1437` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:971` (global): `min-width: 0`; `border-radius: 18px`; `background: #f8fafc`; `border: 1px solid rgba(15, 23, 42, 0.08)`; `box-shadow: none`.
  - `app/styles/10-layout.css:1437` (global): `background: #ffffff !important`; `border: 1px solid var(--rrll-border) !important`; `box-shadow: 0 8px 20px rgba(15, 23, 42, 0.045) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.131 `body.phase4-view-module .column-header`

- **Archivo origen:** `app/styles/10-layout.css:979` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1443` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:979` (global): `border-bottom: 1px solid rgba(15, 23, 42, 0.07)`; `background: rgba(255, 255, 255, 0.75)`; `border-radius: 18px 18px 0 0`.
  - `app/styles/10-layout.css:1443` (global): `min-height: 48px !important`; `padding: 12px 14px !important`; `background: #f8fafc !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.132 `body.phase4-view-module .telework-form`

- **Archivo origen:** `app/styles/10-layout.css:1192` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1202` (@media (max-width: 1100px)), `app/styles/10-layout.css:1301` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1192` (global): `grid-template-columns: minmax(120px, .45fr) minmax(260px, 1fr) minmax(140px, .35fr) auto`; `align-items: center`.
  - `app/styles/10-layout.css:1202` (@media (max-width: 1100px)): `grid-template-columns: 1fr !important`.
  - `app/styles/10-layout.css:1301` (global): `grid-template-columns: minmax(130px, .55fr) minmax(280px, 1.4fr) minmax(160px, .55fr) auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.133 `body.phase4-view-module .enhanced-task-form, body.phase4-view-module .enhanced-petition-form, body.phase4-view-module .agenda-form-v18, body.phase4-view-module .paritaria-form-v18, body.phase4-view-module .session-form, body.phase4-view-module .telework-form, body.phase4-view-module #gestor-actas.phase4-active-module > .form-inline`

- **Archivo origen:** `app/styles/10-layout.css:1273` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1460` (@media (max-width: 1180px)), `app/styles/10-layout.css:1472` (@media (max-width: 760px)), `app/styles/20-components.css:564` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1273` (global): `width: calc(100% - 44px) !important`; `max-width: none !important`; `box-sizing: border-box !important`; `margin: 18px 22px 0 !important`; `padding: 16px !important`; `display: grid !important`; `grid-template-columns: minmax(240px, 2fr) minmax(150px, .7fr) minmax(150px, .7fr) auto !important`; `gap: 12px !important`; `align-items: stretch !important`; `background: var(--rrll-card) !important`; `border: 1px solid var(--rrll-border) !important`; `border-radius: 18px !important`; `box-shadow: var(--rrll-shadow-soft) !important`.
  - `app/styles/10-layout.css:1460` (@media (max-width: 1180px)): `grid-template-columns: 1fr 1fr !important`.
  - `app/styles/10-layout.css:1472` (@media (max-width: 760px)): `grid-template-columns: 1fr !important`; `margin-left: 14px !important`; `margin-right: 14px !important`; `width: calc(100% - 28px) !important`.
  - `app/styles/20-components.css:564` (global): `padding: 14px !important`; `gap: 10px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.134 `body.phase4-view-module .module-card.phase4-active-module > textarea, body.phase4-view-module .committee-subsection > textarea, body.phase4-view-module .paritaria-subsection > textarea`

- **Archivo origen:** `app/styles/10-layout.css:1377` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:293` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1377` (global): `width: calc(100% - 44px) !important`; `box-sizing: border-box !important`; `margin: 10px 22px 0 !important`; `min-height: 78px !important`; `padding: 12px 14px !important`; `border-radius: 16px !important`; `border: 1px solid var(--rrll-border) !important`; `background: #ffffff !important`; `box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04) !important`; `font-size: 14px !important`.
  - `app/styles/20-components.css:293` (global): `background: rgba(8,13,19,.92) !important`; `min-height: 86px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.135 `body.phase4-view-module .module-card.phase4-active-module > textarea, body.phase4-view-module .committee-subsection > textarea, body.phase4-view-module .paritaria-subsection > textarea, body.phase4-view-module .petition-type-row, body.phase4-view-module .telework-days-row, body.phase4-view-module .two-buttons`

- **Archivo origen:** `app/styles/10-layout.css:1484` (@media (max-width: 760px)).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1630` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1484` (@media (max-width: 760px)): `margin-left: 14px !important`; `margin-right: 14px !important`; `width: calc(100% - 28px) !important`.
  - `app/styles/10-layout.css:1630` (global): `width: calc(100% - 32px) !important`; `margin-left: 16px !important`; `margin-right: 16px !important`; `max-width: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.136 `body.phase4-view-module .module-card > summary, body.phase4-view-module .committee-subsection > summary, body.phase4-view-module .paritaria-subsection > summary`

- **Archivo origen:** `app/styles/10-layout.css:1559` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:180` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1559` (global): `list-style: none !important`; `cursor: default !important`; `user-select: none !important`.
  - `app/styles/20-components.css:180` (global): `background: linear-gradient(180deg, rgba(16,22,30,.98), rgba(11,16,22,.98)) !important`; `color: var(--text) !important`; `border: 1px solid var(--border) !important`; `border-radius: 16px !important`; `box-shadow: var(--shadow-soft) !important`; `min-height: 62px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.137 `.phase4-nav-item, .phase4-nav-subitem, .phase4-nav-button`

- **Archivo origen:** `app/styles/10-layout.css:1721` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:106` (global), `app/styles/41-theme-light.css:1078` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1721` (global): `color: #e5e7eb !important`.
  - `app/styles/20-components.css:106` (global): `color: #d7dee8 !important`; `border: 1px solid transparent !important`; `border-radius: 12px !important`; `background: transparent !important`.
  - `app/styles/41-theme-light.css:1078` (global): `gap: 8px !important`; `min-width: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.138 `.phase4-nav-item:hover, .phase4-nav-subitem:hover, .phase4-nav-button:hover`

- **Archivo origen:** `app/styles/10-layout.css:1727` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:115` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1727` (global): `background: #3a3f48 !important`.
  - `app/styles/20-components.css:115` (global): `background: rgba(255,255,255,.06) !important`; `border-color: rgba(255,255,255,.08) !important`; `color: #fff !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.139 `.phase4-nav-item.active, .phase4-nav-subitem.active, .phase4-nav-parent.active`

- **Archivo origen:** `app/styles/10-layout.css:1733` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:123` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1733` (global): `background: linear-gradient(90deg, #7d1f1f 0%, #a72722 100%) !important`; `color: #ffffff !important`.
  - `app/styles/20-components.css:123` (global): `background: linear-gradient(90deg, rgba(239,43,45,.78), rgba(134,24,28,.70)) !important`; `color: #fff !important`; `border-color: rgba(255,255,255,.10) !important`; `box-shadow: 0 10px 24px rgba(239,43,45,.18) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.140 `body.phase4-view-module #tasks-columns.workflow-main-columns, body.phase4-view-module #petitions-columns.workflow-main-columns, #tasks-columns.workflow-main-columns, #petitions-columns.workflow-main-columns`

- **Archivo origen:** `app/styles/10-layout.css:1757` (global).
- **Archivo(s) con variantes:** `app/styles/10-layout.css:1829` (@media (max-width: 1100px)).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1757` (global): `display: grid !important`; `grid-template-columns: minmax(220px, 1fr) minmax(420px, 2fr) !important`; `gap: 14px !important`; `align-items: start !important`.
  - `app/styles/10-layout.css:1829` (@media (max-width: 1100px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.141 `.workflow-closed-details`

- **Archivo origen:** `app/styles/10-layout.css:1773` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:442` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1773` (global): `margin: 16px 16px 0`; `border: 1px solid var(--border)`; `border-radius: 16px`; `background: #fff`; `box-shadow: var(--shadow-soft)`; `overflow: hidden`.
  - `app/styles/20-components.css:442` (global): `background: linear-gradient(180deg, rgba(17,24,32,.96), rgba(12,18,25,.96)) !important`; `overflow: hidden !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.142 `.workflow-closed-details > summary`

- **Archivo origen:** `app/styles/10-layout.css:1782` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:447` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1782` (global): `list-style: none`; `cursor: pointer !important`; `display: flex`; `align-items: center`; `justify-content: space-between`; `gap: 12px`; `padding: 12px 14px`; `font-weight: 700`; `color: var(--dark)`; `background: linear-gradient(180deg, #fff, #fff7f7)`; `border-bottom: 1px solid transparent`.
  - `app/styles/20-components.css:447` (global): `background: rgba(255,255,255,.035) !important`; `color: var(--text) !important`; `border-bottom: 1px solid transparent !important`; `padding: 12px 14px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.143 `.workflow-closed-details > summary::before`

- **Archivo origen:** `app/styles/10-layout.css:1800` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:458` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1800` (global): `content: "▶"`; `color: var(--red)`; `font-size: 12px`; `margin-right: 2px`.
  - `app/styles/20-components.css:458` (global): `color: var(--red) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.144 `.workflow-closed-details[open] > summary`

- **Archivo origen:** `app/styles/10-layout.css:1807` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:454` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1807` (global): `border-bottom-color: var(--border)`.
  - `app/styles/20-components.css:454` (global): `border-bottom-color: rgba(255,255,255,.08) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.145 `.workflow-closed-details .closed-content`

- **Archivo origen:** `app/styles/10-layout.css:1815` (global).
- **Archivo(s) con variantes:** `app/styles/20-components.css:462` (global).
- **Propiedades por aparición:**
  - `app/styles/10-layout.css:1815` (global): `padding: 14px`.
  - `app/styles/20-components.css:462` (global): `padding: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.146 `input::placeholder, textarea::placeholder`

- **Archivo origen:** `app/styles/20-components.css:262` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1445` (global).
- **Propiedades por aparición:**
  - `app/styles/20-components.css:262` (global): `color: #738093 !important`.
  - `app/styles/30-modules.css:1445` (global): `color: rgba(156,163,175,.80) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.147 `td, th`

- **Archivo origen:** `app/styles/20-components.css:543` (global).
- **Archivo(s) con variantes:** `app/styles/65-normalize.css:126` (global).
- **Propiedades por aparición:**
  - `app/styles/20-components.css:543` (global): `border-color: rgba(255,255,255,.08) !important`.
  - `app/styles/65-normalize.css:126` (global): `padding: var(--rrll-table-cell-padding-y) var(--rrll-table-cell-padding-x)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.148 `*::-webkit-scrollbar-track`

- **Archivo origen:** `app/styles/20-components.css:592` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1753` (global), `app/styles/50-module-extras.css:1206` (global).
- **Propiedades por aparición:**
  - `app/styles/20-components.css:592` (global): `background: #080d13`.
  - `app/styles/30-modules.css:1753` (global): `background: rgba(36,42,54,.48)`.
  - `app/styles/50-module-extras.css:1206` (global): `background: #242b36 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.149 `*::-webkit-scrollbar-thumb`

- **Archivo origen:** `app/styles/20-components.css:596` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1754` (global), `app/styles/50-module-extras.css:1209` (global).
- **Propiedades por aparición:**
  - `app/styles/20-components.css:596` (global): `background: rgba(255,255,255,.18)`; `border-radius: 999px`; `border: 2px solid #080d13`.
  - `app/styles/30-modules.css:1754` (global): `background: rgba(148,163,184,.42)`; `border-radius: 999px`; `border: 2px solid rgba(36,42,54,.90)`.
  - `app/styles/50-module-extras.css:1209` (global): `background: rgba(170,179,194,.32) !important`; `border-color: #242b36 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.150 `*::-webkit-scrollbar-thumb:hover`

- **Archivo origen:** `app/styles/20-components.css:602` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1759` (global), `app/styles/50-module-extras.css:1213` (global).
- **Propiedades por aparición:**
  - `app/styles/20-components.css:602` (global): `background: rgba(239,43,45,.45)`.
  - `app/styles/30-modules.css:1759` (global): `background: rgba(203,213,225,.54)`.
  - `app/styles/50-module-extras.css:1213` (global): `background: rgba(170,179,194,.48) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.151 `.rrll-pro-task-form`

- **Archivo origen:** `app/styles/30-modules.css:52` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:397` (@media (max-width: 1250px)), `app/styles/30-modules.css:415` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:52` (global): `display: grid`; `grid-template-columns: minmax(280px, 2fr) 180px 160px 160px`; `gap: 12px`; `padding: 14px`; `background: rgba(255,255,255,.035)`; `border: 1px solid rgba(255,255,255,.08)`; `border-radius: 16px`.
  - `app/styles/30-modules.css:397` (@media (max-width: 1250px)): `grid-template-columns: 1fr 1fr`.
  - `app/styles/30-modules.css:415` (@media (max-width: 900px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.152 `.rrll-pro-field-full`

- **Archivo origen:** `app/styles/30-modules.css:99` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:400` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:99` (global): `grid-column: 1 / 4`.
  - `app/styles/30-modules.css:400` (@media (max-width: 1250px)): `grid-column: 1 / -1`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.153 `.rrll-pro-form-actions`

- **Archivo origen:** `app/styles/30-modules.css:103` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:403` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:103` (global): `display: flex`; `align-items: end`; `justify-content: flex-end`.
  - `app/styles/30-modules.css:403` (@media (max-width: 1250px)): `grid-column: 1 / -1`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.154 `.rrll-pro-list-toolbar`

- **Archivo origen:** `app/styles/30-modules.css:121` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:243` (global).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:121` (global): `display: flex`; `justify-content: space-between`; `align-items: center`; `gap: 14px`; `padding: 12px 14px`; `border-bottom: 1px solid rgba(255,255,255,.08)`.
  - `app/styles/50-module-extras.css:243` (global): `gap: 12px !important`; `align-items: center !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.155 `.rrll-pro-search-wrap`

- **Archivo origen:** `app/styles/30-modules.css:168` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:418` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:168` (global): `min-width: 220px`; `max-width: 320px`; `flex: 0 1 320px`; `display: flex`; `align-items: center`; `gap: 8px`.
  - `app/styles/30-modules.css:418` (@media (max-width: 900px)): `min-width: 0`; `max-width: none`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.156 `.rrll-pro-petition-form`

- **Archivo origen:** `app/styles/30-modules.css:468` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:618` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:468` (global): `grid-template-columns: minmax(260px, 2fr) 170px 150px 230px !important`.
  - `app/styles/30-modules.css:618` (@media (max-width: 1250px)): `grid-template-columns: 1fr 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.157 `.rrll-pro-telework-form`

- **Archivo origen:** `app/styles/30-modules.css:683` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:793` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:683` (global): `grid-template-columns: 150px minmax(260px, 1.6fr) 150px minmax(240px, 1fr) !important`.
  - `app/styles/30-modules.css:793` (@media (max-width: 1250px)): `grid-template-columns: 1fr 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.158 `.phase4-main .top-strip, .top-strip`

- **Archivo origen:** `app/styles/30-modules.css:1290` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:999` (global).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:1290` (global): `background: rgba(36,42,54,.86) !important`; `border-bottom: 1px solid rgba(148,163,184,.18) !important`; `box-shadow: 0 1px 0 rgba(255,255,255,.035) inset !important`.
  - `app/styles/41-theme-light.css:999` (global): `min-width: 0 !important`; `overflow: hidden !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.159 `.phase4-home-dashboard .phase4-metric-grid`

- **Archivo origen:** `app/styles/30-modules.css:1770` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1806` (@media (max-width: 1450px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:1770` (global): `display: grid !important`; `grid-template-columns: repeat(6, minmax(130px, 1fr)) !important`; `gap: 14px !important`; `margin-bottom: 16px !important`.
  - `app/styles/30-modules.css:1806` (@media (max-width: 1450px)): `grid-template-columns: repeat(3, minmax(150px, 1fr)) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.160 `.phase4-home-dashboard .phase4-dashboard-grid`

- **Archivo origen:** `app/styles/30-modules.css:1777` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1812` (@media (max-width: 1120px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:1777` (global): `display: grid !important`; `grid-template-columns: minmax(360px, 1.05fr) minmax(360px, .95fr) !important`; `gap: 16px !important`; `align-items: start !important`.
  - `app/styles/30-modules.css:1812` (@media (max-width: 1120px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.161 `.phase4-home-dashboard .phase4-status-layout`

- **Archivo origen:** `app/styles/30-modules.css:1788` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:1815` (@media (max-width: 1120px)).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:1788` (global): `grid-template-columns: 190px 1fr !important`; `gap: 22px !important`; `align-items: center !important`.
  - `app/styles/30-modules.css:1815` (@media (max-width: 1120px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.162 `.print-preview-content h1, .print-preview-content h2`

- **Archivo origen:** `app/styles/30-modules.css:2182` (global).
- **Archivo(s) con variantes:** `app/styles/30-modules.css:2233` (@media print).
- **Propiedades por aparición:**
  - `app/styles/30-modules.css:2182` (global): `font-size: 18px !important`; `line-height: 1.25 !important`.
  - `app/styles/30-modules.css:2233` (@media print): `font-size: 16px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.163 `html[data-theme="dark"] input::placeholder, html[data-theme="dark"] textarea::placeholder`

- **Archivo origen:** `app/styles/40-theme-dark.css:261` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:955` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:261` (global): `color: rgba(170,179,194,.64) !important`.
  - `app/styles/40-theme-dark.css:955` (global): `color: rgba(203,213,225,.55) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.164 `html[data-theme="dark"] select option`

- **Archivo origen:** `app/styles/40-theme-dark.css:266` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:960` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:266` (global): `background: #252d39 !important`; `color: var(--rrll-text) !important`.
  - `app/styles/40-theme-dark.css:960` (global): `background: #252d39 !important`; `color: #e5e7eb !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.165 `html[data-theme="dark"] .print-preview-content th`

- **Archivo origen:** `app/styles/40-theme-dark.css:423` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:494` (@media print), `app/styles/40-theme-dark.css:1085` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:423` (global): `background: #343b46 !important`; `color: #f8fafc !important`.
  - `app/styles/40-theme-dark.css:494` (@media print): `background: #343b46 !important`; `color: #ffffff !important`.
  - `app/styles/40-theme-dark.css:1085` (global): `background: rgba(52,59,70,.88) !important`; `color: rgba(248,250,252,.92) !important`; `border-color: rgba(148,163,184,.15) !important`; `padding: 10px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.166 `html[data-theme="dark"] *`

- **Archivo origen:** `app/styles/40-theme-dark.css:470` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1099` (global), `app/styles/70-components-final.css:2703` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:470` (global): `scrollbar-color: rgba(170,179,194,.42) #242b36 !important`.
  - `app/styles/40-theme-dark.css:1099` (global): `scrollbar-color: rgba(148,163,184,.42) rgba(36,42,54,.72) !important`.
  - `app/styles/70-components-final.css:2703` (global): `scrollbar-color: rgba(170, 179, 194, .46) var(--rrll-surface-base) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.167 `html[data-theme="dark"] *::-webkit-scrollbar-track`

- **Archivo origen:** `app/styles/40-theme-dark.css:473` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1102` (global), `app/styles/70-components-final.css:2707` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:473` (global): `background: #242b36 !important`.
  - `app/styles/40-theme-dark.css:1102` (global): `background: rgba(36,42,54,.72) !important`.
  - `app/styles/70-components-final.css:2707` (global): `background: var(--rrll-surface-base) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.168 `html[data-theme="dark"] *::-webkit-scrollbar-thumb`

- **Archivo origen:** `app/styles/40-theme-dark.css:476` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1105` (global), `app/styles/70-components-final.css:2711` (global).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:476` (global): `background: rgba(170,179,194,.42) !important`; `border-color: #242b36 !important`.
  - `app/styles/40-theme-dark.css:1105` (global): `background: rgba(148,163,184,.42) !important`; `border-color: rgba(36,42,54,.94) !important`.
  - `app/styles/70-components-final.css:2711` (global): `background: rgba(170, 179, 194, .42) !important`; `border-color: var(--rrll-surface-base) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.169 `html[data-theme="dark"] #gestor-tareas :is(.task-toolbar, .tasks-toolbar, .rrll-pro-list-toolbar)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1189` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1276` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1189` (global): `display: flex !important`; `align-items: center !important`; `justify-content: space-between !important`; `gap: 8px !important`; `flex-wrap: nowrap !important`; `padding: 8px 12px !important`.
  - `app/styles/40-theme-dark.css:1276` (@media (max-width: 1200px)): `flex-wrap: wrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.170 `html[data-theme="dark"] #gestor-tareas :is(.task-filters, .rrll-pro-tabs)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1198` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1280` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1198` (global): `display: inline-flex !important`; `align-items: center !important`; `gap: 6px !important`; `margin-right: auto !important`; `flex: 1 1 auto !important`; `min-width: 0 !important`; `flex-wrap: nowrap !important`.
  - `app/styles/40-theme-dark.css:1280` (@media (max-width: 1200px)): `flex: 1 1 100% !important`; `order: 1`; `flex-wrap: wrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.171 `html[data-theme="dark"] #gestor-tareas :is(.task-search, .rrll-pro-search-wrap)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1208` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1286` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1208` (global): `flex: 0 1 280px !important`; `min-width: 190px !important`; `margin-left: auto !important`.
  - `app/styles/40-theme-dark.css:1286` (@media (max-width: 1200px)): `order: 2`; `margin-left: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.172 `html[data-theme="dark"] #gestor-tareas :is(.actions, .rrll-pro-list-actions)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1218` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1291` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1218` (global): `display: inline-flex !important`; `align-items: center !important`; `justify-content: flex-end !important`; `gap: 6px !important`; `flex: 0 0 auto !important`; `margin-left: 0 !important`.
  - `app/styles/40-theme-dark.css:1291` (@media (max-width: 1200px)): `order: 3`; `margin-left: auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.173 `html[data-theme="dark"] #gestor-peticiones :is(.petition-toolbar, .petitions-toolbar, .rrll-pro-list-toolbar)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1306` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1345` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1306` (global): `display: flex !important`; `align-items: center !important`; `justify-content: space-between !important`; `gap: 8px !important`; `flex-wrap: nowrap !important`; `padding: 8px 12px !important`.
  - `app/styles/40-theme-dark.css:1345` (@media (max-width: 1200px)): `flex-wrap: wrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.174 `html[data-theme="dark"] #gestor-peticiones :is(.petition-filters, .rrll-pro-tabs)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1315` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1349` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1315` (global): `display: inline-flex !important`; `align-items: center !important`; `gap: 6px !important`; `margin-right: auto !important`; `flex: 1 1 auto !important`; `min-width: 0 !important`; `flex-wrap: nowrap !important`.
  - `app/styles/40-theme-dark.css:1349` (@media (max-width: 1200px)): `flex: 1 1 100% !important`; `order: 1`; `flex-wrap: wrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.175 `html[data-theme="dark"] #gestor-peticiones :is(.petition-search, .rrll-pro-search-wrap)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1325` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1355` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1325` (global): `flex: 0 1 280px !important`; `min-width: 190px !important`; `margin-left: auto !important`.
  - `app/styles/40-theme-dark.css:1355` (@media (max-width: 1200px)): `order: 2`; `margin-left: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.176 `html[data-theme="dark"] #gestor-peticiones :is(.toolbar-actions, .export-buttons, .rrll-pro-list-actions)`

- **Archivo origen:** `app/styles/40-theme-dark.css:1335` (global).
- **Archivo(s) con variantes:** `app/styles/40-theme-dark.css:1360` (@media (max-width: 1200px)).
- **Propiedades por aparición:**
  - `app/styles/40-theme-dark.css:1335` (global): `display: inline-flex !important`; `align-items: center !important`; `justify-content: flex-end !important`; `gap: 6px !important`; `flex: 0 0 auto !important`; `margin-left: 0 !important`.
  - `app/styles/40-theme-dark.css:1360` (@media (max-width: 1200px)): `order: 3`; `margin-left: auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.177 `html[data-theme="light"] body.phase4-view-module #gestor-licencias .licencias-columns`

- **Archivo origen:** `app/styles/41-theme-light.css:250` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:292` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:250` (global): `display: grid !important`; `grid-template-columns: repeat(2, minmax(0, 1fr)) !important`; `gap: 16px !important`.
  - `app/styles/41-theme-light.css:292` (@media (max-width: 1250px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.178 `#gestor-plantilla .plantilla-toolbar .rrll-pro-list-actions`

- **Archivo origen:** `app/styles/41-theme-light.css:349` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:411` (@media (max-width: 1440px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:349` (global): `display: flex`; `align-items: center`; `justify-content: flex-end`; `gap: 10px`; `flex-wrap: wrap`; `row-gap: 10px`; `min-width: 920px`; `margin-left: auto`.
  - `app/styles/41-theme-light.css:411` (@media (max-width: 1440px)): `justify-content: flex-start`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.179 `body.phase4-view-module #gestor-teletrabajo .rrll-pro-list-actions.telework-list-actions.telework-actions`

- **Archivo origen:** `app/styles/41-theme-light.css:917` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:971` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:917` (global): `display: flex !important`; `flex-wrap: wrap !important`; `justify-content: flex-end !important`; `align-items: center !important`; `align-content: center !important`; `gap: 12px !important`; `width: 100% !important`; `max-width: 100% !important`; `min-width: 0 !important`; `margin: 0 !important`; `padding: 10px 0 0 !important`; `overflow: visible !important`.
  - `app/styles/41-theme-light.css:971` (@media (max-width: 1180px)): `justify-content: flex-start !important`; `padding-top: 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.180 `body.phase4-view-module #gestor-teletrabajo .rrll-pro-list-actions.telework-list-actions.telework-actions .rrll-pro-tool-button:not(.rrll-icon-only)`

- **Archivo origen:** `app/styles/41-theme-light.css:952` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:978` (@media (max-width: 640px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:952` (global): `min-width: max-content !important`.
  - `app/styles/41-theme-light.css:978` (@media (max-width: 640px)): `flex: 1 1 100% !important`; `width: 100% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.181 `.header-logo-wrapper`

- **Archivo origen:** `app/styles/41-theme-light.css:1005` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1040` (@media (max-width: 980px)), `app/styles/41-theme-light.css:1047` (@media (max-width: 520px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1005` (global): `position: relative`; `display: flex`; `align-items: center`; `align-self: center`; `width: clamp(146px, 22.7vw, 227px)`; `max-width: 227px`; `aspect-ratio: 850 / 272`; `height: auto`; `min-width: 0`; `margin: 0`; `overflow: hidden`; `flex: 0 0 auto`; `padding: 3px 7px`.
  - `app/styles/41-theme-light.css:1040` (@media (max-width: 980px)): `width: clamp(146px, 30vw, 210px)`; `max-width: 210px`.
  - `app/styles/41-theme-light.css:1047` (@media (max-width: 520px)): `width: min(100%, 190px)`; `max-width: 190px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.182 `.top-strip .top-title`

- **Archivo origen:** `app/styles/41-theme-light.css:1034` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:1940` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1034` (global): `min-width: 0 !important`; `flex: 1 1 auto`.
  - `app/styles/60-overrides.css:1940` (global): `min-width: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.183 `.phase4-nav-secondary`

- **Archivo origen:** `app/styles/41-theme-light.css:1105` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2435` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1105` (global): `display: grid !important`; `grid-template-columns: 34px 34px minmax(0, 1fr) !important`; `align-items: center !important`; `justify-content: start !important`; `gap: 6px !important`.
  - `app/styles/50-module-extras.css:2435` (global): `margin-top: auto !important`; `display: grid !important`; `grid-template-columns: 34px minmax(0, 1fr) 34px !important`; `align-items: center !important`; `gap: 4px !important`; `padding: 4px 2px 0 !important`; `border-top: 1px solid rgba(148,163,184,.14) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.184 `.phase4-nav-trash-icon, .phase4-nav-settings-icon`

- **Archivo origen:** `app/styles/41-theme-light.css:1116` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2454` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1116` (global): `width: 34px !important`; `min-width: 34px !important`; `height: 34px !important`; `min-height: 34px !important`; `padding: 0 !important`; `justify-content: center !important`; `font-size: 16px !important`; `line-height: 1 !important`; `border-radius: 10px !important`.
  - `app/styles/50-module-extras.css:2454` (global): `align-self: stretch !important`; `display: inline-flex !important`; `align-items: center !important`; `justify-content: center !important`; `width: 34px !important`; `min-width: 34px !important`; `min-height: 32px !important`; `padding: 0 !important`; `margin: 0 !important`; `font-size: 16px !important`; `line-height: 1 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.185 `.phase5-sidebar-sync.save-status-widget`

- **Archivo origen:** `app/styles/41-theme-light.css:1145` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1222` (@media (max-height: 820px)), `app/styles/50-module-extras.css:6` (global), `app/styles/50-module-extras.css:2529` (global), `app/styles/50-module-extras.css:2640` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1145` (global): `grid-template-columns: 8px minmax(0, 1fr) 28px !important`; `align-items: center !important`; `gap: 6px !important`; `margin: auto 8px 8px !important`; `padding: 6px 8px !important`; `border-radius: 11px !important`.
  - `app/styles/41-theme-light.css:1222` (@media (max-height: 820px)): `margin-bottom: 8px !important`; `padding: 6px 8px !important`.
  - `app/styles/50-module-extras.css:6` (global): `position: static !important`; `z-index: auto !important`; `display: grid !important`; `grid-template-columns: 12px 1fr !important`; `gap: 8px 10px !important`; `min-width: 0 !important`; `max-width: none !important`; `margin: auto 12px 14px !important`; `padding: 12px !important`; `border-radius: 14px !important`; `border: 1px solid rgba(148,163,184,.18) !important`; `border-left: 0 !important`; `background: linear-gradient(180deg, rgba(48,55,70,.94), rgba(43,49,61,.98)) !important`; `box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 12px 28px rgba(17,24,39,.20) !important`; `color: #e5e7eb !important`.
  - `app/styles/50-module-extras.css:2529` (global): `grid-template-columns: 9px minmax(0, 1fr) 30px !important`; `align-items: center !important`; `gap: 6px !important`; `margin: 4px 2px 6px !important`; `padding: 7px 8px !important`; `border-radius: 12px !important`.
  - `app/styles/50-module-extras.css:2640` (global): `grid-template-columns: 9px minmax(0, 1fr) 30px !important`; `align-items: start !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.186 `.phase5-sidebar-sync .save-status-dot`

- **Archivo origen:** `app/styles/41-theme-light.css:1153` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:23` (global), `app/styles/50-module-extras.css:2537` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1153` (global): `width: 8px !important`; `height: 8px !important`; `margin-top: 0 !important`.
  - `app/styles/50-module-extras.css:23` (global): `grid-column: 1 !important`; `grid-row: 1 !important`; `width: 9px !important`; `height: 9px !important`; `margin-top: 4px !important`; `border-radius: 50% !important`; `box-shadow: 0 0 0 4px rgba(148,163,184,.08) !important`.
  - `app/styles/50-module-extras.css:2537` (global): `width: 8px !important`; `height: 8px !important`; `margin-top: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.187 `.phase5-sidebar-sync .save-status-text`

- **Archivo origen:** `app/styles/41-theme-light.css:1158` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:32` (global), `app/styles/50-module-extras.css:2542` (global), `app/styles/50-module-extras.css:2644` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1158` (global): `grid-column: 2 !important`; `display: flex !important`; `align-items: baseline !important`; `gap: 4px !important`; `min-width: 0 !important`; `white-space: nowrap !important`; `overflow: hidden !important`.
  - `app/styles/50-module-extras.css:32` (global): `grid-column: 2 !important`; `display: grid !important`; `gap: 4px !important`.
  - `app/styles/50-module-extras.css:2542` (global): `grid-column: 2 !important`; `display: flex !important`; `align-items: baseline !important`; `gap: 4px !important`; `min-width: 0 !important`.
  - `app/styles/50-module-extras.css:2644` (global): `display: grid !important`; `grid-template-columns: minmax(0, 1fr) !important`; `gap: 1px !important`; `align-items: start !important`; `line-height: 1.18 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.188 `.phase5-sidebar-sync .save-status-text b, .phase5-sidebar-sync .save-status-text span`

- **Archivo origen:** `app/styles/41-theme-light.css:1167` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2651` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1167` (global): `overflow: hidden !important`; `text-overflow: ellipsis !important`; `white-space: nowrap !important`; `font-size: 11px !important`; `line-height: 1 !important`.
  - `app/styles/50-module-extras.css:2651` (global): `display: block !important`; `min-width: 0 !important`; `overflow: hidden !important`; `text-overflow: ellipsis !important`; `white-space: nowrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.189 `.phase5-sidebar-sync .save-status-text b`

- **Archivo origen:** `app/styles/41-theme-light.css:1175` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1226` (@media (max-height: 820px)), `app/styles/50-module-extras.css:37` (global), `app/styles/50-module-extras.css:2549` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1175` (global): `flex: 0 0 auto !important`.
  - `app/styles/41-theme-light.css:1226` (@media (max-height: 820px)): `display: inline !important`.
  - `app/styles/50-module-extras.css:37` (global): `color: #f8fafc !important`; `font-size: 12px !important`; `font-weight: 800 !important`.
  - `app/styles/50-module-extras.css:2549` (global): `display: inline !important`; `font-size: 11px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.190 `.phase5-sidebar-sync .save-status-text span`

- **Archivo origen:** `app/styles/41-theme-light.css:1178` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:42` (global), `app/styles/50-module-extras.css:2553` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1178` (global): `flex: 0 1 auto !important`.
  - `app/styles/50-module-extras.css:42` (global): `color: #aab3c2 !important`; `font-size: 11px !important`; `line-height: 1.35 !important`.
  - `app/styles/50-module-extras.css:2553` (global): `overflow: hidden !important`; `text-overflow: ellipsis !important`; `white-space: nowrap !important`; `font-size: 11px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.191 `.phase5-sidebar-sync .sync-now-button`

- **Archivo origen:** `app/styles/41-theme-light.css:1181` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:47` (global), `app/styles/50-module-extras.css:2559` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1181` (global): `grid-column: 3 !important`; `grid-row: 1 !important`; `width: 28px !important`; `min-width: 28px !important`; `height: 28px !important`; `min-height: 28px !important`; `margin: 0 !important`; `padding: 0 !important`; `border-radius: 9px !important`; `font-size: 15px !important`; `line-height: 1 !important`.
  - `app/styles/50-module-extras.css:47` (global): `grid-column: 1 / -1 !important`; `margin-top: 6px !important`; `padding: 8px 10px !important`; `border-radius: 10px !important`; `border: 1px solid rgba(148,163,184,.18) !important`; `background: rgba(52,59,70,.78) !important`; `color: #e5e7eb !important`; `font-size: 12px !important`; `font-weight: 750 !important`.
  - `app/styles/50-module-extras.css:2559` (global): `grid-column: 3 !important`; `width: 28px !important`; `height: 28px !important`; `min-height: 28px !important`; `margin: 0 !important`; `padding: 0 !important`; `border-radius: 9px !important`; `font-size: 16px !important`; `line-height: 1 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.192 `.phase5-sidebar-sync.offline .save-status-dot, .phase5-sidebar-sync.error .save-status-dot`

- **Archivo origen:** `app/styles/41-theme-light.css:1194` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2570` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1194` (global): `background: #ef4444 !important`; `box-shadow: 0 0 0 3px rgba(239, 68, 68, .14) !important`.
  - `app/styles/50-module-extras.css:2570` (global): `background: #ef4444 !important`; `box-shadow: 0 0 0 4px rgba(239,68,68,.13) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.193 `body.phase4-view-home .phase4-main main`

- **Archivo origen:** `app/styles/41-theme-light.css:1232` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1462` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1232` (global): `padding: 10px 18px 22px !important`.
  - `app/styles/41-theme-light.css:1462` (@media (max-width: 900px)): `padding-inline: 14px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.194 `body.phase4-view-home .phase5-useful-dashboard .phase5-metric-grid`

- **Archivo origen:** `app/styles/41-theme-light.css:1267` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1452` (@media (max-width: 1400px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1267` (global): `gap: 10px !important`; `margin-bottom: 10px !important`.
  - `app/styles/41-theme-light.css:1452` (@media (max-width: 1400px)): `grid-template-columns: repeat(3, minmax(160px, 1fr)) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.195 `body.phase4-view-home .phase5-due-layout`

- **Archivo origen:** `app/styles/41-theme-light.css:1350` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:1456` (@media (max-width: 1400px)), `app/styles/41-theme-light.css:1466` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1350` (global): `grid-template-columns: minmax(240px, 1fr) 242px !important`; `gap: 11px !important`.
  - `app/styles/41-theme-light.css:1456` (@media (max-width: 1400px)): `grid-template-columns: minmax(0, 1fr) 242px !important`.
  - `app/styles/41-theme-light.css:1466` (@media (max-width: 900px)): `grid-template-columns: minmax(0, 1fr) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.196 `html[data-theme="light"] :is(.modal-actions, .form-actions, .rrll-pro-form-actions, .professional-actions, .footer-actions, .modal-footer, .print-preview-actions)`

- **Archivo origen:** `app/styles/41-theme-light.css:1919` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:3005` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:1919` (global): `background: #f7f9fb !important`; `border-color: var(--border-soft) !important`.
  - `app/styles/70-components-final.css:3005` (global): `background: var(--rrll-surface-raised) !important`; `border-color: var(--rrll-border) !important`; `box-shadow: inset 0 1px 0 rgba(255, 255, 255, .72) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.197 `html[data-theme="light"] *`

- **Archivo origen:** `app/styles/41-theme-light.css:2019` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:2201` (global), `app/styles/60-overrides.css:3641` (global), `app/styles/70-components-final.css:3106` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:2019` (global): `scrollbar-color: #cbd5e1 var(--rrll-light-table-hover)`.
  - `app/styles/41-theme-light.css:2201` (global): `scrollbar-color: rgba(100,116,139,.45) rgba(226,232,240,.88) !important`.
  - `app/styles/60-overrides.css:3641` (global): `scrollbar-color: rgba(100,130,140,.40) rgba(210,228,230,.60) !important`.
  - `app/styles/70-components-final.css:3106` (global): `scrollbar-color: rgba(100, 116, 139, .34) #eef4f8 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.198 `html[data-theme="light"] *::-webkit-scrollbar-track`

- **Archivo origen:** `app/styles/41-theme-light.css:2023` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:2204` (global), `app/styles/60-overrides.css:3644` (global), `app/styles/70-components-final.css:3110` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:2023` (global): `background: var(--rrll-light-table-hover)`.
  - `app/styles/41-theme-light.css:2204` (global): `background: rgba(226,232,240,.88) !important`.
  - `app/styles/60-overrides.css:3644` (global): `background: rgba(210,228,230,.60) !important`.
  - `app/styles/70-components-final.css:3110` (global): `background: #eef4f8 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.199 `html[data-theme="light"] *::-webkit-scrollbar-thumb`

- **Archivo origen:** `app/styles/41-theme-light.css:2027` (global).
- **Archivo(s) con variantes:** `app/styles/41-theme-light.css:2207` (global), `app/styles/60-overrides.css:3647` (global), `app/styles/70-components-final.css:3114` (global).
- **Propiedades por aparición:**
  - `app/styles/41-theme-light.css:2027` (global): `background: #cbd5e1`; `border: 2px solid var(--rrll-light-table-hover)`; `border-radius: 999px`.
  - `app/styles/41-theme-light.css:2207` (global): `background: rgba(100,116,139,.45) !important`; `border-color: rgba(203,213,225,.95) !important`.
  - `app/styles/60-overrides.css:3647` (global): `background: rgba(100,130,140,.40) !important`; `border-color: rgba(210,228,230,.90) !important`.
  - `app/styles/70-components-final.css:3114` (global): `background: rgba(100, 116, 139, .34) !important`; `border-color: #eef4f8 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.200 `.phase5-useful-dashboard .phase5-metric-grid`

- **Archivo origen:** `app/styles/50-module-extras.css:71` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:232` (@media (max-width: 1400px)), `app/styles/50-module-extras.css:239` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:71` (global): `grid-template-columns: repeat(6, minmax(150px, 1fr)) !important`; `gap: 12px !important`; `margin-bottom: 14px !important`.
  - `app/styles/50-module-extras.css:232` (@media (max-width: 1400px)): `grid-template-columns: repeat(3, minmax(170px, 1fr)) !important`.
  - `app/styles/50-module-extras.css:239` (@media (max-width: 900px)): `grid-template-columns: 1fr 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.201 `.phase5-useful-dashboard .phase5-dashboard-grid`

- **Archivo origen:** `app/styles/50-module-extras.css:138` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:233` (@media (max-width: 1400px)), `app/styles/50-module-extras.css:2377` (global), `app/styles/50-module-extras.css:2397` (@media (max-width: 1400px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:138` (global): `display: grid !important`; `grid-template-columns: minmax(580px, 1.45fr) minmax(280px, .72fr) minmax(300px, .83fr) !important`; `gap: 14px !important`; `align-items: stretch !important`.
  - `app/styles/50-module-extras.css:233` (@media (max-width: 1400px)): `grid-template-columns: 1fr 1fr !important`.
  - `app/styles/50-module-extras.css:2377` (global): `grid-template-columns: minmax(0, 1.45fr) minmax(0, .72fr) minmax(0, .83fr) !important`.
  - `app/styles/50-module-extras.css:2397` (@media (max-width: 1400px)): `grid-template-columns: repeat(2, minmax(0, 1fr)) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.202 `.phase5-useful-dashboard .phase5-due-card`

- **Archivo origen:** `app/styles/50-module-extras.css:152` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:234` (@media (max-width: 1400px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:152` (global): `grid-column: span 1 !important`.
  - `app/styles/50-module-extras.css:234` (@media (max-width: 1400px)): `grid-column: 1 / -1 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.203 `.phase5-useful-dashboard .phase4-list-row.phase5-dashboard-row`

- **Archivo origen:** `app/styles/50-module-extras.css:163` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2381` (global), `app/styles/50-module-extras.css:2408` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:163` (global): `display: grid !important`; `grid-template-columns: 72px 1fr auto !important`; `gap: 3px 10px !important`; `min-height: 48px !important`; `padding: 8px 6px !important`; `border-radius: 10px !important`; `border-bottom: 1px solid rgba(148,163,184,.10) !important`; `background: transparent !important`.
  - `app/styles/50-module-extras.css:2381` (global): `grid-template-columns: minmax(0, 72px) minmax(0, 1fr) auto !important`.
  - `app/styles/50-module-extras.css:2408` (@media (max-width: 900px)): `grid-template-columns: minmax(0, 64px) minmax(0, 1fr) auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.204 `.phase5-calendar-day.has-event`

- **Archivo origen:** `app/styles/50-module-extras.css:211` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:320` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:211` (global): `background: rgba(52,59,70,.82) !important`.
  - `app/styles/50-module-extras.css:320` (global): `cursor: pointer !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.205 `.phase5-calendar-day i, .phase5-calendar-legend i`

- **Archivo origen:** `app/styles/50-module-extras.css:214` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:295` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:214` (global): `width: 5px !important`; `height: 5px !important`; `border-radius: 50% !important`; `display: inline-block !important`.
  - `app/styles/50-module-extras.css:295` (global): `width: 5px !important`; `height: 5px !important`; `min-width: 5px !important`; `max-width: 5px !important`; `min-height: 5px !important`; `max-height: 5px !important`; `padding: 0 !important`; `margin: 0 !important`; `border: 0 !important`; `border-left: 0 !important`; `border-radius: 999px !important`; `display: inline-block !important`; `box-shadow: none !important`; `background-image: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.206 `.phase5-useful-dashboard .phase5-dashboard-grid, .phase5-due-layout`

- **Archivo origen:** `app/styles/50-module-extras.css:237` (@media (max-width: 900px)).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2403` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:237` (@media (max-width: 900px)): `grid-template-columns: 1fr !important`.
  - `app/styles/50-module-extras.css:2403` (@media (max-width: 900px)): `grid-template-columns: minmax(0, 1fr) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.207 `.rrll-pro-list-actions`

- **Archivo origen:** `app/styles/50-module-extras.css:248` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:287` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:248` (global): `display: inline-flex`; `align-items: center`; `gap: 8px`; `flex: 0 0 auto`; `margin-left: auto`.
  - `app/styles/50-module-extras.css:287` (@media (max-width: 980px)): `width: 100%`; `justify-content: flex-start`; `margin-left: 0`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.208 `.rrll-pro-vinculograma-form`

- **Archivo origen:** `app/styles/50-module-extras.css:453` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:500` (@media (max-width: 1350px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:453` (global): `grid-template-columns: minmax(150px, .8fr) minmax(220px, 1.4fr) minmax(160px, .9fr) minmax(160px, .9fr) auto`; `align-items: end`.
  - `app/styles/50-module-extras.css:500` (@media (max-width: 1350px)): `grid-template-columns: repeat(2, minmax(0, 1fr))`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.209 `.rrll-pro-vinculograma-form .rrll-pro-form-actions`

- **Archivo origen:** `app/styles/50-module-extras.css:457` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:503` (@media (max-width: 1350px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:457` (global): `display: flex`; `align-items: end`; `justify-content: flex-end`; `min-height: 62px`.
  - `app/styles/50-module-extras.css:503` (@media (max-width: 1350px)): `justify-content: stretch`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.210 `.rrll-pro-vinculograma-form .rrll-pro-primary`

- **Archivo origen:** `app/styles/50-module-extras.css:463` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:506` (@media (max-width: 1350px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:463` (global): `min-height: 40px`; `padding-inline: 22px`; `white-space: nowrap`.
  - `app/styles/50-module-extras.css:506` (@media (max-width: 1350px)): `width: 100%`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.211 `.vinculograma-columns`

- **Archivo origen:** `app/styles/50-module-extras.css:468` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:509` (@media (max-width: 1350px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:468` (global): `display: grid`; `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`; `gap: 18px`.
  - `app/styles/50-module-extras.css:509` (@media (max-width: 1350px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.212 `.rrll-pro-licencias-form`

- **Archivo origen:** `app/styles/50-module-extras.css:518` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:633` (@media (max-width: 1500px)), `app/styles/50-module-extras.css:649` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:518` (global): `grid-template-columns: minmax(120px, .7fr) minmax(190px, 1.2fr) minmax(140px, .8fr) minmax(170px, 1fr) minmax(140px, .8fr) minmax(140px, .8fr) auto`; `align-items: end`.
  - `app/styles/50-module-extras.css:633` (@media (max-width: 1500px)): `grid-template-columns: repeat(3, minmax(0, 1fr))`.
  - `app/styles/50-module-extras.css:649` (@media (max-width: 900px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.213 `.rrll-pro-licencias-form .rrll-pro-form-actions`

- **Archivo origen:** `app/styles/50-module-extras.css:522` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:636` (@media (max-width: 1500px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:522` (global): `min-height: 62px`; `align-items: end`.
  - `app/styles/50-module-extras.css:636` (@media (max-width: 1500px)): `justify-content: stretch`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.214 `.rrll-pro-licencias-form .rrll-pro-primary`

- **Archivo origen:** `app/styles/50-module-extras.css:526` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:639` (@media (max-width: 1500px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:526` (global): `min-height: 40px`; `padding-inline: 20px`; `white-space: nowrap`.
  - `app/styles/50-module-extras.css:639` (@media (max-width: 1500px)): `width: 100%`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.215 `.licencias-columns`

- **Archivo origen:** `app/styles/50-module-extras.css:531` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:644` (@media (max-width: 1250px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:531` (global): `display: grid`; `grid-template-columns: repeat(3, minmax(0, 1fr))`; `gap: 16px`.
  - `app/styles/50-module-extras.css:644` (@media (max-width: 1250px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.216 `.rrll-pro-table thead th, .professional-table thead th, .data-table thead th, table:not(.print-frame table) thead th`

- **Archivo origen:** `app/styles/50-module-extras.css:1056` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:201` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1056` (global): `background: rgba(52,59,70,.96) !important`; `color: rgba(229,231,235,.92) !important`; `border-color: rgba(148,163,184,.15) !important`.
  - `app/styles/60-overrides.css:201` (global): `background: #343b46 !important`; `color: rgba(229,231,235,.92) !important`; `border-color: rgba(148,163,184,.15) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.217 `.rrll-pro-table td, .professional-table td, .data-table td, table:not(.print-frame table) td`

- **Archivo origen:** `app/styles/50-module-extras.css:1079` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:227` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1079` (global): `color: rgba(229,231,235,.88) !important`; `border-color: rgba(148,163,184,.12) !important`.
  - `app/styles/60-overrides.css:227` (global): `color: rgba(229,231,235,.90) !important`; `border-color: rgba(148,163,184,.12) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.218 `input::placeholder, textarea::placeholder, .rrll-pro-search-wrap input::placeholder`

- **Archivo origen:** `app/styles/50-module-extras.css:1123` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:183` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1123` (global): `color: rgba(203,213,225,.56) !important`.
  - `app/styles/60-overrides.css:183` (global): `color: rgba(203,213,225,.58) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.219 `select option`

- **Archivo origen:** `app/styles/50-module-extras.css:1128` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:188` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1128` (global): `background: #303746 !important`; `color: var(--rrll-text) !important`.
  - `app/styles/60-overrides.css:188` (global): `background: #303746 !important`; `color: #e5e7eb !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.220 `.telework-campaign-summary`

- **Archivo origen:** `app/styles/50-module-extras.css:1256` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1357` (@media (max-width: 1100px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1256` (global): `display: grid`; `grid-template-columns: repeat(6, minmax(120px, 1fr))`; `gap: 10px`; `margin: 12px 0`.
  - `app/styles/50-module-extras.css:1357` (@media (max-width: 1100px)): `grid-template-columns: repeat(2, minmax(120px, 1fr))`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.221 `.telework-intake-form`

- **Archivo origen:** `app/styles/50-module-extras.css:1608` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1657` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1608` (global): `grid-template-columns: minmax(280px, .8fr) minmax(0, 1.2fr) !important`; `gap: 14px !important`.
  - `app/styles/50-module-extras.css:1657` (@media (max-width: 980px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.222 `.telework-import-grid`

- **Archivo origen:** `app/styles/50-module-extras.css:1697` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1733` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1697` (global): `display: grid`; `grid-template-columns: repeat(2, minmax(0, 1fr))`; `gap: 14px`.
  - `app/styles/50-module-extras.css:1733` (@media (max-width: 720px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.223 `.telework-catalog-modal .telework-catalog-box`

- **Archivo origen:** `app/styles/50-module-extras.css:1739` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1848` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1739` (global): `width: min(1180px, calc(100vw - 28px))`; `max-height: calc(100vh - 32px)`; `display: flex`; `flex-direction: column`; `overflow: hidden`.
  - `app/styles/50-module-extras.css:1848` (@media (max-width: 760px)): `width: calc(100vw - 16px)`; `max-height: calc(100vh - 16px)`; `padding: 14px`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.224 `.telework-catalog-toolbar`

- **Archivo origen:** `app/styles/50-module-extras.css:1747` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1839` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1747` (global): `display: flex`; `align-items: end`; `justify-content: space-between`; `gap: 14px`; `margin-bottom: 12px`.
  - `app/styles/50-module-extras.css:1839` (@media (max-width: 760px)): `align-items: stretch`; `flex-direction: column`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.225 `.telework-catalog-search`

- **Archivo origen:** `app/styles/50-module-extras.css:1755` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:1844` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1755` (global): `flex: 1 1 520px`; `margin: 0`.
  - `app/styles/50-module-extras.css:1844` (@media (max-width: 760px)): `flex-basis: auto`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.226 `.dashboard-search-icon`

- **Archivo origen:** `app/styles/50-module-extras.css:1941` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2104` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:1941` (global): `width: 36px !important`; `height: 36px !important`; `display: grid !important`; `place-items: center !important`; `border-radius: 12px !important`; `color: #93c5fd !important`; `background: rgba(59,130,246,.12) !important`; `border: 1px solid rgba(96,165,250,.18) !important`; `font-size: 22px !important`; `line-height: 1 !important`.
  - `app/styles/50-module-extras.css:2104` (@media (max-width: 900px)): `display: none !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.227 `.dashboard-search-meta`

- **Archivo origen:** `app/styles/50-module-extras.css:2081` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2107` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2081` (global): `display: flex !important`; `flex-wrap: wrap !important`; `justify-content: flex-end !important`; `gap: 5px !important`.
  - `app/styles/50-module-extras.css:2107` (@media (max-width: 900px)): `justify-content: flex-start !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.228 `.dashboard-timeline`

- **Archivo origen:** `app/styles/50-module-extras.css:2121` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2258` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2121` (global): `position: relative !important`; `display: grid !important`; `gap: 16px !important`; `padding: 2px 0 2px 8px !important`.
  - `app/styles/50-module-extras.css:2258` (@media (max-width: 900px)): `padding-left: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.229 `.dashboard-timeline::before`

- **Archivo origen:** `app/styles/50-module-extras.css:2128` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2262` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2128` (global): `content: "" !important`; `position: absolute !important`; `top: 8px !important`; `bottom: 8px !important`; `left: 18px !important`; `width: 1px !important`; `background: linear-gradient(180deg, rgba(96,165,250,.08), rgba(148,163,184,.28), rgba(167,139,250,.08)) !important`.
  - `app/styles/50-module-extras.css:2262` (@media (max-width: 900px)): `left: 10px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.230 `.dashboard-timeline-year h4`

- **Archivo origen:** `app/styles/50-module-extras.css:2144` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2266` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2144` (global): `position: relative !important`; `z-index: 1 !important`; `width: fit-content !important`; `margin: 0 0 2px 26px !important`; `padding: 4px 9px !important`; `border-radius: 999px !important`; `color: #dbeafe !important`; `background: rgba(15,23,42,.88) !important`; `border: 1px solid rgba(148,163,184,.18) !important`; `font-size: 12px !important`; `font-weight: 900 !important`; `letter-spacing: .02em !important`.
  - `app/styles/50-module-extras.css:2266` (@media (max-width: 900px)): `margin-left: 22px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.231 `.dashboard-timeline-item`

- **Archivo origen:** `app/styles/50-module-extras.css:2159` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2270` (@media (max-width: 900px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2159` (global): `position: relative !important`; `display: grid !important`; `grid-template-columns: 24px minmax(0, 1fr) !important`; `gap: 10px !important`; `width: 100% !important`; `padding: 0 !important`; `border: 0 !important`; `background: transparent !important`; `color: inherit !important`; `text-align: left !important`.
  - `app/styles/50-module-extras.css:2270` (@media (max-width: 900px)): `grid-template-columns: 20px minmax(0, 1fr) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.232 `body.phase4-view-module #gestor-teletrabajo .telework-header-actions`

- **Archivo origen:** `app/styles/50-module-extras.css:2276` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2319` (@media (max-width: 760px)), `app/styles/60-overrides.css:4144` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2276` (global): `display: flex`; `flex-wrap: wrap`; `align-items: center`; `justify-content: flex-end`; `gap: 12px`; `min-width: 0`.
  - `app/styles/50-module-extras.css:2319` (@media (max-width: 760px)): `justify-content: flex-start`; `width: 100%`.
  - `app/styles/60-overrides.css:4144` (global): `display: flex !important`; `align-items: flex-end !important`; `gap: 10px !important`; `flex-wrap: wrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.233 `body.phase4-view-module #gestor-teletrabajo .telework-campaign-picker`

- **Archivo origen:** `app/styles/50-module-extras.css:2299` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4151` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2299` (global): `display: inline-flex`; `align-items: center`; `gap: 8px`; `margin: 0`; `min-height: 44px`.
  - `app/styles/60-overrides.css:4151` (global): `min-width: 220px !important`; `flex: 1 1 240px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.234 `body.phase4-view-module #gestor-teletrabajo .telework-campaign-picker select`

- **Archivo origen:** `app/styles/50-module-extras.css:2312` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2329` (@media (max-width: 760px)), `app/styles/60-overrides.css:4156` (global).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2312` (global): `margin: 0`; `height: 44px`; `padding-block: 0`.
  - `app/styles/50-module-extras.css:2329` (@media (max-width: 760px)): `flex: 1 1 140px`.
  - `app/styles/60-overrides.css:4156` (global): `width: 100% !important`; `min-height: 40px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.235 `.ticket-calendar-grid`

- **Archivo origen:** `app/styles/50-module-extras.css:2601` (global).
- **Archivo(s) con variantes:** `app/styles/50-module-extras.css:2628` (@media (max-width: 1280px)).
- **Propiedades por aparición:**
  - `app/styles/50-module-extras.css:2601` (global): `display: grid`; `grid-template-columns: repeat(4, minmax(0, 1fr))`; `gap: 12px`.
  - `app/styles/50-module-extras.css:2628` (@media (max-width: 1280px)): `grid-template-columns: repeat(3, minmax(0, 1fr))`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.236 `.theme-choice-row`

- **Archivo origen:** `app/styles/60-overrides.css:1013` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:1068` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1013` (global): `display: grid`; `grid-template-columns: repeat(2, minmax(0, 1fr))`; `gap: 12px`; `margin-top: 12px`.
  - `app/styles/60-overrides.css:1068` (@media (max-width: 760px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.237 `html[data-theme="light"] input::placeholder, html[data-theme="light"] textarea::placeholder, html[data-theme="light"] .rrll-pro-search-wrap input::placeholder`

- **Archivo origen:** `app/styles/60-overrides.css:1251` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:2976` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1251` (global): `color: rgba(18, 24, 32, .76) !important`.
  - `app/styles/70-components-final.css:2976` (global): `color: var(--rrll-text-muted) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.238 `html[data-theme="light"] select option`

- **Archivo origen:** `app/styles/60-overrides.css:1296` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:2982` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1296` (global): `background: var(--rrll-field-bg) !important`; `color: var(--rrll-text-main) !important`.
  - `app/styles/70-components-final.css:2982` (global): `background: var(--rrll-bg-panel-light) !important`; `color: var(--rrll-text-main) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.239 `.vinculograma-edit-modal .rrll-pro-edit-form`

- **Archivo origen:** `app/styles/60-overrides.css:1430` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:1435` (@media (max-width: 1150px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1430` (global): `margin-top: 12px`; `grid-template-columns: minmax(130px, .8fr) minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(150px, .9fr) minmax(150px, .9fr)`.
  - `app/styles/60-overrides.css:1435` (@media (max-width: 1150px)): `grid-template-columns: repeat(2, minmax(0, 1fr))`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.240 `.committee-header, .parity-header, .committee-topbar, .parity-topbar, .sessions-header, .points-header`

- **Archivo origen:** `app/styles/60-overrides.css:1515` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:1652` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1515` (global): `background: linear-gradient(180deg, rgba(51, 60, 74, 0.96), rgba(43, 51, 64, 0.96)) !important`; `border: 1px solid rgba(148, 163, 184, 0.16) !important`; `border-radius: 18px !important`; `box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18) !important`; `min-height: 72px !important`; `padding: 18px 24px !important`; `margin: 0 0 22px 0 !important`; `display: grid !important`; `grid-template-columns: minmax(220px, 1fr) auto minmax(120px, auto) !important`; `align-items: center !important`; `gap: 16px !important`.
  - `app/styles/60-overrides.css:1652` (@media (max-width: 980px)): `grid-template-columns: 1fr !important`; `align-items: stretch !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.241 `body.phase4-view-module :is( details.module-card, details.committee-main, details.paritaria-main, details.committee-subsection, details.paritaria-subsection ) > summary`

- **Archivo origen:** `app/styles/60-overrides.css:1968` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2188` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:1968` (global): `position: relative !important`; `display: grid !important`; `grid-template-columns: minmax(220px, 1fr) auto minmax(88px, auto) !important`; `align-items: center !important`; `column-gap: 12px !important`; `min-height: 52px !important`; `margin: 0 !important`; `padding: 9px 14px !important`; `border: 1px solid rgba(148,163,184,.18) !important`; `border-radius: 16px !important`; `background: radial-gradient(circle at 0 0, rgba(59,130,246,.18), transparent 32%), linear-gradient(135deg, rgba(43,49,61,.98) 0%, rgba(36,43,54,.98) 100%) !important`; `box-shadow: 0 12px 28px rgba(15,23,42,.16) !important`; `color: #f8fafc !important`.
  - `app/styles/60-overrides.css:2188` (@media (max-width: 980px)): `grid-template-columns: 1fr !important`; `row-gap: 8px !important`; `align-items: start !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.242 `body.phase4-view-module .rrll-pro-task-head, body.phase4-view-module .rrll-pro-petition-head, body.phase4-view-module .rrll-pro-minutes-head, body.phase4-view-module .rrll-pro-telework-head, body.phase4-view-module .rrll-pro-committee-head, body.phase4-view-module .rrll-pro-paritaria-head, body.phase4-view-module .rrll-pro-vinc-head, body.phase4-view-module .rrll-pro-license-head, body.phase4-view-module .rrll-pro-plantilla-head, body.phase4-view-module .professional-header, body.phase4-view-module .module-header`

- **Archivo origen:** `app/styles/60-overrides.css:2282` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2359` (@media (max-width: 980px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2282` (global): `min-height: auto !important`; `padding: 4px 0 12px !important`; `margin: 0 0 10px !important`; `display: flex !important`; `align-items: center !important`; `justify-content: space-between !important`; `gap: 16px !important`.
  - `app/styles/60-overrides.css:2359` (@media (max-width: 980px)): `align-items: stretch !important`; `flex-direction: column !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.243 `body.phase4-view-module #gestor-vinculograma .vinculograma-table th:nth-child(2), body.phase4-view-module #gestor-vinculograma .vinculograma-table td:nth-child(2)`

- **Archivo origen:** `app/styles/60-overrides.css:2446` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2723` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2446` (global): `width: 24% !important`.
  - `app/styles/60-overrides.css:2723` (global): `width: 26% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.244 `body.phase4-view-module #gestor-vinculograma .vinculograma-table th:nth-child(3), body.phase4-view-module #gestor-vinculograma .vinculograma-table td:nth-child(3)`

- **Archivo origen:** `app/styles/60-overrides.css:2451` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2728` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2451` (global): `width: 24% !important`.
  - `app/styles/60-overrides.css:2728` (global): `width: 29% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.245 `body.phase4-view-module #gestor-vinculograma .vinculograma-table th:nth-child(4), body.phase4-view-module #gestor-vinculograma .vinculograma-table td:nth-child(4)`

- **Archivo origen:** `app/styles/60-overrides.css:2456` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2733` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2456` (global): `width: 13% !important`.
  - `app/styles/60-overrides.css:2733` (global): `width: 20% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.246 `body.phase4-view-module #gestor-vinculograma .vinculograma-table th:nth-child(5), body.phase4-view-module #gestor-vinculograma .vinculograma-table td:nth-child(5)`

- **Archivo origen:** `app/styles/60-overrides.css:2494` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2738` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2494` (global): `width: 17% !important`.
  - `app/styles/60-overrides.css:2738` (global): `width: 13% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.247 `body.phase4-view-module #gestor-actas .rrll-pro-list-toolbar`

- **Archivo origen:** `app/styles/60-overrides.css:2521` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2634` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2521` (global): `display: grid !important`; `grid-template-columns: minmax(320px, auto) minmax(260px, 1fr) auto !important`; `align-items: center !important`; `gap: 12px !important`.
  - `app/styles/60-overrides.css:2634` (@media (max-width: 1180px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.248 `body.phase4-view-module #gestor-actas .rrll-pro-list-actions`

- **Archivo origen:** `app/styles/60-overrides.css:2528` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2641` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2528` (global): `display: flex !important`; `justify-content: flex-end !important`; `align-items: center !important`; `gap: 8px !important`; `min-width: 92px !important`.
  - `app/styles/60-overrides.css:2641` (@media (max-width: 1180px)): `justify-content: flex-start !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.249 `body.phase4-view-module #gestor-actas .rrll-pro-minutes-table th:nth-child(1), body.phase4-view-module #gestor-actas .rrll-pro-minutes-table td:nth-child(1)`

- **Archivo origen:** `app/styles/60-overrides.css:2580` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3506` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2580` (global): `width: 35% !important`.
  - `app/styles/60-overrides.css:3506` (global): `width: 40% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.250 `body.phase4-view-module #gestor-actas .rrll-pro-minutes-table th:nth-child(2), body.phase4-view-module #gestor-actas .rrll-pro-minutes-table td:nth-child(2)`

- **Archivo origen:** `app/styles/60-overrides.css:2583` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3508` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2583` (global): `width: 17% !important`.
  - `app/styles/60-overrides.css:3508` (global): `width: 16% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.251 `body.phase4-view-module #gestor-actas .rrll-pro-minutes-table th:nth-child(3), body.phase4-view-module #gestor-actas .rrll-pro-minutes-table td:nth-child(3)`

- **Archivo origen:** `app/styles/60-overrides.css:2586` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3510` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2586` (global): `width: 18% !important`.
  - `app/styles/60-overrides.css:3510` (global): `width: 15% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.252 `body.phase4-view-module #gestor-actas .rrll-pro-minutes-table th:nth-child(5), body.phase4-view-module #gestor-actas .rrll-pro-minutes-table td:nth-child(5)`

- **Archivo origen:** `app/styles/60-overrides.css:2592` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3514` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2592` (global): `width: 20% !important`.
  - `app/styles/60-overrides.css:3514` (global): `width: 19% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.253 `body.phase4-view-module #gestor-teletrabajo .rrll-pro-list-actions.telework-list-actions`

- **Archivo origen:** `app/styles/60-overrides.css:2826` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2872` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2826` (global): `display: flex !important`; `align-items: center !important`; `justify-content: flex-end !important`; `gap: 8px !important`; `flex-wrap: nowrap !important`; `min-width: 0 !important`; `width: auto !important`; `margin-left: auto !important`.
  - `app/styles/60-overrides.css:2872` (@media (max-width: 1180px)): `justify-content: flex-start !important`; `width: 100% !important`; `margin-left: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.254 `body[data-active-module="gestor-tareas"] #gestor-tareas, body[data-active-module="gestor-peticiones"] #gestor-peticiones, body[data-active-module="gestor-comite"] #gestor-comite, body[data-active-module="gestor-paritaria"] #gestor-paritaria, body[data-active-module="gestor-actas"] #gestor-actas, body[data-active-module="gestor-teletrabajo"] #gestor-teletrabajo, body[data-active-module="gestor-vinculograma"] #gestor-vinculograma, body[data-active-module="gestor-plantilla"] #gestor-plantilla, body[data-active-module="gestor-licencias"] #gestor-licencias`

- **Archivo origen:** `app/styles/60-overrides.css:2894` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:2935` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:2894` (global): `display: block !important`; `visibility: visible !important`; `height: auto !important`; `max-height: none !important`; `min-height: 0 !important`; `margin: 0 !important`; `padding: var(--space-4, 24px) !important`; `border: 1px solid var(--border-color, rgba(148, 163, 184, .18)) !important`; `overflow: visible !important`; `pointer-events: auto !important`.
  - `app/styles/60-overrides.css:2935` (global): `display: block !important`; `visibility: visible !important`; `height: auto !important`; `max-height: none !important`; `min-height: 0 !important`; `overflow: visible !important`; `pointer-events: auto !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.255 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-list-toolbar`

- **Archivo origen:** `app/styles/60-overrides.css:3019` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3177` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3019` (global): `display: grid !important`; `grid-template-columns: minmax(320px, auto) minmax(180px, 1fr) auto !important`; `align-items: center !important`; `gap: 10px !important`; `padding: 9px 10px !important`.
  - `app/styles/60-overrides.css:3177` (@media (max-width: 1180px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.256 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-list-actions`

- **Archivo origen:** `app/styles/60-overrides.css:3039` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3181` (@media (max-width: 1180px)), `app/styles/60-overrides.css:3692` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3039` (global): `display: inline-flex !important`; `align-items: center !important`; `justify-content: flex-end !important`; `gap: 8px !important`; `min-width: 0 !important`; `margin-left: 0 !important`; `white-space: nowrap !important`.
  - `app/styles/60-overrides.css:3181` (@media (max-width: 1180px)): `justify-content: flex-start !important`; `flex-wrap: wrap !important`.
  - `app/styles/60-overrides.css:3692` (global): `display: flex !important`; `justify-content: flex-end !important`; `align-items: center !important`; `gap: 8px !important`; `min-width: 92px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.257 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-table-wrap`

- **Archivo origen:** `app/styles/60-overrides.css:3049` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3715` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3049` (global): `width: 100% !important`; `max-width: 100% !important`; `overflow-x: hidden !important`.
  - `app/styles/60-overrides.css:3715` (global): `overflow-x: hidden !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.258 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table`

- **Archivo origen:** `app/styles/60-overrides.css:3055` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3719` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3055` (global): `width: 100% !important`; `min-width: 0 !important`; `table-layout: fixed !important`; `border-collapse: collapse !important`.
  - `app/styles/60-overrides.css:3719` (global): `width: 100% !important`; `min-width: 0 !important`; `table-layout: fixed !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.259 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th, body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td`

- **Archivo origen:** `app/styles/60-overrides.css:3074` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3725` (global), `app/styles/60-overrides.css:3993` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3074` (global): `padding: 6px 8px !important`; `vertical-align: middle !important`; `white-space: normal !important`; `overflow: hidden !important`; `text-overflow: ellipsis !important`.
  - `app/styles/60-overrides.css:3725` (global): `vertical-align: middle !important`; `box-sizing: border-box !important`; `overflow: hidden !important`.
  - `app/styles/60-overrides.css:3993` (global): `text-align: center !important`; `white-space: normal !important`; `overflow-wrap: anywhere !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.260 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(1), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(1)`

- **Archivo origen:** `app/styles/60-overrides.css:3083` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3518` (global), `app/styles/60-overrides.css:3732` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3083` (global): `width: 29% !important`.
  - `app/styles/60-overrides.css:3518` (global): `width: 32% !important`.
  - `app/styles/60-overrides.css:3732` (global): `width: 30% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.261 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(2), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(2)`

- **Archivo origen:** `app/styles/60-overrides.css:3085` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3520` (global), `app/styles/60-overrides.css:3734` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3085` (global): `width: 12% !important`.
  - `app/styles/60-overrides.css:3520` (global): `width: 12% !important`.
  - `app/styles/60-overrides.css:3734` (global): `width: 11% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.262 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(3), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(3)`

- **Archivo origen:** `app/styles/60-overrides.css:3087` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3522` (global), `app/styles/60-overrides.css:3736` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3087` (global): `width: 10% !important`.
  - `app/styles/60-overrides.css:3522` (global): `width: 10% !important`.
  - `app/styles/60-overrides.css:3736` (global): `width: 9% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.263 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(4), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(4)`

- **Archivo origen:** `app/styles/60-overrides.css:3089` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3524` (global), `app/styles/60-overrides.css:3738` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3089` (global): `width: 11% !important`.
  - `app/styles/60-overrides.css:3524` (global): `width: 11% !important`.
  - `app/styles/60-overrides.css:3738` (global): `width: 10% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.264 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(5), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(5)`

- **Archivo origen:** `app/styles/60-overrides.css:3091` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3526` (global), `app/styles/60-overrides.css:3740` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3091` (global): `width: 13% !important`.
  - `app/styles/60-overrides.css:3526` (global): `width: 13% !important`.
  - `app/styles/60-overrides.css:3740` (global): `width: 12% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.265 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(6), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(6)`

- **Archivo origen:** `app/styles/60-overrides.css:3093` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3528` (global), `app/styles/60-overrides.css:3742` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3093` (global): `width: 13% !important`.
  - `app/styles/60-overrides.css:3528` (global): `width: 10% !important`.
  - `app/styles/60-overrides.css:3742` (global): `width: 12% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.266 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table th:nth-child(7), body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-committee-table td:nth-child(7)`

- **Archivo origen:** `app/styles/60-overrides.css:3095` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3530` (global), `app/styles/60-overrides.css:3744` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3095` (global): `width: 12% !important`.
  - `app/styles/60-overrides.css:3530` (global): `width: 12% !important`.
  - `app/styles/60-overrides.css:3744` (global): `width: 16% !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.267 `body.phase4-view-module :is(#gestor-puntos-comite, #gestor-puntos-paritaria) .rrll-pro-actions`

- **Archivo origen:** `app/styles/60-overrides.css:3125` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3775` (global), `app/styles/60-overrides.css:4005` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3125` (global): `display: flex !important`; `flex-wrap: wrap !important`; `justify-content: flex-end !important`; `align-items: center !important`; `gap: 4px !important`; `min-width: 0 !important`; `overflow: visible !important`.
  - `app/styles/60-overrides.css:3775` (global): `min-width: 0 !important`; `text-align: right !important`; `white-space: normal !important`; `overflow: visible !important`.
  - `app/styles/60-overrides.css:4005` (global): `text-align: center !important`; `vertical-align: middle !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.268 `body.phase4-view-module :is(#gestor-sesiones-comite, #gestor-sesiones-paritaria) .session-columns`

- **Archivo origen:** `app/styles/60-overrides.css:3145` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3186` (@media (max-width: 1180px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3145` (global): `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important`; `gap: 12px !important`; `max-width: 100% !important`; `overflow-x: hidden !important`.
  - `app/styles/60-overrides.css:3186` (@media (max-width: 1180px)): `grid-template-columns: 1fr !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.269 `body.phase4-view-module :is(#gestor-sesiones-comite, #gestor-sesiones-paritaria) .session-card-toolbar`

- **Archivo origen:** `app/styles/60-overrides.css:3164` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4054` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3164` (global): `display: flex !important`; `justify-content: flex-end !important`; `gap: 6px !important`; `padding: 0 !important`.
  - `app/styles/60-overrides.css:4054` (global): `justify-content: flex-end !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.270 `body.phase4-view-module #gestor-tareas :is(.rrll-pro-table, .rrll-pro-table-tasks) th:nth-child(6), body.phase4-view-module #gestor-tareas :is(.rrll-pro-table, .rrll-pro-table-tasks) td:nth-child(6)`

- **Archivo origen:** `app/styles/60-overrides.css:3355` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3398` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3355` (global): `width: 22% !important`; `min-width: 170px !important`; `overflow: hidden !important`.
  - `app/styles/60-overrides.css:3398` (@media (max-width: 720px)): `width: 24% !important`; `min-width: 130px !important`; `text-align: right !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.271 `body.phase4-view-module #gestor-tareas :is(.rrll-pro-table, .rrll-pro-table-tasks) .rrll-pro-actions`

- **Archivo origen:** `app/styles/60-overrides.css:3371` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3405` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3371` (global): `display: flex !important`; `justify-content: flex-end !important`; `align-items: center !important`; `gap: 5px !important`; `flex-wrap: wrap !important`; `width: 100% !important`; `max-width: 100% !important`; `overflow: hidden !important`; `text-align: right !important`; `box-sizing: border-box !important`.
  - `app/styles/60-overrides.css:3405` (@media (max-width: 720px)): `flex-direction: column !important`; `align-items: flex-end !important`; `justify-content: flex-start !important`; `flex-wrap: nowrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.272 `body.phase4-view-module #gestor-tareas :is(.rrll-pro-table, .rrll-pro-table-tasks) .rrll-pro-actions button`

- **Archivo origen:** `app/styles/60-overrides.css:3384` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3412` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3384` (global): `min-width: 82px !important`; `box-sizing: border-box !important`; `white-space: nowrap !important`; `flex: 0 0 auto !important`.
  - `app/styles/60-overrides.css:3412` (@media (max-width: 720px)): `width: auto !important`; `min-width: 82px !important`; `margin: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.273 `body.phase4-view-module #gestor-tareas :is(.rrll-pro-table, .rrll-pro-table-tasks) .rrll-pro-actions .rrll-delete-icon-button`

- **Archivo origen:** `app/styles/60-overrides.css:3391` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3418` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3391` (global): `min-width: 32px !important`; `width: 32px !important`; `padding-inline: 0 !important`.
  - `app/styles/60-overrides.css:3418` (@media (max-width: 720px)): `min-width: 32px !important`; `width: 32px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.274 `body.phase4-view-module #gestor-peticiones .rrll-pro-table th:nth-child(6), body.phase4-view-module #gestor-peticiones .rrll-pro-table td:nth-child(6)`

- **Archivo origen:** `app/styles/60-overrides.css:3435` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3479` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3435` (global): `display: table-cell !important`; `width: 22% !important`; `min-width: 170px !important`; `overflow: hidden !important`.
  - `app/styles/60-overrides.css:3479` (@media (max-width: 720px)): `width: 24% !important`; `min-width: 130px !important`; `text-align: right !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.275 `body.phase4-view-module #gestor-peticiones .rrll-pro-table .rrll-pro-actions`

- **Archivo origen:** `app/styles/60-overrides.css:3452` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3486` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3452` (global): `display: flex !important`; `justify-content: flex-end !important`; `align-items: center !important`; `gap: 5px !important`; `flex-wrap: wrap !important`; `width: 100% !important`; `max-width: 100% !important`; `overflow: hidden !important`; `text-align: right !important`; `box-sizing: border-box !important`.
  - `app/styles/60-overrides.css:3486` (@media (max-width: 720px)): `flex-direction: column !important`; `align-items: flex-end !important`; `justify-content: flex-start !important`; `flex-wrap: nowrap !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.276 `body.phase4-view-module #gestor-peticiones .rrll-pro-table .rrll-pro-actions button`

- **Archivo origen:** `app/styles/60-overrides.css:3465` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3493` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3465` (global): `min-width: 82px !important`; `box-sizing: border-box !important`; `white-space: nowrap !important`; `flex: 0 0 auto !important`.
  - `app/styles/60-overrides.css:3493` (@media (max-width: 720px)): `width: auto !important`; `min-width: 82px !important`; `margin: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.277 `body.phase4-view-module #gestor-peticiones .rrll-pro-table .rrll-pro-actions .rrll-delete-icon-button`

- **Archivo origen:** `app/styles/60-overrides.css:3472` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:3499` (@media (max-width: 720px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:3472` (global): `min-width: 32px !important`; `width: 32px !important`; `padding-inline: 0 !important`.
  - `app/styles/60-overrides.css:3499` (@media (max-width: 720px)): `min-width: 32px !important`; `width: 32px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.278 `body.phase4-view-module :is(#committeeSessionCloseModal, #paritariaSessionCloseModal) .session-close-content small`

- **Archivo origen:** `app/styles/60-overrides.css:4121` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4125` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:4121` (global): `color: var(--muted) !important`.
  - `app/styles/60-overrides.css:4125` (global): `display: flex !important`; `flex-wrap: wrap !important`; `gap: 4px 12px !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.279 `body.phase4-view-module #gestor-teletrabajo .telework-table`

- **Archivo origen:** `app/styles/60-overrides.css:4189` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4266` (global).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:4189` (global): `width: 100% !important`; `min-width: 0 !important`; `table-layout: fixed !important`.
  - `app/styles/60-overrides.css:4266` (global): `min-width: 0 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.280 `.criteria-toolbar`

- **Archivo origen:** `app/styles/60-overrides.css:4334` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4537` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:4334` (global): `display: flex`; `align-items: flex-end`; `justify-content: space-between`; `gap: 14px`; `flex-wrap: wrap`.
  - `app/styles/60-overrides.css:4537` (@media (max-width: 760px)): `align-items: stretch`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.281 `.criteria-form`

- **Archivo origen:** `app/styles/60-overrides.css:4357` (global).
- **Archivo(s) con variantes:** `app/styles/60-overrides.css:4541` (@media (max-width: 760px)).
- **Propiedades por aparición:**
  - `app/styles/60-overrides.css:4357` (global): `grid-template-columns: repeat(2, minmax(0, 1fr))`.
  - `app/styles/60-overrides.css:4541` (@media (max-width: 760px)): `grid-template-columns: 1fr`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.282 `.modal-box, .rrll-pro-modal-box, .dialog-box, .popup-box`

- **Archivo origen:** `app/styles/65-normalize.css:164` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:1053` (global).
- **Propiedades por aparición:**
  - `app/styles/65-normalize.css:164` (global): `font-size: var(--rrll-modal-font)`; `line-height: var(--rrll-line-normal)`; `border-radius: var(--rrll-radius-lg)`.
  - `app/styles/70-components-final.css:1053` (global): `width: min(920px, calc(100vw - 32px))`; `max-height: calc(100vh - 48px)`; `overflow: auto`; `background: var(--rrll-component-bg) !important`; `border: 1px solid var(--rrll-component-border) !important`; `border-radius: var(--rrll-radius-xl) !important`; `box-shadow: 0 22px 56px rgba(15, 23, 42, .30) !important`; `color: var(--rrll-component-text) !important`; `padding: var(--rrll-space-3xl) !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.283 `.modal-header h2, .modal-header h3, .modal-title`

- **Archivo origen:** `app/styles/65-normalize.css:173` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:1077` (global).
- **Propiedades por aparición:**
  - `app/styles/65-normalize.css:173` (global): `font-size: var(--rrll-font-lg)`; `line-height: var(--rrll-line-tight)`.
  - `app/styles/70-components-final.css:1077` (global): `margin: 0`; `font-size: var(--rrll-font-lg) !important`; `font-weight: 900 !important`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

### 3.284 `:where( .rrll-header-actions, .rrll-header-status, .phase4-header-actions, .phase4-header-status, .header-actions, .quick-actions )`

- **Archivo origen:** `app/styles/70-components-final.css:122` (global).
- **Archivo(s) con variantes:** `app/styles/70-components-final.css:133` (global).
- **Propiedades por aparición:**
  - `app/styles/70-components-final.css:122` (global): `font-size: var(--rrll-font-sm)`.
  - `app/styles/70-components-final.css:133` (global): `background: var(--rrll-theme-bg-panel)`; `border: 1px solid var(--rrll-border)`; `border-radius: var(--rrll-radius-md)`.
- **Motivo del riesgo:** no es un duplicado exacto; al menos una propiedad, un valor o el contexto difiere. La cascada puede ser intencional y una fusión automática podría alterar la interfaz.
- **Propuesta de consolidación:** revisar manualmente el historial y el resultado visual. Consolidar únicamente las propiedades comunes si se confirma que las diferencias deben conservarse como overrides explícitos.

