# tasks Specification

## Purpose
La lista compartida de tareas del equipo: una sola, idéntica para todos, donde anotar trabajo escribiendo solo un título y donde se ve de un vistazo quién lleva cada cosa y en qué estado está, sin abrir nada.

## Requirements

### Requirement: Una sola lista, la misma para todos

El sistema SHALL mantener una única lista con todas las tareas del espacio y SHALL devolverla completa a cualquier persona con sesión iniciada. El sistema SHALL NOT ofrecer ninguna forma de crear una tarea que otras personas no puedan ver, ni ninguna vista de tareas distinta de esa lista única.

#### Scenario: El contenido no depende de quién pregunta

- **WHEN** dos personas distintas piden `GET /api/v1/tasks` sin que nadie haya cambiado nada entre las dos peticiones
- **THEN** ambas reciben `200` con exactamente el mismo conjunto de tareas

#### Scenario: Las tareas ajenas también se ven

- **WHEN** una persona pide la lista y en el espacio hay tareas cuyo responsable es otra persona
- **THEN** esas tareas están en la respuesta, sin distinción alguna respecto a las suyas

#### Scenario: La lista exige haber entrado

- **WHEN** se pide la lista sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y no se devuelve ninguna tarea

#### Scenario: Consultar la lista no cambia nada

- **WHEN** se pide la lista una o varias veces seguidas
- **THEN** ninguna tarea cambia de estado ni de responsable como consecuencia de haberla consultado

### Requirement: Lo que cada tarea expone

El sistema SHALL devolver de cada tarea su identificador, su título, su estado y el nombre de su responsable, resuelto ya en la respuesta. El sistema SHALL NOT devolver del responsable ningún dato de cuenta más allá del identificador y ese nombre, ni exponer ningún campo de fecha de vencimiento.

#### Scenario: Forma de una tarea en la lista

- **WHEN** se pide la lista y hay tareas
- **THEN** cada una trae identificador, título, estado y el responsable con su nombre, sin necesidad de una segunda petición para saber quién la lleva

#### Scenario: No se filtran datos de la cuenta del responsable

- **WHEN** se examina el responsable devuelto con una tarea
- **THEN** no aparecen su correo, ni sus fechas de alta, ni ningún otro dato de su cuenta

#### Scenario: No hay vencimiento

- **WHEN** se examina cualquier tarea devuelta por la API
- **THEN** no contiene ningún campo de fecha de vencimiento ni ninguna marca derivada de ella

### Requirement: Crear una tarea con solo el título

El sistema SHALL crear una tarea a partir de un único dato, su título, y SHALL devolver la tarea creada tal como aparecerá en la lista. El sistema SHALL NOT aceptar del cliente el responsable, el estado ni ningún otro dato en la creación.

#### Scenario: Alta con un título válido

- **WHEN** se envía `POST /api/v1/tasks` con sesión iniciada y solo un título
- **THEN** la respuesta es `201` con la tarea creada, y esa tarea aparece en la siguiente consulta de la lista

#### Scenario: Los datos de más no se tienen en cuenta

- **WHEN** se envía la creación incluyendo además un estado, un responsable o cualquier otro campo
- **THEN** la tarea se crea igualmente, esos datos se descartan, y la tarea resultante es idéntica a la que se habría creado enviando solo el título

#### Scenario: Crear exige haber entrado

- **WHEN** se envía la creación sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y no se crea ninguna tarea

### Requirement: Una tarea nace pendiente y a nombre de quien la crea

El sistema SHALL asignar a toda tarea recién creada el estado `pending` y como responsable la persona cuya sesión hizo la petición.

#### Scenario: Responsable por defecto

- **WHEN** una persona crea una tarea
- **THEN** la tarea queda con esa misma persona como responsable, sin que haya podido indicar a nadie

#### Scenario: Estado por defecto

- **WHEN** una persona crea una tarea
- **THEN** la tarea queda en `pending`, sin que haya podido indicar ningún estado

### Requirement: Sin título no hay tarea

