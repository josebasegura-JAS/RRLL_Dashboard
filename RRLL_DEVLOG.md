# RRLL Dashboard - Devlog

## Base estable
- Base utilizada: Fase 1 corregida de arranque.
- Estado: funcional según prueba de usuario.
- Se descartan las versiones de Fase 2 anteriores porque rompían dashboard/menú.

## Fase 2.1 - Preparación segura de refactor
- No se modifica ningún fichero de ejecución existente.
- No se toca `app.js`.
- No se toca `dashboard.html`.
- No se toca navegación, dashboard, SQLite, Electron, backups ni gestores.
- Se añade `app/modules/utils-candidate.js` como fichero candidato, sin cargarlo en el HTML.
- Objetivo: documentar y aislar posibles utilidades antes de mover código real.
- Riesgo funcional: nulo, porque el nuevo fichero no se ejecuta.

## Siguiente paso propuesto
- Fase 2.2: cargar `utils-candidate.js` sin usarlo, solo para verificar que el orden de scripts no rompe nada.
- Fase 2.3: mover una sola función y probar.

## Fase 2.2 - Primera carga controlada de utilidades

- Se carga `app/modules/utils-candidate.js` desde `app/dashboard.html`.
- Se extrae únicamente `normalizePriority(value)` desde `app.js`.
- El fichero se carga antes de `print-export.js`, `tareas.js` y `peticiones.js` para mantener compatibilidad.
- No se toca navegación, dashboard, estilos, Electron, SQLite, backups ni gestores.
- Riesgo previsto: bajo.

## Fase 2.3 - Utilidades puras agrupadas
- Base: Fase 2.2 validada por el usuario.
- Se mantiene `utils-candidate.js` cargado antes de `app.js`.
- Se extraen utilidades puras de prioridad y fechas: `priorityLabel`, `priorityBadgeHtml`, `formatDateValue`, `dueStatus`, `latestActivityDate`, `daysSince`.
- No se toca navegación, dashboard, CSS, SQLite, Electron ni módulos de gestores.
- Riesgo previsto: bajo-medio, porque las funciones se mantienen como globales `window.*`.

## Fase 2.4 - Utilidades auxiliares sin DOM
- Base: Fase 2.3 validada por el usuario.
- Se extraen a `app/modules/utils-candidate.js` utilidades auxiliares sin renderizado: `normalizeUrl`, `openExternalUrl`, `itemSearchText`, `serializeBackupValue`, `parseBackupValue`, `isRRLLKey`, `isDeprecatedFixedTaskKey`, `formatSyncDate`, `formatTrashDate`.
- Las funciones siguen expuestas como globales `window.*` para mantener compatibilidad con `app.js` y botones inline.
- No se toca navegación, dashboard, CSS, SQLite, Electron, backups ni módulos de gestores.
- Riesgo previsto: bajo-medio.


## Fase 2.5 - Accesos rápidos y papelera
- Extraído el bloque de accesos rápidos/configuración de enlaces a `app/modules/links-config.js`.
- Extraído el bloque de papelera a `app/modules/trash.js`.
- Las funciones siguen expuestas globalmente para mantener compatibilidad con botones inline y módulos existentes.
- Sin cambios en navegación, dashboard, gestores, estilos, SQLite, `main.js` ni `preload.js`.
- Riesgo estimado: medio controlado.


## Fase 2.6 - Búsqueda y backup/importación
- Extraídos a `app/modules/search.js` los bloques de búsqueda global y búsqueda por módulo.
- Extraídos a `app/modules/backup-import.js` los bloques de exportación, importación y previsualización de copias.
- Se mantienen funciones globales para compatibilidad con botones inline y módulos existentes.
- No se toca navegación, dashboard, SQLite, estilos ni gestores.
- Riesgo: medio-alto, acotado a búsqueda y copias.


