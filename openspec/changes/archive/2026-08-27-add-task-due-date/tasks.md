> Este cambio **no lleva pruebas automatizadas**: no se monta base de pruebas ni se escribe ningún test. La verificación de cada tarea es una comprobación manual con `curl` o en pantalla, más los comandos de tipos y estilo que el repositorio ya tiene.

## 1. Persistencia de la fecha

- [x] 1.1 Crear la migración que añade a la tabla de tareas la columna de fecha de vencimiento, anulable y de tipo fecha. Verificar que `node ace migration:run` la aplica sobre la base actual, **que ya tiene tareas**, sin error y sin tocar sus datos.
- [x] 1.2 Comprobar que el reverso de la migración deja el esquema como estaba. Verificar con `node ace migration:rollback` seguido de `migration:run`, confirmando que las tareas previas siguen ahí.
- [x] 1.3 Confirmar cómo ha quedado la columna en `database/schema.ts` regenerado. Si no llega como día de calendario, fijarlo en `database/schema_rules.ts` y volver a generar. Verificar que el fichero generado declara la fecha como anulable y que **no** se ha editado a mano.

## 2. La regla de vencimiento

- [x] 2.1 Escribir en el modelo la función que decide si una tarea está vencida, recibiendo el día de referencia como argumento explícito y sin consultar el reloj por dentro. Verificar con `node ace repl` los cuatro bordes: día anterior, mismo día, día posterior y sin fecha.
- [x] 2.2 Comprobar en esa misma función que una tarea en `done` nunca está vencida, tenga la fecha que tenga. Verificar en el repl con una tarea hecha y fecha de hace un mes.
- [x] 2.3 Comprobar que la regla no está reimplementada en ninguna otra capa. Verificar con `grep` que solo hay un sitio que compare la fecha de vencimiento con un día.

## 3. El día de referencia en la API

- [x] 3.1 Aceptar en las cuatro operaciones el día de referencia del cliente como parámetro de consulta, validado como fecha de calendario y opcional. Verificar con `curl` que un valor inválido devuelve `422` señalando ese campo.
- [x] 3.2 Usar el día del servidor cuando el cliente no lo indique. Verificar con `curl` sin el parámetro que la respuesta llega igualmente resuelta.
- [x] 3.3 Pasar el día de referencia al transformer y exponer en cada tarea su fecha de vencimiento y su veredicto de vencimiento. Verificar con `curl` que ambos campos aparecen en la lista, en la lectura individual, al crear y al actualizar.
- [x] 3.4 Comprobar el escenario de los dos husos. Verificar con `curl` pidiendo la misma tarea con dos días de referencia que la dejan a un lado y otro: una respuesta la da vencida y la otra no.

## 4. Poner, cambiar y quitar la fecha

- [x] 4.1 Extender el validador de creación con la fecha de vencimiento opcional, sin tocar la obligatoriedad del título. Verificar con `curl` que crear solo con título sigue funcionando y deja la tarea sin fecha.
- [x] 4.2 Extender el validador de actualización para aceptar estado, fecha o ambos, cada uno opcional, distinguiendo el campo ausente del enviado explícitamente vacío. Verificar con `curl` que enviar la fecha vacía la retira y que no enviarla la deja intacta.
- [x] 4.3 Rechazar con `422` una actualización que no traiga ni estado ni fecha, con el mismo formato de error que produce el resto de la API. Verificar con `curl` enviando un cuerpo vacío y comparando la forma del error con la de un fallo de validación normal.
- [x] 4.4 Comprobar que una fecha ya pasada se acepta al crear y al actualizar. Verificar con `curl` que la tarea se guarda y vuelve marcada como vencida en la misma respuesta.
- [x] 4.5 Comprobar que una fecha imposible o incompleta se rechaza señalando el campo y deja la tarea como estaba. Verificar con `curl` sobre una tarea que ya tenía fecha.
- [x] 4.6 Comprobar que el veredicto de vencimiento enviado por el cliente se ignora, al crear y al actualizar. Verificar con `curl` mandándolo del revés y viendo que la respuesta lo contradice.

## 5. Leer una tarea suelta

- [x] 5.1 Implementar la lectura individual de una tarea, con la misma forma de respuesta que tiene en la lista y fallando con `404` si no existe. Verificar con `curl` una tarea existente y un identificador inventado.
- [x] 5.2 Registrar la ruta en el grupo protegido, junto a las tres que ya hay. Verificar con `node ace list:routes` que ahora son cuatro y con `curl` sin token que la nueva responde `401`.
- [x] 5.3 Confirmar que no ha aparecido ninguna operación de más: sigue sin haber borrado ni listado de personas. Verificar con `node ace list:routes`.
- [x] 5.4 Arrancar el servidor para regenerar el registro tipado de `.adonisjs/` y commitear el diff. Verificar con `npm run typecheck`, `npm run lint` y `npm run format` en `backend/`.