El sistema SHALL exigir un título con contenido real y SHALL rechazar la creación cuando falte, cuando esté vacío o cuando solo tenga espacios, señalando el campo que falla y sin crear nada.

#### Scenario: Creación sin título

- **WHEN** se envía la creación sin el título o con el título vacío
- **THEN** la respuesta es `422`, el error apunta al campo del título y no se crea ninguna tarea

#### Scenario: Un título de solo espacios no cuenta

- **WHEN** se envía la creación con un título formado únicamente por espacios
- **THEN** se rechaza con `422` exactamente igual que si estuviera vacío, y la lista no gana ninguna fila sin texto

#### Scenario: Los espacios de los extremos no cuentan como contenido

- **WHEN** se envía un título con espacios delante o detrás de un texto real
- **THEN** la tarea se crea con el título sin esos espacios sobrantes

### Requirement: Límite de longitud del título

El sistema SHALL admitir títulos de hasta 255 caracteres y SHALL rechazar los que se pasen, avisando de ello. El sistema SHALL NOT guardar nunca una versión recortada de un título demasiado largo.

#### Scenario: Título dentro del límite

- **WHEN** se crea una tarea con un título de 255 caracteres o menos
- **THEN** la tarea se crea con ese título íntegro

#### Scenario: Título que se pasa de largo

- **WHEN** se crea una tarea con un título de más de 255 caracteres
- **THEN** la respuesta es `422`, el error indica el límite incumplido y no se guarda ninguna tarea, ni entera ni recortada

### Requirement: Tres estados fijos

Una tarea SHALL estar siempre en exactamente uno de estos tres estados, identificados en la API como `pending`, `in_progress` y `done`. El sistema SHALL rechazar cualquier otro valor y SHALL NOT ofrecer ninguna forma de añadir, renombrar ni eliminar estados.

#### Scenario: Los tres valores admitidos

- **WHEN** se mueve una tarea a `pending`, a `in_progress` o a `done`
- **THEN** el cambio se aplica y la tarea queda en ese estado

#### Scenario: Cualquier otro valor se rechaza

- **WHEN** se intenta mover una tarea a un valor que no es ninguno de esos tres, incluido el nombre castellano con el que se pinta en pantalla
- **THEN** la respuesta es `422` y la tarea conserva el estado que tenía

#### Scenario: El repertorio de estados no se puede tocar

- **WHEN** se recorre la API entera
- **THEN** no existe ninguna operación para crear, renombrar ni borrar un estado

### Requirement: Mover una tarea de estado

El sistema SHALL permitir a cualquier persona con sesión iniciada cambiar el estado de cualquier tarea, sea suya o no, sin permiso adicional. El cambio de estado SHALL ser lo único que la actualización acepta.

#### Scenario: Cambio de estado aplicado

- **WHEN** se envía `PATCH /api/v1/tasks/:id` con sesión iniciada y uno de los tres estados
- **THEN** la respuesta es `200` con la tarea ya en el nuevo estado, y la lista la refleja así a partir de ese momento

#### Scenario: Cambiar el estado de una tarea ajena

- **WHEN** se cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin ninguna comprobación de permisos adicional

#### Scenario: Se puede volver atrás desde «hecho»

- **WHEN** se mueve a `pending` o a `in_progress` una tarea que está en `done`
- **THEN** el cambio se aplica: cualquiera de los tres estados puede llevar a cualquier otro

#### Scenario: El título y el responsable no se tocan aquí

- **WHEN** se envía la actualización incluyendo además un título o un responsable
- **THEN** solo se aplica el estado, y el título y el responsable de la tarea quedan como estaban

#### Scenario: Actualizar una tarea que no existe

- **WHEN** se envía la actualización sobre un identificador que no corresponde a ninguna tarea
- **THEN** la respuesta es `404` y no se modifica nada

#### Scenario: Actualizar exige haber entrado

- **WHEN** se envía la actualización sin token de acceso o con uno que ya no vale
- **THEN** la respuesta es `401` y la tarea conserva su estado