## Fase 2.6.1 - Fix de arranque tras extracción backup/importación
- Exportadas explícitamente `purgeDeprecatedFixedTaskData()` y `renderAfterImport()` desde `app/modules/backup-import.js`.
- Motivo: `app.js` las llama durante el arranque y la sincronización. Al quedar dentro del módulo, el render inicial se detenía antes de pintar dashboard y gestores.
- Sin cambios en datos, menú, dashboard visual, SQLite ni gestores.


## Fase 2.7 - Sincronización y configuración de base de datos
- Extraído el bloque de sincronización/configuración SQLite a `app/modules/database-sync.js`.
- `app.js` mantiene las llamadas originales, pero ya no contiene esas funciones.
- Se conservan las funciones globales para compatibilidad con HTML y arranque.
- No se ha tocado navegación, dashboard, gestores, estilos, `main.js`, `preload.js` ni estructura de datos.
- Riesgo: medio-alto controlado.

## Fase 2.8 - Navegación aislada
- Extraída la navegación principal a `app/modules/navigation.js`.
- Movidas funciones de menú lateral, submenús Comité/Paritaria, cambio de vistas y rutas por hash.
- Movida `openPhase4DashboardTarget()` junto con la navegación.
- Se mantienen funciones globales `window.*` para compatibilidad.
- No se toca dashboard, CSS, SQLite, Electron ni gestores.


## Fase 2.9 - Dashboard inicial
- Extraído el bloque del dashboard inicial a `app/modules/home-dashboard.js`.
- Mantenidas las funciones globales para compatibilidad con navegación, render general y botones inline.
- Sin cambios en CSS, SQLite, gestores ni arranque principal.
- Riesgo: medio-alto, mitigado manteniendo orden de carga y nombres globales.

## Fase 2.10 - Cierre de refactor de arranque
- Se crea `app/modules/bootstrap.js`.
- Se mueve el arranque central desde `app.js`: `renderAllDataViews()`, `waitForDatabaseBridge()`, `initializeApp()`, evento global de `Escape` y exposición final de funciones globales.
- `app.js` queda como coordinador más ligero, conservando funciones de alertas, configuración y sincronización de actas de Comité.
- No se modifican gestores, navegación, dashboard, estilos, SQLite, `main.js` ni `preload.js`.
- Riesgo: medio. Zona sensible por orden de carga, mitigado manteniendo `bootstrap.js` después de `app.js`.

## Fase 3.1 - Distribución operativa de tareas y peticiones
- Reorganizadas las columnas de Tareas y Peticiones.
- Pendientes queda a la izquierda con 1/3 del espacio disponible.
- En curso queda a la derecha con 2/3 del espacio disponible.
- Cerradas pasa a un bloque inferior plegado por defecto.
- No se modifican datos, SQLite, navegación, dashboard ni arranque.

## Fase 4.1 - Base visual oscura homogénea
- Aplicada una capa visual global en tonos oscuros.
- Homogeneizados fondos, tarjetas, formularios, inputs, columnas, modales, búsqueda, papelera y estados.
- Se mantienen los datos, la navegación, SQLite, Electron y los gestores sin cambios de lógica.
- La previsualización de impresión se conserva en blanco para no afectar a documentos impresos.

## Fase 4.2 - Gestor de tareas profesional
- Rehecha la vista de Gestión de tareas como módulo profesional oscuro.
- Sustituidas las columnas visuales por un listado compacto tipo tabla.
- Añadidos filtros internos: Todas, Pendientes, En curso y Cerradas.
- Añadido buscador interno directo en el gestor.
- Mantenida la lógica existente de alta, edición, cambio de estado, cierre, papelera, impresión y exportación.
- Sin cambios en SQLite, Electron, navegación, dashboard ni estructura de datos.

## Fase 4.3 - Peticiones profesionales y dashboard refinado
- Convertido el gestor de peticiones al mismo patrón profesional usado en tareas: formulario compacto, filtros, buscador interno y tabla oscura.
- Añadido filtro de peticiones por estado: Todas, Pendientes, En curso y Cerradas.
- Reducido el peso visual del dashboard: alertas más compactas, menos rojo y rojo reservado para vencimientos.
- Afinada la carga por gestor para evitar barras rojas sobredimensionadas.
- Sin cambios en SQLite, Electron, navegación, arranque ni estructura de datos.

