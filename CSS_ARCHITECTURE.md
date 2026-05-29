# Arquitectura CSS activa

Este documento describe la arquitectura CSS actualmente activa del dashboard y congela las reglas de trabajo para preparar limpiezas futuras sin cambios visuales accidentales.

## Punto de entrada principal

`app/styles.css` es el agregador principal de estilos de la aplicación.

`dashboard.html` carga directamente `app/styles.css`; desde ahí se resuelven las hojas CSS activas mediante reglas `@import`.

## Orden de carga

El orden de carga activo es el orden declarado en `app/styles.css` y no debe cambiarse todavía:

1. `app/styles/00-base.css`
2. `app/styles/01-variables.css`
3. `app/styles/10-layout.css`
4. `app/styles/20-components.css`
5. `app/styles/30-modules.css`
6. `app/styles/40-theme-dark.css`
7. `app/styles/41-theme-light.css`
8. `app/styles/50-module-extras.css`
9. `app/styles/60-overrides.css`
10. `app/styles/65-normalize.css`
11. `app/styles/70-components-final.css`
12. `app/styles/90-print.css`

## Fuente principal de tokens

`app/styles/01-variables.css` es la fuente principal de tokens CSS del proyecto.

Al añadir o migrar estilos, se deben reutilizar los tokens existentes siempre que haya un equivalente semántico o visual razonable.

No deben añadirse nuevos colores hardcodeados si ya existe un token equivalente.

## Capas congeladas o restringidas

`app/styles/60-overrides.css` queda congelado: no deben añadirse nuevos estilos ahí salvo emergencia justificada.

`app/styles/90-print.css` forma parte del grafo activo y no debe tocarse salvo pruebas específicas de impresión.

`app/styles/65-normalize.css` y `app/styles/70-components-final.css` forman parte de capas sensibles de compatibilidad/finalización y no deben usarse para nuevas migraciones ordinarias.

## Reglas para cambios futuros

- No cambiar el orden de imports todavía.
- No añadir nuevos `!important` salvo justificación explícita y localizada.
- No introducir nuevos colores hardcodeados cuando exista un token equivalente en `01-variables.css`.
- No hacer limpiezas masivas ni migraciones globales en una sola fase.
- Los cambios visuales se harán por fases pequeñas, verificables y reversibles.
- Las migraciones de aliases locales deben preservar la apariencia equivalente antes de sustituir usos internos o reglas de módulos.

## Nota sobre overrides

`app/styles/60-overrides.css` sigue activo porque lo importa `app/styles.css`.

No debe limpiarse, moverse ni eliminarse todavía: aunque su nombre sugiera una capa de overrides temporal, forma parte del grafo de CSS cargado por la aplicación y puede afectar el comportamiento visual actual.

## CSS residual movido a OLD

`app/styles/styles.css` no forma parte del grafo activo: no lo carga `dashboard.html`, no lo importa `app/styles.css` y sus imports internos no coinciden con la estructura real actual.

Por ese motivo se conserva sin borrado definitivo en:

`OLD/app/styles/styles.css`
