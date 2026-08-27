## ADDED Requirements

### Requirement: Cuándo una tarea está vencida

El sistema SHALL considerar vencida una tarea únicamente cuando se cumplen las tres condiciones a la vez: tiene fecha de vencimiento, esa fecha es **anterior** al día de referencia, y su estado no es `done`. En cualquier otro caso la tarea SHALL NOT considerarse vencida.

#### Scenario: Fecha ya pasada y sin terminar

- **WHEN** se lee una tarea con fecha anterior al día de referencia y estado `pending` o `in_progress`
- **THEN** su veredicto de vencimiento es afirmativo

#### Scenario: Vencer hoy todavía no es estar vencida

- **WHEN** se lee una tarea sin terminar cuya fecha es exactamente el día de referencia
- **THEN** su veredicto es negativo, porque la regla exige que la fecha sea anterior, no igual

#### Scenario: Una fecha futura nunca está vencida

- **WHEN** se lee una tarea cuya fecha es posterior al día de referencia
- **THEN** su veredicto es negativo

#### Scenario: Sin fecha no se vence nunca

- **WHEN** se lee una tarea sin fecha de vencimiento, creada hace semanas y todavía sin terminar
- **THEN** su veredicto es negativo, por antigua que sea

#### Scenario: Una tarea hecha no está vencida

- **WHEN** se lee una tarea en estado `done` cuya fecha ya pasó
- **THEN** su veredicto es negativo

#### Scenario: Darla por hecha la deja de vencer, sin tocar su fecha

- **WHEN** se mueve a `done` una tarea que estaba vencida
- **THEN** su veredicto pasa a negativo y su fecha de vencimiento queda exactamente igual

#### Scenario: Aplazar la fecha resuelve el vencimiento

- **WHEN** se cambia la fecha de una tarea vencida por otra posterior al día de referencia
- **THEN** su veredicto pasa a negativo

### Requirement: El día de referencia lo pone quien mira

El sistema SHALL aceptar en cada operación sobre tareas el día de calendario de quien la pide, y SHALL resolver el vencimiento contra ese día. Cuando no se indique ninguno, el sistema SHALL usar su propio día. El sistema SHALL rechazar un día de referencia con formato inválido.

#### Scenario: Dos personas en husos distintos

- **WHEN** dos personas leen la misma tarea indicando días de referencia distintos, y la fecha de la tarea queda en medio
- **THEN** una la recibe como vencida y la otra no, y ambas lecturas son correctas

#### Scenario: Una tarea vence sola al pasar el día

- **WHEN** se vuelve a leer, con el día siguiente como referencia, una tarea sin terminar cuya fecha era la de ayer
- **THEN** llega como vencida, sin que nadie haya modificado nada

#### Scenario: Sin día de referencia

- **WHEN** se pide una tarea sin indicar ningún día de referencia
- **THEN** la respuesta llega igualmente, resuelta contra el día del propio servidor

#### Scenario: Día de referencia con formato inválido

- **WHEN** se indica un día de referencia que no es una fecha de calendario válida
- **THEN** la respuesta es `422` señalando ese campo, y no se devuelve ninguna tarea

### Requirement: El vencimiento se calcula, no se guarda

El sistema SHALL resolver el veredicto de vencimiento en cada lectura y SHALL NOT almacenarlo en ninguna parte, ni actualizarlo mediante ningún proceso que recorra las tareas. El sistema SHALL NOT aceptar del cliente el veredicto: si llega, se ignora.

#### Scenario: El cliente intenta imponer el veredicto

- **WHEN** se crea o se actualiza una tarea incluyendo un veredicto de vencimiento en los datos enviados
- **THEN** ese dato se descarta y el veredicto devuelto es el que dicta la regla

#### Scenario: El veredicto sigue al estado sin intervención

- **WHEN** una tarea cambia de estado o de fecha
- **THEN** su veredicto se recalcula solo en la siguiente lectura, sin que nada ni nadie lo haya marcado

