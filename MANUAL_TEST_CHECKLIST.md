# Checklist manual de regresión visual y funcional

Utilizar esta checklist **antes y después de cada PR de limpieza CSS o de cualquier cambio visual**. El objetivo es comparar el comportamiento y la presentación de la aplicación en ambos estados para detectar regresiones.

## Preparación de la prueba

- [ ] Registrar la rama, el commit y el entorno utilizados en la validación.
- [ ] Probar con datos representativos: registros cortos y largos, tablas con varias filas y casos con acciones disponibles.
- [ ] Ejecutar la revisión en tema claro y en tema oscuro.
- [ ] Anotar cualquier diferencia visual o funcional observada antes y después del cambio.

## 1. Arranque

- [ ] Iniciar la aplicación normalmente y confirmar que se muestra la pantalla inicial esperada.
- [ ] Iniciar la aplicación sin acceso a la base de datos compartida y confirmar que el fallo se gestiona sin bloquear la interfaz.
- [ ] Verificar que aparece el modal de fallback de red cuando no hay acceso a la base de datos compartida.
- [ ] Pulsar **Continuar en local** y comprobar que la aplicación carga y permite navegar.
- [ ] Pulsar **Reintentar** y comprobar que se vuelve a intentar la conexión sin duplicar modales ni dejar la interfaz bloqueada.
- [ ] Pulsar **Ir a configuración** y comprobar que se abre la sección correspondiente.
- [ ] Revisar que los textos, botones y acciones del modal de fallback sean visibles en tema claro y oscuro.

## 2. Navegación general

- [ ] Abrir el dashboard y comprobar que sus bloques, tarjetas y accesos son visibles y utilizables.
- [ ] Revisar la sidebar: anchura, iconos, etiquetas, estados activos y ausencia de solapamientos.
- [ ] Revisar el header: título, controles, alineación y ausencia de desbordamientos.
- [ ] Cambiar entre módulos y confirmar que el contenido activo se actualiza correctamente.
- [ ] Volver a inicio desde distintos módulos y confirmar que se muestra el dashboard.
- [ ] Abrir y cerrar los grupos desplegables de navegación.
- [ ] Confirmar que los elementos de los grupos desplegables se pueden seleccionar y que el estado visual activo es correcto.

## 3. Tema claro / oscuro

Realizar estas comprobaciones en ambos temas y alternar entre ellos desde distintas pantallas.

- [ ] Confirmar que todos los textos son legibles, incluidos textos secundarios, placeholders y mensajes de ayuda.
- [ ] Confirmar que los fondos de página, paneles y secciones son correctos y no dejan zonas con colores incoherentes.
- [ ] Revisar botones primarios, secundarios, de peligro, deshabilitados y botones con iconos.
- [ ] Revisar tarjetas: fondo, borde, sombra, espaciado y contraste.
- [ ] Revisar tablas: cabeceras, filas, bordes, hover y estados seleccionados.
- [ ] Revisar modales: backdrop, superficie, cabecera, contenido, pie y controles de cierre.
- [ ] Confirmar que el cambio de tema no rompe la pantalla activa ni obliga a recargar la aplicación.

## 4. Tareas

- [ ] Dar de alta una tarea y confirmar que el formulario y el registro resultante se muestran correctamente.
- [ ] Editar una tarea existente y guardar los cambios.
- [ ] Abrir la edición mediante doble clic cuando aplique.
- [ ] Probar las acciones disponibles de cada fila o tarjeta.
- [ ] Actualizar o refrescar la vista y confirmar que los datos siguen siendo coherentes.
- [ ] Probar filtros y búsqueda, incluidos casos sin resultados.
- [ ] Confirmar que textos largos, estados y acciones no se solapan.

## 5. Peticiones

- [ ] Dar de alta una petición y confirmar que el formulario y el registro resultante se muestran correctamente.
- [ ] Editar una petición existente y guardar los cambios.
- [ ] Abrir la edición mediante doble clic cuando aplique.
- [ ] Probar las acciones disponibles de cada fila o tarjeta.
- [ ] Actualizar o refrescar la vista y confirmar que los datos siguen siendo coherentes.
- [ ] Probar filtros y búsqueda, incluidos casos sin resultados.
- [ ] Confirmar que textos largos, estados y acciones no se solapan.

## 6. Especiales

- [ ] Entrar en el módulo y confirmar que la vista inicial carga correctamente.
- [ ] Revisar la drop zone de archivos MSG: visibilidad, borde, texto de ayuda y estados de arrastre.
- [ ] Cargar un MSG de prueba y comprobar el preview.
- [ ] Revisar la presentación de destinatarios, incluidos listados largos.
- [ ] Revisar los warnings y confirmar que son legibles y visualmente distinguibles.
- [ ] Revisar la tabla: cabeceras, filas, scroll y estados vacíos.
- [ ] Probar las acciones disponibles y confirmar que no se activan acciones distintas por propagación accidental de eventos.

## 7. Comité

- [ ] Revisar el listado y la gestión de puntos.
- [ ] Revisar el listado y la gestión de sesiones.
- [ ] Abrir los modales disponibles y validar formularios, botones y cierre.
- [ ] Revisar el orden del día y su presentación.
- [ ] Probar la acción de doble clic cuando aplique.
- [ ] Revisar tablas, cabeceras, filas y scroll.
- [ ] Probar las acciones disponibles y confirmar que actúan sobre el registro correcto.

## 8. Paritaria