## Fase 4.4 - Actas, teletrabajo y dashboard fino
- Gestor de actas adaptado al patrón profesional de tabla oscura con pestañas, buscador y acciones por fila.
- Gestor de teletrabajo adaptado al mismo patrón profesional con filtros por estado y validaciones integradas.
- Dashboard ajustado para reducir el uso de rojo: rojo reservado a alertas vencidas, filas más compactas y carga por gestor menos agresiva.
- Sin cambios en SQLite, Electron, navegación, estructura de datos ni backend.

## Fase 4.5 - Comité y Paritaria profesional
- Comité: gestor de puntos transformado a formato profesional tipo tabla con filtros, buscador y acciones por fila.
- Paritaria: mismo patrón visual y funcional que Comité.
- Sesiones de Comité y Paritaria: homogeneizadas visualmente en oscuro, con paneles compactos y tarjetas más sobrias.
- Sin cambios en SQLite, Electron, navegación, backup ni estructura de datos.

## Fase 4.6 - Corrección visual de modales e impresión
- Oscurecidas superficies heredadas en modales de actualización.
- Corregidos bloques blancos en “actualizaciones existentes” y zona inferior de acciones.
- Ajustada la vista previa de impresión: ventana oscura y documento imprimible en blanco.
- Sin cambios en datos, SQLite, navegación ni lógica de gestores.


## Fase 4.7 - Fix sesiones Comité/Paritaria
- Corregidas superficies blancas heredadas en sesiones de Comité y Paritaria.
- Oscurecidos formulario de sesión, botón de importar histórico, columnas abiertas/histórico y tarjetas de sesión.
- Sin cambios de lógica ni de datos.

## Fase 5.0 — Rebalanceo visual gris-carbón e icono profesional
- Sustituida la sensación de negro puro por una paleta gris-carbón / azul grisáceo.
- Homogeneizados fondos, superficies, tarjetas, tablas, formularios, modales, popups y scrollbars.
- Suavizado el uso del rojo para reservarlo a acciones principales, vencidos y estados críticos.
- Mantenido el documento imprimible en blanco para salida en papel, dejando la ventana de impresión en tema oscuro.
- Sustituido el icono de la app por un icono profesional RRLL en `app/assets/icon.png` y `app/assets/icon.ico`.
- Sin cambios en JS, SQLite, navegación, datos ni lógica funcional.

## Fase 5.1 — Dashboard profesional refinado
- Rediseñado el dashboard inicial para acercarlo al mockup gris-carbón.
- Alertas convertidas en lista compacta: rojo solo para vencidos o críticos, sin bloques grandes.
- Actividad reciente y vencimientos afinados con filas más limpias, fechas laterales y menor ruido visual.
- Resumen por estado más compacto, con donut y leyenda menos agresivos.
- Carga por gestor con barras discretas por color y sin fondos rojos sobredimensionados.
- Sin cambios en SQLite, Electron, navegación, estructura de datos ni gestores.


## Fase 5.2 - Revisión global gris-carbón
- Corregidos restos de negro puro en interiores de gestores.
- Corregidos restos blancos en modales, cajas de actualizaciones y superficies heredadas.
- Previsualización de impresión integrada en tema gris-carbón, manteniendo impresión real en blanco.
- Sin cambios en SQLite, datos, navegación ni Electron.

## Fase 5.3 — Paleta gris-carbón homogénea
- Se aplica de forma global la paleta gris-carbón definida para evitar fondos negros puros o casi negros.
- Se sustituyen superficies de módulos, formularios, cabeceras, tablas, modales, popups, sidebar y previsualización de impresión por tonos gris pizarra coherentes.
- Se mantiene el rojo únicamente para estados críticos, vencidos o acciones destructivas.
- Se añade una salvaguarda CSS para neutralizar fondos blancos/negros heredados en pantalla.
- La impresión física conserva fondo blanco para papel mediante reglas `@media print`.
- Sin cambios en JS, SQLite, navegación, Electron ni estructura de datos.