### Requirement: La API tiene exactamente tres operaciones

El sistema SHALL exponer sobre las tareas únicamente listar, crear y actualizar el estado. El sistema SHALL NOT ofrecer lectura individual de una tarea, ni borrado, ni ninguna operación de equipo o de listado de personas.

#### Scenario: No hay lectura individual

- **WHEN** se pide una tarea concreta por su identificador
- **THEN** no hay ninguna operación que la sirva

#### Scenario: No hay borrado

- **WHEN** se intenta borrar una tarea
- **THEN** no hay ninguna operación que lo haga, y la tarea sigue en la lista

#### Scenario: No hay directorio de personas

- **WHEN** se busca una forma de enumerar los miembros del espacio
- **THEN** no existe ninguna: el único sitio donde aparece una persona es como responsable de una tarea de la lista

### Requirement: El orden de la lista no forma parte del contrato

El sistema SHALL NOT garantizar ningún orden concreto en la lista de tareas, y quien la consuma SHALL NOT depender del orden en que lleguen. Este punto está deliberadamente sin decidir y se resolverá en un cambio posterior.

#### Scenario: Dos consultas seguidas

- **WHEN** se pide la lista dos veces sin que nada haya cambiado
- **THEN** el conjunto de tareas es el mismo, y ninguna funcionalidad de este cambio depende de que además lleguen en el mismo orden

#### Scenario: La pantalla tampoco impone un orden

- **WHEN** se muestran las tareas en pantalla
- **THEN** se pintan en el orden en que llegan, sin ninguna reordenación ni agrupación por persona, por estado ni por ningún otro criterio

### Requirement: La pantalla de la lista exige sesión

La aplicación SHALL reservar la pantalla de la lista a quien tenga sesión iniciada, con el mismo comportamiento que el resto de pantallas protegidas, y SHALL ofrecer una forma visible de llegar a ella desde dentro de la aplicación.

#### Scenario: Entrar en la lista sin sesión

- **WHEN** se intenta abrir `/tasks` sin sesión iniciada
- **THEN** se muestra la pantalla de inicio de sesión, sin ninguna tarea a la vista

#### Scenario: Entrar en la lista con sesión

- **WHEN** se abre `/tasks` con sesión iniciada
- **THEN** se muestra un indicador de carga mientras se piden las tareas y después la lista del equipo

#### Scenario: Llegar a la lista desde la aplicación

- **WHEN** se está dentro de la aplicación con sesión iniciada
- **THEN** hay un enlace visible a la lista, sin tener que escribir la dirección a mano

### Requirement: Cada fila responde quién está en qué

La aplicación SHALL mostrar en cada fila de la lista el título de la tarea, el **nombre** de su responsable y su estado, de modo que se pueda decir en qué anda cada persona sin abrir ninguna tarea. La aplicación SHALL NOT mostrar del responsable su correo ni su identificador interno.

#### Scenario: Las tres cosas a la vista

- **WHEN** se mira la lista con tareas en ella
- **THEN** cada fila deja leer su título, quién la lleva y en qué estado está, sin abrir nada ni pasar el ratón por encima

#### Scenario: Responsable sin nombre puesto

- **WHEN** el responsable de una tarea no tiene nombre completo en su cuenta
- **THEN** en su lugar se lee «Sin nombre», y en ningún caso su correo ni su identificador

#### Scenario: Los estados se leen en castellano

- **WHEN** se mira el estado de una tarea en la lista
- **THEN** se lee «Pendiente», «En curso» o «Hecho», nunca el identificador con el que ese estado viaja por la API

#### Scenario: La lista no adelanta vencimientos

- **WHEN** se recorre la lista entera
- **THEN** no hay ninguna fecha ni ninguna marca de tarea vencida en ninguna fila

### Requirement: Crear una tarea desde la lista