### Requirement: Poner, cambiar y quitar la fecha de una tarea

El sistema SHALL permitir a cualquier persona con sesión iniciada fijar, cambiar y retirar la fecha de vencimiento de cualquier tarea, sea suya o no, sin permiso adicional. La fecha SHALL ser de calendario, sin hora. Retirar la fecha SHALL ser una operación admitida y no un error, y SHALL hacerse enviándola explícitamente vacía.

#### Scenario: Fijar una fecha

- **WHEN** se actualiza una tarea sin fecha indicando una
- **THEN** la respuesta es `200` con la tarea ya con esa fecha

#### Scenario: Cambiar la fecha

- **WHEN** se actualiza una tarea que ya tenía fecha indicando otra distinta
- **THEN** la tarea queda con la nueva y la anterior no deja rastro

#### Scenario: Quitar la fecha

- **WHEN** se actualiza una tarea con fecha enviándola explícitamente vacía
- **THEN** la tarea queda sin fecha y su veredicto de vencimiento pasa a negativo

#### Scenario: La fecha de una tarea ajena

- **WHEN** se cambia la fecha de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin advertencia ni comprobación de permisos

#### Scenario: Una fecha que ya pasó se acepta

- **WHEN** se fija en una tarea sin terminar una fecha anterior al día de referencia
- **THEN** se acepta sin rechazo alguno y la tarea pasa a estar vencida de inmediato

#### Scenario: Una fecha imposible se rechaza

- **WHEN** se indica una fecha que no existe o está incompleta
- **THEN** la respuesta es `422` señalando el campo de la fecha, y la tarea conserva la fecha que tuviera

### Requirement: Abrir una tarea para ver y editar su plazo

La aplicación SHALL ofrecer, para cada tarea de la lista, una pantalla propia que muestre su título, su responsable, su estado y su fecha de vencimiento, alcanzable desde la propia lista y reservada a quien tenga sesión iniciada.

#### Scenario: Llegar a una tarea desde la lista

- **WHEN** se activa el título de una tarea en la lista
- **THEN** se abre su pantalla, sin tener que escribir ninguna dirección a mano

#### Scenario: Abrir una tarea sin sesión

- **WHEN** se intenta abrir directamente la dirección de una tarea sin sesión iniciada
- **THEN** se muestra la pantalla de inicio de sesión, sin ningún dato de la tarea a la vista

#### Scenario: Abrir una tarea que no existe

- **WHEN** se abre la dirección de una tarea que no existe
- **THEN** se explica que no se ha encontrado y se ofrece volver a la lista

### Requirement: La tarea vencida se señala al abrirla

La aplicación SHALL indicar explícitamente que una tarea está vencida cuando se abre, con una señal propia que no obligue a comparar su fecha con el día de hoy. Esa señal SHALL NOT depender únicamente del color.

#### Scenario: Una tarea vencida

- **WHEN** se abre una tarea que el servidor devuelve como vencida
- **THEN** se lee un aviso explícito de que se ha pasado de plazo, además de su fecha

#### Scenario: Una tarea que no está vencida

- **WHEN** se abre una tarea con fecha que el servidor no devuelve como vencida
- **THEN** se ve su fecha sin ningún aviso de plazo

#### Scenario: No tener fecha no se penaliza

- **WHEN** se abre una tarea sin fecha de vencimiento
- **THEN** no aparece ningún aviso, recordatorio ni señal de que le falte nada

### Requirement: Poner y quitar la fecha desde la pantalla de la tarea

La aplicación SHALL permitir fijar, cambiar y retirar la fecha desde esa pantalla, y SHALL guardar el cambio sola, sin ningún paso de guardado adicional y sin recargar ni volver a abrir la tarea. La aplicación SHALL NOT pedir confirmación para retirar la fecha.

#### Scenario: Poner una fecha

