## Why

Hoy una tarea de FlowSync no tiene plazo, así que el producto no puede responder la única pregunta que sigue a «¿en qué andas?»: si algo se ha pasado de fecha. Quien quiere comprometerse con un día no tiene dónde apuntarlo, y quien mira no tiene forma de saber que algo lleva tiempo esperando.

Este change añade la fecha de vencimiento —opcional, de calendario y siempre reversible— y el veredicto de si una tarea está vencida, cubriendo la historia `FS-118`.

## What Changes

**La regla de vencimiento.** Una tarea está vencida cuando se cumplen las tres condiciones a la vez: tiene fecha, esa fecha es **anterior** al día de hoy, y su estado **no** es `done`. Vencer hoy todavía no es estar vencida. Sin fecha no se vence nunca, por antigua que sea la tarea. Y una tarea dada por hecha deja de estar vencida sin perder su fecha.

**El veredicto lo da el servidor.** La API expone en cada tarea un campo booleano `isOverdue` junto a la propia `dueDate`. El cliente **no** compara fechas por su cuenta.

**El día de referencia lo pone quien mira.** Las lecturas aceptan el día de calendario del cliente; el servidor compara contra él. Dos personas en husos distintos obtienen veredictos distintos y ambos son correctos, y una tarea pasa a vencida por el mero avance del día, sin que nadie la toque.

**`isOverdue` no se persiste.** Se calcula en cada lectura. No hay columna que lo guarde, ni proceso nocturno que marque tareas, ni forma de que el cliente lo envíe: si lo manda, se ignora.

**La fecha se pone, se cambia y se quita.** Al crear (donde es opcional) y al actualizar. Se acepta una fecha ya pasada sin rechistar: anotar algo que ya llega tarde es legítimo, y la tarea nace vencida. Quitarla se hace enviándola explícitamente vacía, y es una operación normal, no un error.

**La actualización pasa a aceptar dos campos.** `status`, `dueDate` o ambos, cada uno opcional, pero al menos uno presente. **BREAKING** respecto a la spec actual, que dice que el estado es lo único que la actualización acepta.

**La API gana una cuarta operación: leer una tarea suelta.** **BREAKING** respecto a la spec actual, que declara exactamente tres y niega la lectura individual.

**Una pantalla de detalle mínima.** En `/tasks/:id`, alcanzable desde el título de cada fila: título, responsable, estado, el campo de fecha y la señal de vencida. Se guarda sola, quitar la fecha no pide confirmación, y una fecha imposible deja intacta la anterior y se explica junto al campo.

**Lo que este change deja fuera a propósito:**

- **La lista no cambia.** Sigue mostrando título, responsable y estado, sin fechas y sin ninguna marca de vencida, y una tarea sin fecha no recibe aviso de que le falte algo.
- **El formulario de creación tampoco cambia:** el título sigue siendo lo único que se pide, y no se ofrece ni se sugiere una fecha.
- **La pantalla de detalle completa**, con todo lo que una tarea podría enseñar y editar, no entra: aquí solo llega lo que la historia necesita.
- **Notificaciones, recordatorios y recurrencia.**
- **Ordenar o filtrar por fecha.**
- **Pruebas automatizadas.** Este change no monta base de pruebas ni escribe tests, así que el ticket `FS-118.5` y los criterios de prueba de `FS-118.2` y `FS-118.3` quedan sin cubrir.
- **CA-18 (reasignar no toca la fecha) se queda sin superficie.** Cambiar de responsable no existe todavía en el producto: ni la API ni la interfaz lo permiten. El criterio no se puede verificar hoy, y se deja anotado para cuando la reasignación llegue.

**Decisiones tomadas para poder especificar:**

- **El cliente manda su día**, no su huso: las lecturas aceptan un día de calendario y el servidor compara contra él. Sin base de datos de husos y directamente comprobable.
- **Campo de fecha nativo del navegador**, estilado con el componente de campo que ya existe. `FS-118.4` avisaba de que había que decidirlo antes de empezar; se decide aquí, y sin dependencias nuevas.

## Open Questions

- **Volver de «hecho» a un estado anterior con la fecha pasada.** La regla, tal como se especifica, hace que la tarea vuelva a estar vencida en cuanto sale de `done`. Es la consecuencia coherente de calcular el veredicto en cada lectura, pero `PA-7` sigue abierto y podría querer otra cosa.
- **Dos personas cambiando la fecha de la misma tarea a la vez.** Gana la última escritura y la otra ve un dato viejo hasta que recargue. Es `PA-8`, sin refresco automático en este alcance.
- **Qué más enseña y edita el detalle de una tarea.** Esta pantalla es la superficie mínima que `FS-118` necesita, no la vista de detalle que el producto acabará queriendo (`PA-6`). Nace deliberadamente corta, y conviene decidir su alcance real antes de que crezca a base de parches.
- **El orden de la lista** (`PA-3`) sigue sin decidir, y este change tampoco lo decide.

## Capabilities

### New Capabilities

Ninguna. Todo lo que este change añade pertenece a la capability de tareas que ya existe.

### Modified Capabilities

- `tasks`: la tarea gana una fecha de vencimiento opcional y un veredicto de vencimiento calculado en cada lectura; la actualización pasa a aceptar también la fecha; la API deja de tener exactamente tres operaciones y suma la lectura individual; y la interfaz gana una pantalla mínima donde abrir una tarea, ver si está vencida y poner o quitar su fecha.

## Impact

- **Backend:** migración que añade la columna de fecha, nullable, sobre una tabla que ya tiene datos; la regla de vencimiento en el dominio, en un solo sitio; validadores de creación y actualización revisados; el transformer pasa a necesitar el día de referencia para resolver el veredicto; una ruta nueva para la lectura individual. El esquema se regenera desde la migración.
- **Frontend:** una pantalla nueva y su ruta protegida; las llamadas nuevas al único punto de contacto con la API, que además pasa a adjuntar el día del cliente en las lecturas; el título de cada fila de la lista se convierte en enlace, que es el único cambio que la lista admite.
- **Dependencias:** ninguna nueva, ni en el backend ni en el frontend.
- **Compatibilidad:** las tareas anteriores a la migración siguen siendo válidas, sin fecha y por tanto nunca vencidas. La respuesta de una tarea gana dos campos, lo que es aditivo; la actualización se vuelve más permisiva, no menos, así que ningún cliente que hoy funcione deja de hacerlo.