La aplicación SHALL ofrecer en la propia pantalla de la lista un único campo de título para crear una tarea, y SHALL mostrar la tarea recién creada en la lista sin recargar la página ni navegar a otra pantalla. La aplicación SHALL NOT ofrecer ni sugerir responsable, estado, fecha ni ningún otro dato al crear.

#### Scenario: Crear escribiendo solo el título

- **WHEN** se escribe un título y se envía el formulario de creación
- **THEN** la tarea aparece en la lista ahí mismo, ya con su responsable y su estado, y el campo queda vacío listo para la siguiente

#### Scenario: El formulario no pide nada más

- **WHEN** se recorre el flujo de creación entero
- **THEN** el título es lo único que se pide, y no hay ningún selector de responsable, de estado ni de fecha, ni visible ni escondido tras un desplegable de opciones avanzadas

#### Scenario: Envío en curso

- **WHEN** se ha enviado la creación y todavía no ha respondido el servidor
- **THEN** el formulario indica que está trabajando y no admite un segundo envío del mismo título

### Requirement: Los rechazos del título se explican junto al campo

La aplicación SHALL explicar en castellano y junto al propio campo de título por qué se ha rechazado una creación, y SHALL conservar lo escrito para poder corregirlo.

#### Scenario: Intento sin título

- **WHEN** se envía la creación con el campo vacío o con solo espacios
- **THEN** se explica junto al campo que hace falta un título y no se crea ninguna tarea

#### Scenario: Intento con un título demasiado largo

- **WHEN** se envía la creación con un título que supera el límite admitido
- **THEN** se avisa junto al campo de que se pasa de largo, sin recortarlo y sin crear la tarea

### Requirement: Cambiar el estado desde la propia fila

La aplicación SHALL permitir cambiar el estado de cualquier tarea desde su fila en la lista, ofreciendo los tres estados como únicos destinos, y SHALL reflejar el nuevo estado de inmediato. La aplicación SHALL NOT exigir abrir la tarea, confirmar en un diálogo ni rellenar ningún campo para ello.

#### Scenario: Cambio en un gesto

- **WHEN** se cambia el estado de una tarea desde su fila
- **THEN** la fila muestra el nuevo estado sin haber abandonado la lista, sin diálogo de confirmación y sin ningún formulario de por medio

#### Scenario: Los tres destinos, y solo esos

- **WHEN** se abre el control de estado de una fila
- **THEN** los únicos destinos ofrecidos son Pendiente, En curso y Hecho, y al terminar la tarea está en exactamente uno de ellos

#### Scenario: Cualquier tarea, no solo la propia

- **WHEN** se cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** funciona igual que con una propia, sin pedir permiso ni mostrar ninguna advertencia

#### Scenario: El cambio no se aplica

- **WHEN** el servidor rechaza el cambio de estado o no se le puede alcanzar
- **THEN** se explica el problema y la fila vuelve a mostrar el estado que la tarea tenía de verdad, sin quedarse enseñando uno falso

### Requirement: La lista vacía se explica

La aplicación SHALL explicar qué es la lista y ofrecer crear la primera tarea cuando en el espacio no hay ninguna, en lugar de mostrar una lista vacía sin más.

#### Scenario: Espacio recién estrenado

- **WHEN** se abre la lista y no hay ninguna tarea creada
- **THEN** se explica para qué sirve la lista y se invita a crear la primera, con el campo de título a mano

### Requirement: Sin lentes sobre la lista

La aplicación SHALL mostrar siempre la lista completa del equipo. La aplicación SHALL NOT ofrecer una vista de «mis tareas», ni filtros, ni búsqueda, ni agrupaciones, ni ninguna señal de qué personas están conectadas o activas.

#### Scenario: No hay vista personal

- **WHEN** se busca por la aplicación otra vista de tareas distinta de la del equipo
- **THEN** no existe ninguna: la lista compartida es el único sitio donde hay tareas

#### Scenario: No se muestra presencia

- **WHEN** otras personas del equipo están usando la aplicación a la vez
- **THEN** la lista no lo refleja de ninguna manera: ni quién está en línea, ni actividad por persona