## Fase 5.4 - Tipografía y densidad visual profesional
- Normalizada la escala tipográfica global con tamaños más contenidos.
- Reducidos tamaños en dashboard, gestores, tablas, botones, badges, modales y formularios.
- Compactada la densidad visual sin tocar datos, navegación, SQLite ni lógica de negocio.
- Ajustada la previsualización de impresión y la salida a papel con escala más controlada.
- Objetivo: aspecto más profesional, menos scroll y mayor cantidad de información visible.

## Fase 5.5 — Dashboard útil y sincronización integrada

- Eliminado el bloque de “Resumen por estado” del dashboard.
- Eliminado el bloque de “Carga por gestor”.
- Añadidos mini gráficos circulares en las tarjetas superiores de Tareas, Peticiones, Actas, Teletrabajo, Comité y Paritaria.
- Rediseñados “Próximos vencimientos” con lista compacta y calendario mensual lateral.
- El calendario marca vencimientos, comités y paritarias con colores diferenciados.
- Compactadas alertas para usar rojo solo en vencidos/críticos y evitar bloques rojos grandes.
- Movido el indicador de sincronización a la parte baja de la barra lateral.
- Eliminado el texto “Versión 1.0” del pie de la barra lateral.
- El indicador de sincronización usa punto de estado: verde sincronizado, ámbar guardando/sincronizando, rojo error y gris sin conexión.
- Sin cambios en SQLite, Electron, navegación ni estructura de datos.

## Fase 5.6 - Impresión/exportación por filtro activo

- Reubicados los botones de imprimir y Excel de Tareas, Peticiones y Actas junto a sus listados.
- La impresión de Tareas, Peticiones y Actas usa ahora el filtro activo y la búsqueda interna del listado.
- La exportación Excel de Tareas, Peticiones y Actas usa ahora el filtro activo y la búsqueda interna del listado.
- Se mantiene la búsqueda de gestor en la cabecera del módulo.
- Sin cambios en SQLite, Electron, navegación ni estructura de datos.

## Fase 5.7 — Calendario interactivo y marcador Paritaria

- Corregido el marcador de Paritaria del calendario, que heredaba estilos globales de tarjetas y aparecía demasiado grande.
- Añadido popup al pulsar un día del calendario con asuntos marcados.
- El popup muestra vencimientos, comités y paritarias del día seleccionado.
- Cada asunto del popup permite abrir su gestor correspondiente.
- Sin cambios en SQLite, Electron, navegación ni estructura de datos.

## Fase 5.8 - Nuevo módulo Vinculograma
- Añadido módulo "Vinculograma" en el menú lateral.
- Formulario con Nº empleado, nombre y fecha de solicitud.
- Fecha de vigencia calculada automáticamente a fecha de solicitud + 3 años, no editable.
- Separación automática entre vinculogramas vigentes y vencidos.
- Listados ordenados por número de empleado.
- Impresión y exportación a Excel independientes para vigentes y vencidos.
- Integrado en navegación, búsqueda, backup/importación y papelera.

## Fase 5.9 - Módulo Licencias sin sueldo y Excedencias
- Añadido nuevo módulo de menú: Licencias y excedencias.
- Campos: Nº empleado, nombre, fecha solicitud, tipo solicitud, fecha inicio permiso y fecha fin permiso.
- Flujo añadido: Pendiente de aprobar → Pendiente de firma → Licencias vigentes → Histórico anual.
- Doble clic en solicitudes para añadir actualizaciones y cambiar de fase.
- Histórico calculado automáticamente cuando la fecha fin de permiso ya ha pasado.
- Integrado en búsqueda, backup/importación y papelera.
- Añadida impresión y exportación Excel por columna/estado.