- [ ] Revisar el listado y la gestión de puntos.
- [ ] Revisar el listado y la gestión de sesiones.
- [ ] Abrir los modales disponibles y validar formularios, botones y cierre.
- [ ] Revisar el orden del día y su presentación.
- [ ] Probar la acción de doble clic cuando aplique.
- [ ] Revisar tablas, cabeceras, filas y scroll.
- [ ] Probar las acciones disponibles y confirmar que actúan sobre el registro correcto.

## 9. Actas

- [ ] Revisar la tabla de actas: columnas, filas, scroll y estado vacío.
- [ ] Editar un acta y guardar los cambios.
- [ ] Revisar los estados disponibles y su representación visual.
- [ ] Revisar la gestión y presentación de alegaciones.
- [ ] Abrir los modales disponibles y validar formularios, botones y cierre.
- [ ] Confirmar que las acciones actúan sobre el acta seleccionada.

## 10. Teletrabajo

- [ ] Revisar el listado de solicitudes.
- [ ] Editar una solicitud y guardar los cambios.
- [ ] Revisar el histórico y comprobar que es legible con varias entradas.
- [ ] Probar la importación con un archivo de prueba válido y revisar los mensajes mostrados.
- [ ] Revisar el catálogo de puestos: tabla, filtros y acciones disponibles.
- [ ] Abrir los modales disponibles y validar formularios, botones y cierre.

## 11. Otros módulos

Entrar en cada módulo, revisar su vista principal, probar sus controles visibles y confirmar que no hay solapamientos, desbordamientos ni regresiones de navegación.

- [ ] Plantilla.
- [ ] Licencias.
- [ ] Vinculograma.
- [ ] Ticket restaurante.
- [ ] Criterios RRLL.
- [ ] Sorteos.
- [ ] Papelera.
- [ ] Configuración.
- [ ] Búsqueda global: abrirla, buscar registros existentes y no existentes, y navegar desde un resultado cuando aplique.

## 12. Modales transversales

Repetir estas comprobaciones con varios modales de distintos módulos.

- [ ] Abrir el modal y confirmar que se muestra centrado y por encima del contenido.
- [ ] Cerrar el modal mediante su botón de cierre.
- [ ] Cerrar el modal pulsando el backdrop cuando esa interacción aplique.
- [ ] Confirmar que el scroll interno permite acceder a todo el contenido en modales largos.
- [ ] Confirmar que los botones del pie permanecen visibles o accesibles.
- [ ] Revisar el modal en tema claro y oscuro.
- [ ] Confirmar que al cerrar el modal no quedan backdrops huérfanos ni se bloquea el scroll de la aplicación.

## 13. Tablas y acciones

Repetir estas comprobaciones en tablas representativas de varios módulos.

- [ ] Confirmar que las columnas esperadas son visibles y las cabeceras se leen correctamente.
- [ ] Probar el scroll horizontal en tablas anchas y confirmar que no desplaza elementos ajenos a la tabla.
- [ ] Confirmar que los botones de acciones se apilan o alinean correctamente sin tapar contenido.
- [ ] Revisar el hover de filas y botones en tema claro y oscuro.
- [ ] Probar el doble clic en filas cuando aplique.
- [ ] Confirmar que pulsar un botón de acción no dispara por accidente la acción de la fila ni el doble clic.
- [ ] Revisar estados vacíos y tablas con textos largos.

## 14. Impresión / exportación

- [ ] Abrir el preview de impresión o exportación cuando exista.
- [ ] Probar la exportación a Excel en los módulos que la ofrezcan.
- [ ] Probar la impresión o generación de PDF en los módulos que la ofrezcan.
- [ ] Confirmar la legibilidad del resultado: títulos, tablas, saltos de página, tamaños de texto y ausencia de controles interactivos innecesarios.
- [ ] Confirmar que cancelar o cerrar el preview devuelve a la aplicación sin alterar la pantalla activa.

## Checklist mínima obligatoria antes de mergear

Esta selección es el mínimo imprescindible para aprobar un PR de limpieza CSS. Si alguna comprobación falla, documentar la regresión y corregirla antes del merge.

- [ ] La aplicación arranca normalmente.
- [ ] Sin acceso a la base de datos compartida, aparece el modal de fallback de red y funcionan **Continuar en local**, **Reintentar** e **Ir a configuración**.
- [ ] El dashboard, la sidebar y el header se muestran correctamente.
- [ ] Se puede cambiar entre módulos, volver a inicio y abrir grupos desplegables.
- [ ] Tema claro y oscuro: textos, fondos, botones, tarjetas, tablas y modales son legibles y coherentes.
- [ ] Tareas: alta, edición, doble clic, acciones y filtros/búsqueda funcionan.
- [ ] Peticiones: alta, edición, doble clic, acciones y filtros/búsqueda funcionan.
- [ ] Especiales: entrada, drop zone MSG, preview, destinatarios, warnings, tabla y acciones funcionan.
- [ ] Comité y Paritaria: puntos, sesiones, orden del día, modales, doble clic, tablas y acciones funcionan.
- [ ] Actas: tabla, edición, estados, alegaciones y modales funcionan.
- [ ] Teletrabajo: solicitudes, edición, histórico, importación, catálogo de puestos y modales funcionan.
- [ ] Se ha abierto cada módulo de la sección **Otros módulos**, incluida la búsqueda global.
- [ ] En modales representativos funcionan apertura, cierre, backdrop cuando aplica, scroll interno y botones visibles.
- [ ] En tablas representativas se han revisado columnas, scroll horizontal, hover, botones apilados, doble clic y ausencia de propagación accidental de eventos.
- [ ] Se ha probado el preview y, cuando existen, la exportación a Excel y la impresión o generación de PDF.
