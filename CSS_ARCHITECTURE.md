# Arquitectura CSS activa

Este documento describe la arquitectura CSS actualmente activa del dashboard. Es solo una referencia operativa para evitar limpiezas accidentales de hojas de estilo todavía cargadas.

## Punto de entrada principal

`app/styles.css` es el agregador principal de estilos de la aplicación.

`dashboard.html` carga directamente `app/styles.css`; desde ahí se resuelven las hojas CSS activas mediante reglas `@import`.

## Orden de carga

El orden de carga activo es el orden declarado en `app/styles.css`:

1. `app/styles/00-base.css`
2. `app/styles/01-variables.css`
3. `app/styles/10-layout.css`
4. `app/styles/20-components.css`
5. `app/styles/30-modules.css`
6. `app/styles/40-theme.css`
7. `app/styles/50-module-extras.css`
8. `app/styles/60-overrides.css`
9. `app/styles/65-normalize.css`
10. `app/styles/70-components-final.css`
11. `app/styles/80-light-foundation.css`

## Nota sobre overrides

`app/styles/60-overrides.css` sigue activo porque lo importa `app/styles.css`.

No debe limpiarse, moverse ni eliminarse todavía: aunque su nombre sugiera una capa de overrides temporal, forma parte del grafo de CSS cargado por la aplicación y puede afectar el comportamiento visual actual.

## CSS residual movido a OLD

`app/styles/styles.css` no forma parte del grafo activo: no lo carga `dashboard.html`, no lo importa `app/styles.css` y sus imports internos no coinciden con la estructura real actual.

Por ese motivo se conserva sin borrado definitivo en:

`OLD/app/styles/styles.css`