## 6. Contacto del frontend con la API

- [x] 6.1 Añadir a los tipos de la tarea la fecha de vencimiento, que puede venir vacía, y el veredicto de vencimiento. Verificar con `npm run build` en `frontend/`.
- [x] 6.2 Adjuntar el día de calendario del navegador a cada petición sobre tareas, desde el único punto de contacto con la API y en un solo sitio. Verificar en la pestaña de red que todas lo llevan.
- [x] 6.3 Añadir la llamada de lectura individual y extender la de actualización para admitir también la fecha, incluida su retirada explícita. Verificar que ninguna llamada nueva aparece fuera de ese fichero.
- [x] 6.4 Extender la traducción de errores para que el rechazo de la fecha salga en castellano y asociado a su campo. Verificar en pantalla forzando el caso.

## 7. La pantalla de la tarea

- [x] 7.1 Crear la pantalla de una tarea en su propia dirección, protegida igual que la lista, que la pide al montarse y muestra el indicador de carga que ya se usa. Verificar en el navegador con sesión y sin ella.
- [x] 7.2 Mostrar en ella el título, el responsable por su nombre y el estado, reutilizando los componentes que ya existen. Verificar que una tarea de otra persona se ve igual que una propia.
- [x] 7.3 Explicar que la tarea no se ha encontrado y ofrecer volver a la lista cuando la dirección no corresponde a ninguna. Verificar abriendo un identificador inventado.
- [x] 7.4 Convertir el título de cada fila de la lista en enlace a su tarea, **sin cambiar nada más de la lista**. Verificar que sigue sin haber fechas ni marcas de vencimiento en ninguna fila.
- [x] 7.5 Registrar la ruta nueva siguiendo el patrón de las protegidas, sin tocar la redirección de la ruta comodín. Verificar que sin sesión lleva al inicio de sesión.

## 8. La fecha en pantalla

- [x] 8.1 Añadir el campo de fecha nativo, estilado con el componente de campo existente, con la fecha actual de la tarea cargada. Verificar que `frontend/package.json` no ha cambiado.
- [x] 8.2 Guardar el cambio en cuanto se indica una fecha, sin botón de guardar, y pintar la tarea que devuelva el servidor. Verificar poniendo una fecha y recargando la pantalla.
- [x] 8.3 Retirar la fecha al vaciar el campo, sin ningún diálogo de confirmación. Verificar que la tarea queda sin fecha y que el aviso de vencida desaparece si lo tenía.
- [x] 8.4 Indicar que está guardando mientras la petición está en vuelo, y no admitir un segundo envío del mismo valor. Verificar cambiando la fecha dos veces seguidas.
- [x] 8.5 Explicar junto al campo el rechazo del servidor y devolver el campo a la fecha que la tarea tenía. Verificar forzando un `422` y también con el backend parado.

## 9. La señal de vencida

- [x] 9.1 Mostrar al abrir una tarea vencida un aviso explícito **con palabras**, además de su fecha, sin que haya que comparar nada mentalmente. Verificar con una tarea de fecha pasada y sin terminar.
- [x] 9.2 Comprobar que la señal no depende solo del color y que se lee bien en escala de grises. Verificar con las herramientas del navegador.
- [x] 9.3 Comprobar que no aparece la señal en los tres casos en que no toca: fecha de hoy, fecha futura y tarea hecha con la fecha pasada. Verificar los tres en pantalla.
- [x] 9.4 Comprobar que una tarea sin fecha no recibe ningún aviso ni indicación de que le falte algo. Verificar abriendo una tarea recién creada.

## 10. Cierre

- [x] 10.1 Recorrer el camino completo: crear una tarea sin fecha, abrirla, ponerle una fecha pasada, verla vencida, pasarla a hecho, ver que deja de estarlo conservando la fecha, y quitarle la fecha. Verificar en el navegador de una sentada.
- [x] 10.2 Repasar que no ha entrado nada fuera de alcance: ni notificaciones, ni recordatorios, ni recurrencia, ni orden o filtro por fecha, ni fechas en la lista. Verificar con `git diff` contra la especificación.
- [x] 10.3 Pasar `npm run typecheck`, `npm run lint` y `npm run format` en `backend/`, y `npm run build`, `npm run lint` y `npm run format` en `frontend/`. Verificar que los seis terminan limpios.
