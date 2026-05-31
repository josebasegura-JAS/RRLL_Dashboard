# Auditoría CSS conservadora

## 1. Propósito y límites de este documento

Esta auditoría crea una línea base documental del CSS activo de RRLL Dashboard antes de iniciar cualquier limpieza. No modifica reglas, variables, selectores, imports, nombres de archivo ni orden de carga.

El criterio de esta primera fase es deliberadamente conservador: una regla repetida, un `!important`, un selector legacy o una capa con nombre de override **no se consideran eliminables** hasta demostrar su redundancia mediante una revisión acotada y una validación visual específica.

## 2. Punto de entrada y grafo activo

`app/dashboard.html` carga `app/styles.css` mediante `<link rel="stylesheet" href="styles.css" />`. `app/styles.css` actúa como agregador y resuelve doce hojas activas mediante `@import`.

El orden de carga actual forma parte del comportamiento visual y queda congelado durante la auditoría:

| Orden | Hoja activa | Líneas | `!important` | Observación conservadora |
| ---: | --- | ---: | ---: | --- |
| 1 | `app/styles/00-base.css` | 2.019 | 60 | Base heredada segura; puede participar en la cascada de todas las capas posteriores. |
| 2 | `app/styles/01-variables.css` | 403 | 0 | Fuente principal de tokens y aliases; no cambiar variables en una limpieza inicial. |
| 3 | `app/styles/10-layout.css` | 1.840 | 297 | Layout, navegación, sidebar y vistas; alto riesgo de regresión estructural. |
| 4 | `app/styles/20-components.css` | 640 | 176 | Componentes compartidos; cualquier cambio exige comprobar múltiples módulos. |
| 5 | `app/styles/30-modules.css` | 2.252 | 573 | Estilos profesionales por módulo; revisar únicamente por módulo y flujo. |
| 6 | `app/styles/40-theme-dark.css` | 1.469 | 439 | Tema oscuro activo; validar por separado frente al tema claro. |
| 7 | `app/styles/41-theme-light.css` | 2.222 | 799 | Tema claro activo; contiene normalizaciones y correcciones específicas. |
| 8 | `app/styles/50-module-extras.css` | 2.685 | 885 | Extensiones y homogeneización de gestores; no asumir que son opcionales. |
| 9 | `app/styles/60-overrides.css` | 4.955 | 1.434 | Capa activa de overrides; congelada hasta disponer de evidencia de equivalencia visual. |
| 10 | `app/styles/65-normalize.css` | 213 | 3 | Normalización activa; tratar como capa sensible de compatibilidad. |
| 11 | `app/styles/70-components-final.css` | 4.241 | 458 | Ajustes finales activos; tratar como capa sensible de finalización. |
| 12 | `app/styles/90-print.css` | 14 | 4 | Excepción de impresión física; no tocar sin pruebas específicas de impresión. |
|  | **Total hojas importadas** | **22.953** | **5.128** | El total no incluye las 18 líneas del agregador `app/styles.css`. |

### Orden exacto congelado

```css
@import url("./styles/00-base.css");
@import url("./styles/01-variables.css");
@import url("./styles/10-layout.css");
@import url("./styles/20-components.css");
@import url("./styles/30-modules.css");
@import url("./styles/40-theme-dark.css");
@import url("./styles/41-theme-light.css");
@import url("./styles/50-module-extras.css");
@import url("./styles/60-overrides.css");
@import url("./styles/65-normalize.css");
@import url("./styles/70-components-final.css");
@import url("./styles/90-print.css");
```

## 3. Superficies CSS activas fuera del grafo de imports

Además del agregador y sus doce imports, existen superficies activas que una limpieza posterior debe inventariar antes de editar:

1. `app/dashboard.html` contiene un bloque `<style>` inline cargado después de `app/styles.css`. Por su posición puede prevalecer sobre reglas importadas con especificidad equivalente. Incluye ajustes de navegación, tabla de sorteos y tarjetas del gestor de especiales.
2. `app/modules/print-export.js` genera CSS inline dentro de documentos HTML de impresión. No pertenece al grafo de imports del dashboard, pero sí afecta a salidas impresas/exportadas.
3. `app/styles/90-print.css` contiene una regla `@media print` activa para evitar documentos en blanco al imprimir.

Estas superficies se registran únicamente como dependencias: este documento no propone moverlas ni consolidarlas todavía.

## 4. Lectura conservadora del estado actual

### 4.1. La cascada es parte de la funcionalidad visual

Las capas posteriores pueden corregir o normalizar capas anteriores. En particular, `60-overrides.css`, `65-normalize.css` y `70-components-final.css` están activas y se cargan al final del flujo general. Aunque sus nombres sugieran oportunidades de consolidación, no son residuos demostrados.

### 4.2. Los `!important` son deuda a medir, no a retirar de forma masiva

La línea base contiene 5.128 apariciones de `!important` en las hojas importadas. La concentración principal está en:

- `app/styles/60-overrides.css`: 1.434.
- `app/styles/50-module-extras.css`: 885.
- `app/styles/41-theme-light.css`: 799.
- `app/styles/30-modules.css`: 573.
- `app/styles/70-components-final.css`: 458.
- `app/styles/40-theme-dark.css`: 439.