- **WHEN** se indica una fecha en una tarea que no la tenía
- **THEN** la pantalla la muestra ya puesta, junto con el aviso de vencida si corresponde, sin recargar ni pulsar ningún botón de guardar

#### Scenario: Quitar la fecha

- **WHEN** se vacía el campo de la fecha
- **THEN** la tarea queda sin fecha y desaparece el aviso de vencida si lo tenía, sin ningún diálogo de confirmación de por medio

#### Scenario: El cambio ya está guardado al salir

- **WHEN** se pone o se quita la fecha y se vuelve a la lista
- **THEN** al abrir de nuevo la tarea el cambio sigue ahí

#### Scenario: Una fecha que el servidor rechaza

- **WHEN** el servidor rechaza la fecha indicada
- **THEN** se explica el problema en castellano junto al propio campo y la tarea conserva la fecha que tuviera antes

#### Scenario: El servidor no responde

- **WHEN** no se consigue guardar el cambio de fecha
- **THEN** se explica el problema y el campo vuelve a mostrar la fecha que la tarea tiene de verdad

### Requirement: Lo que cada tarea expone, plazo incluido

El sistema SHALL devolver de cada tarea su identificador, su título, su estado, el nombre de su responsable —resuelto ya en la respuesta—, su fecha de vencimiento, que puede estar vacía, y su veredicto de vencimiento como un campo booleano. El sistema SHALL NOT devolver del responsable ningún dato de cuenta más allá del identificador y ese nombre.

#### Scenario: Forma de una tarea

- **WHEN** se pide una tarea o la lista entera
- **THEN** cada una trae identificador, título, estado, el responsable con su nombre, su fecha de vencimiento y si está vencida, sin necesidad de una segunda petición para nada de eso

#### Scenario: No se filtran datos de la cuenta del responsable

- **WHEN** se examina el responsable devuelto con una tarea
- **THEN** no aparecen su correo, ni sus fechas de alta, ni ningún otro dato de su cuenta

#### Scenario: Una tarea sin fecha

- **WHEN** se lee una tarea a la que nadie ha puesto fecha
- **THEN** su fecha llega explícitamente vacía y su veredicto de vencimiento es negativo

#### Scenario: El veredicto viene resuelto

- **WHEN** el cliente recibe una tarea
- **THEN** sabe si está vencida sin comparar su fecha con ninguna otra: el servidor ya lo ha decidido

### Requirement: La API tiene exactamente cuatro operaciones

El sistema SHALL exponer sobre las tareas únicamente listar, leer una suelta, crear y actualizar. El sistema SHALL NOT ofrecer borrado ni ninguna operación de equipo o de listado de personas.

#### Scenario: Leer una tarea suelta

- **WHEN** se envía `GET /api/v1/tasks/:id` con sesión iniciada
- **THEN** la respuesta es `200` con esa tarea, con la misma forma con la que aparece en la lista

#### Scenario: Leer una tarea que no existe

- **WHEN** se pide una tarea cuyo identificador no corresponde a ninguna
- **THEN** la respuesta es `404`

#### Scenario: Leer una tarea exige haber entrado

- **WHEN** se pide una tarea sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y no se revela ningún dato de la tarea

#### Scenario: No hay borrado

- **WHEN** se intenta borrar una tarea
- **THEN** no hay ninguna operación que lo haga, y la tarea sigue en la lista

#### Scenario: No hay directorio de personas

- **WHEN** se busca una forma de enumerar los miembros del espacio
- **THEN** no existe ninguna: el único sitio donde aparece una persona es como responsable de una tarea

## MODIFIED Requirements

### Requirement: Crear una tarea con solo el título

El sistema SHALL crear una tarea a partir de un único dato obligatorio, su título, y SHALL admitir además, de forma opcional, una fecha de vencimiento. El sistema SHALL NOT aceptar del cliente el responsable, el estado ni ningún otro dato en la creación.