## Fase 5.28 - Teletrabajo conectado con Plantilla
- Añadida búsqueda de personas de Plantilla en el formulario de Teletrabajo.
- Al introducir Nº empleado se rellena automáticamente Nombre y Apellidos si existe coincidencia exacta.
- Al escribir en Nombre y Apellidos se muestran sugerencias desde Plantilla; al seleccionar una persona se cargan nombre y nº empleado.
- Si el paquete base no incluía Plantilla, se incorpora el módulo Plantilla y su integración en menú, búsqueda, backup/importación y papelera.
- No se modifica SQLite, Electron ni estructura de datos existente.

## Fase 5.29 — Búsqueda de Plantilla en Licencias/Vinculograma
- Añadido autocompletado desde Plantilla en Licencias y excedencias.
- Añadido autocompletado desde Plantilla en Vinculograma.
- Al introducir Nº empleado se rellena automáticamente el nombre si existe en Plantilla.
- Al escribir nombre se muestran sugerencias de Plantilla y al seleccionar se carga también el nº empleado.
- Añadido campo Persona vinculada en Vinculograma, incluido en tabla, impresión, Excel y búsqueda.
- Sin cambios en SQLite/Electron; se mantiene la persistencia por claves existente.


## Fase 5.30 - Ordenación por columnas en Peticiones
- Corregida la vista de Peticiones para ordenar pulsando sobre las cabeceras de columna.
- Cada pulsación alterna entre ascendente y descendente.
- El filtro “Todas” excluye peticiones cerradas; estas solo se ven en “Cerradas”.
- Imprimir y Excel respetan la vista ordenada y filtrada.
- Sin cambios en SQLite, Electron ni estructura de datos.

## Fase 5.33 - Reglas específicas en Licencias y excedencias
- Añadido tipo de solicitud “Año de Libre Disposición”.
- En Año de Libre Disposición, la fecha fin se calcula automáticamente como fecha inicio + 5 años y queda como campo de solo lectura.
- En Licencia sin sueldo, se valida que la duración sea de al menos 15 días y no supere 9 meses.
- La validación se aplica tanto al alta como a la edición desde modal.
- Sin cambios en SQLite ni Electron.

## Fase 5.34 - Vinculograma editable y vencidos plegados
- Doble clic sobre una persona en Vinculograma abre edición de todos los campos.
- El modal permite guardar cambios o eliminar el vinculograma.
- La fecha de vigencia se recalcula automáticamente al modificar la fecha de solicitud.
- La columna de vencidos queda plegada por defecto y se muestra/oculta con clic.

## Fase 5.37 - Formularios desplegables homogéneos

- Actas: el formulario de nueva acta queda oculto al entrar y se abre con “Nueva acta”.
- Teletrabajo: el formulario de nueva solicitud queda oculto al entrar y se abre con “Nueva solicitud”.
- Vinculograma: el formulario queda oculto al entrar y se abre con “Nuevo vinculograma”.
- Licencias y excedencias: el formulario queda oculto al entrar y se abre con “Nueva solicitud”.
- Puntos de Comité y Puntos de Paritaria: el formulario queda oculto y se abre con “Nuevo punto”.
- Sesiones de Comité y Sesiones de Paritaria: el formulario de alta queda oculto y se abre con “Nueva sesión”.
- Añadidos botones de cancelar en los formularios desplegables para cerrar sin guardar.
- Sin cambios en SQLite, Electron ni estructura de datos.

## Versión estable v1.8.0-estable-bbdd-especiales — 2026-05-29

- Se marca esta versión como estable antes de iniciar la revisión y limpieza CSS.
- Módulo Especiales operativo.
- Generación Outlook disponible.
- Importación de archivos `.msg` disponible.
- Backups optimizados.
- Escritura atómica activa.
- Espejo local disponible.
- Estado BBDD dinámico.
- No se modifica lógica funcional en este punto de estabilidad.
- Siguiente restricción operativa: no tocar lógica funcional hasta terminar la revisión CSS.