No debe reducirse este número por búsqueda y reemplazo. Cada retirada futura requiere identificar la regla compensada, comparar especificidad y orden de carga, y validar visualmente ambos temas y el módulo afectado.

### 4.3. Los tokens requieren trazabilidad

`app/styles/01-variables.css` es la fuente principal de tokens del proyecto, pero la base heredada y las capas temáticas también participan en la resolución de variables. No se deben renombrar, fusionar o sustituir aliases hasta localizar consumidores y verificar equivalencia semántica y visual.

### 4.4. Los temas deben revisarse por separado

El modo oscuro y el modo claro tienen hojas activas independientes (`40-theme-dark.css` y `41-theme-light.css`) y también pueden depender de variables o reglas previas. Una corrección aparentemente neutra puede romper un único tema; toda fase posterior debe incluir comprobaciones en ambos modos.

### 4.5. Impresión es una ruta independiente

La impresión física combina `app/styles/90-print.css` con salidas HTML generadas desde JavaScript. No debe incluirse en refactors generales sin una prueba de previsualización e impresión/exportación dedicada.

## 5. Riesgos principales antes de limpiar

| Riesgo | Motivo | Política inicial |
| --- | --- | --- |
| Cambiar el orden de imports | Puede alterar qué declaración gana en cascada. | Mantener el orden exacto. |
| Eliminar reglas aparentemente duplicadas | Pueden diferir en contexto, especificidad, tema o precedencia. | Exigir evidencia por selector y captura comparativa. |
| Reducir `!important` en bloque | Puede reactivar estilos heredados o romper capas finales. | Hacerlo solo en cambios mínimos y trazables. |
| Consolidar temas demasiado pronto | Puede introducir regresiones exclusivas de modo claro u oscuro. | Auditar y validar los temas por separado. |
| Mover CSS inline a hojas externas | Cambia la posición efectiva dentro de la cascada. | Inventariar primero; no mover en la fase documental. |
| Tocar impresión durante una limpieza general | La salida impresa tiene reglas y generación HTML propias. | Separar cualquier trabajo de impresión. |
| Usar `60-overrides.css` para estilos nuevos | Aumenta la dependencia de la capa correctiva. | Mantener esta capa congelada salvo emergencia justificada. |

## 6. Plan de limpieza propuesto por fases

Cada fase futura debe limitar su alcance, preservar la apariencia y producir evidencia verificable antes de continuar.

### Fase 0 — Línea base documental

- Mantener este inventario como referencia.
- No modificar CSS, HTML, JavaScript, imports ni variables.
- Registrar cualquier excepción encontrada antes de plantear una migración.

### Fase 1 — Inventario estático sin cambios visuales

- Construir un inventario de selectores por hoja y detectar candidatos repetidos.
- Clasificar candidatos por módulo, tema, impresión, responsive y compatibilidad.
- Buscar referencias desde HTML y JavaScript antes de etiquetar una clase como legacy.
- Tratar el resultado como lista de candidatos, nunca como autorización automática de borrado.

### Fase 2 — Validación visual de línea base

- Capturar pantallas representativas en modo oscuro y claro.
- Cubrir dashboard, navegación, formularios, tablas, modales, módulos principales y estados desplegados.
- Separar la comprobación responsive y la prueba de impresión.

### Fase 3 — Limpiezas mínimas por módulo

- Elegir un solo módulo o componente por cambio.
- Retirar o consolidar únicamente reglas con equivalencia demostrada.
- No mezclar reducción de `!important`, migración de tokens y reorganización de archivos en el mismo cambio.
- Mantener commits pequeños y reversibles.

### Fase 4 — Revisión controlada de capas finales

- Revisar `50-module-extras.css`, `60-overrides.css`, `65-normalize.css` y `70-components-final.css` solo después de estabilizar módulos concretos.
- Migrar reglas únicamente hacia capas semánticas ya existentes y con comparación visual antes/después.
- Considerar cambios de orden de carga como una tarea independiente de alto riesgo.

## 7. Checklist obligatorio para futuros PR de CSS

- [ ] El cambio tiene un único alcance visual claramente descrito.
- [ ] El orden de imports permanece intacto, salvo PR específico y justificado.
- [ ] No se añaden `!important` sin justificación localizada.
- [ ] Cada `!important` retirado se valida contra la cascada completa.
- [ ] Se revisan referencias de clases en HTML y JavaScript antes de eliminar selectores.
- [ ] Se comprueban modo oscuro y modo claro.
- [ ] Se comprueban dashboard, navegación y módulo afectado.
- [ ] Se valida responsive si el cambio afecta layout, tablas o formularios.
- [ ] Se valida impresión si se toca `90-print.css` o generación HTML de impresión.
- [ ] Se adjuntan capturas comparativas cuando exista cualquier cambio perceptible.

## 8. Conclusión

La base actual funciona como una cascada acumulativa con capas heredadas, temas, extensiones, overrides y normalizaciones finales. El primer paso seguro no es borrar ni mover reglas: es conservar el grafo activo, medir la deuda existente y abordar cualquier limpieza posterior mediante cambios pequeños, reversibles y validados visualmente.