#### Scenario: Alta con un título válido

- **WHEN** se envía `POST /api/v1/tasks` con sesión iniciada y solo un título
- **THEN** la respuesta es `201` con la tarea creada, sin fecha de vencimiento, y esa tarea aparece en la siguiente consulta de la lista

#### Scenario: Alta con fecha

- **WHEN** se envía la creación con un título y una fecha de vencimiento
- **THEN** la tarea se crea con esa fecha, y llega ya vencida si la fecha es anterior al día de referencia

#### Scenario: Los datos de más no se tienen en cuenta

- **WHEN** se envía la creación incluyendo además un estado, un responsable, un veredicto de vencimiento o cualquier otro campo
- **THEN** la tarea se crea igualmente, esos datos se descartan, y la tarea resultante es idéntica a la que se habría creado enviando solo el título y, si acaso, la fecha

#### Scenario: Crear exige haber entrado

- **WHEN** se envía la creación sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y no se crea ninguna tarea

### Requirement: Mover una tarea de estado

El sistema SHALL permitir a cualquier persona con sesión iniciada cambiar el estado de cualquier tarea, sea suya o no, sin permiso adicional. La actualización SHALL aceptar el estado, la fecha de vencimiento o ambos, cada uno opcional, y SHALL rechazar una actualización que no traiga ninguno de los dos.

#### Scenario: Cambio de estado aplicado

- **WHEN** se envía `PATCH /api/v1/tasks/:id` con sesión iniciada y uno de los tres estados
- **THEN** la respuesta es `200` con la tarea ya en el nuevo estado, y la lista la refleja así a partir de ese momento

#### Scenario: Cambiar el estado de una tarea ajena

- **WHEN** se cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin ninguna comprobación de permisos adicional

#### Scenario: Se puede volver atrás desde «hecho»

- **WHEN** se mueve a `pending` o a `in_progress` una tarea que está en `done`
- **THEN** el cambio se aplica: cualquiera de los tres estados puede llevar a cualquier otro

#### Scenario: El estado y la fecha, juntos o por separado

- **WHEN** se envía la actualización con solo el estado, con solo la fecha, o con los dos a la vez
- **THEN** se aplica lo que venga y lo que no venga queda intacto

#### Scenario: Una actualización que no cambia nada

- **WHEN** se envía la actualización sin estado y sin fecha
- **THEN** la respuesta es `422` y la tarea queda como estaba

#### Scenario: El título y el responsable no se tocan aquí

- **WHEN** se envía la actualización incluyendo además un título o un responsable
- **THEN** solo se aplican el estado y la fecha, y el título y el responsable de la tarea quedan como estaban

#### Scenario: Actualizar una tarea que no existe

- **WHEN** se envía la actualización sobre un identificador que no corresponde a ninguna tarea
- **THEN** la respuesta es `404` y no se modifica nada

#### Scenario: Actualizar exige haber entrado

- **WHEN** se envía la actualización sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y la tarea conserva su estado

## REMOVED Requirements

### Requirement: Lo que cada tarea expone

**Reason**: Su escenario «No hay vencimiento» exigía que ninguna tarea trajera campo de fecha ni marca derivada de ella, que es exactamente lo que este cambio introduce. No se puede matizar: hay que retirarlo.

**Migration**: Lo sustituye «Lo que cada tarea expone, plazo incluido», que conserva íntegros los otros dos escenarios y añade la fecha y el veredicto. Ningún cliente pierde nada: la respuesta solo gana campos.

### Requirement: La API tiene exactamente tres operaciones

**Reason**: Su escenario «No hay lectura individual» negaba explícitamente el endpoint que esta historia necesita para poder abrir una tarea.

**Migration**: Lo sustituye «La API tiene exactamente cuatro operaciones», que mantiene las negativas que siguen vigentes —ni borrado ni directorio de personas— y admite la lectura individual. El resto de operaciones no cambia.
