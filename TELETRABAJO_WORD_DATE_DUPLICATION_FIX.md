# Corrección generador Word Teletrabajo

## Problema
La sustitución de marcadores del acuerdo Word podía aplicar dos reemplazos sobre el mismo texto cuando la plantilla contenía marcadores entre comillas angulares, por ejemplo `«M_1ºdata»`, y el motor también buscaba la variante heredada sin comillas, `M_1ºdata`.

Además, el marcador genérico sin comillas `fecha` era demasiado amplio y podía sustituir palabras normales del documento, no solo el marcador `«fecha»`.

## Corrección aplicada
- Se filtran ocurrencias solapadas antes de reemplazar, priorizando el marcador más largo/específico.
- Se elimina la sustitución genérica de `fecha`; se conserva únicamente `«fecha»`.
- Se mantienen las variantes heredadas específicas `M_1ºdata`, `M_2ºdata`, `D/M/A` y `U/H/E`.

## Validación
Se generó un acuerdo de prueba con la plantilla aportada y se comprobó que:
- `«M_1ºdata»` se sustituye una sola vez.
- `«M_2ºdata»` se sustituye una sola vez.
- `«fecha»` se sustituye una sola vez.
- Las palabras normales `fecha` del documento no se sustituyen indebidamente.
- La sintaxis de `main/telework-agreement-docx.js` pasa `node --check`.
