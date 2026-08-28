## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño es el estado actual del repositorio: el vertical de acceso ya está construido de punta a punta y fija las convenciones que este cambio debe seguir en lugar de reinventar.

En el backend eso significa esquema generado desde las migraciones (los modelos no declaran columnas), mapa de controladores generado en `.adonisjs/`, toda respuesta pasando por un transformer y por `serialize()` con envoltorio `{ data }`, validación con VineJS 4 vía `request.validateUsing(...)`, y protección de rutas con el middleware de sesión ya aplicado al grupo de `/api/v1/account`.

En el frontend: un único punto de contacto con la API que envuelve `fetch`, desenvuelve el `{ data }`, adjunta el token y traduce los errores del backend a castellano; un contexto de sesión que ya expone el token y el usuario; guardas de ruta ya escritas; y una carpeta de componentes de interfaz generados con shadcn de la que **solo existen cinco**: alert, button, card, input y label.

Ese último punto es el que más aprieta: cualquier control que no se pueda construir con esos cinco hay que construirlo a mano, porque traer uno nuevo significa añadir dependencias, y este cambio no añade ninguna.

## Goals / Non-Goals

**Goals:**

- Encajar el vertical de tareas en las convenciones que ya existen, sin abrir un segundo estilo de hacer las cosas en el mismo repositorio.
- Que el identificador de un estado y su etiqueta en pantalla estén separados desde el primer día, con la traducción en un solo sitio.
- Que la lista se pinte con una sola petición: quién lleva cada tarea tiene que venir resuelto, sin una llamada por fila.
- Exponer del responsable lo mínimo que la lista necesita, para que el cliente no pueda acostumbrarse a datos de cuenta que después no se puedan recortar.

**Non-Goals:**

- No se monta base de pruebas ni se escriben tests. El repositorio no tiene todavía ningún test y este cambio no es el sitio para estrenarla.
- No se introduce ninguna librería de datos ni de estado en el frontend: la pantalla gestiona su propio estado con lo que trae React.
- No se toca nada del vertical de acceso más allá de añadir un enlace de navegación.

## Decisions

### El estado se guarda y viaja como identificador, y se traduce solo al pintar

El estado se persiste y se transporta como `pending`, `in_progress` o `done`. La traducción a Pendiente / En curso / Hecho vive en un único mapa del frontend, junto al orden en que se ofrecen los tres botones.

*Por qué:* meter el castellano en el identificador ata el dato a un idioma y a una redacción, y convierte cualquier retoque de copia en una migración de datos. Separarlo cuesta un mapa de tres líneas.

*Alternativa descartada:* guardar un entero (0/1/2). Ahorra bytes que aquí no importan y hace ilegible cualquier consulta directa a la base de datos.

### El repertorio de estados se valida en la aplicación, no con una restricción de columna

La columna es de texto y quien garantiza el conjunto cerrado es el validador (`vine.enum`), que además produce el `422` con el campo señalado que la especificación exige.

*Por qué:* una restricción `CHECK` en SQLite daría un error de base de datos en bruto, no un error de validación con campo y regla, y el frontend ya sabe traducir lo segundo y no lo primero. La defensa que de verdad importa está en la única puerta de entrada.

*Trade-off asumido:* una escritura hecha por fuera de la aplicación podría dejar un valor imposible. Se acepta: hoy no hay ninguna vía así.

### El responsable viaja como un objeto reducido, no como el usuario entero

Cada tarea llega con su responsable como un objeto de dos campos: su identificador y su nombre completo, que puede venir vacío. Nada más.

*Por qué:* es exactamente el aviso que deja la historia `E3-1` para quien la implemente. Devolver el registro de usuario completo filtra correo y fechas de cuenta a una vista que no los usa, y en cuanto el cliente los consume ya no se recortan sin romperlo. Se reutiliza el patrón de transformers anidados que la librería ya soporta.

*Dónde se decide «Sin nombre»:* en el frontend. La API dice la verdad —el nombre está vacío— y la pantalla decide cómo se llama a eso. Mandar «Sin nombre» desde el servidor sería colar copia de interfaz en el contrato.

### El responsable se carga junto con la lista, en una sola consulta

La consulta de la lista trae los responsables precargados en el mismo viaje.

*Por qué:* sin eso, pintar la lista dispara una consulta por fila. Con el volumen que el PRD contempla es la diferencia entre una consulta y doscientas.

### Tres rutas, y el `404` sale de buscar la tarea

`GET /api/v1/tasks`, `POST /api/v1/tasks` y `PATCH /api/v1/tasks/:id`, las tres dentro de un grupo protegido por el mismo middleware de sesión que ya cubre el perfil, y referenciadas desde el mapa de controladores generado. Se elige `PATCH` porque la operación es explícitamente parcial: toca el estado y nada más.

El `404` de una tarea inexistente no se escribe a mano: sale de buscar la fila con la variante que falla si no existe, que el manejador de errores ya convierte en `404` en JSON.

### El control de estado se construye con los botones que ya hay

En cada fila, los tres estados se ofrecen como tres botones —el actual marcado—, montados sobre el componente de botón existente.

*Por qué:* es el único camino que cumple a la vez las tres condiciones del encargo: los tres destinos a la vista, un solo gesto sin diálogo, y cero dependencias nuevas. Un desplegable en condiciones exigiría traer el componente `select` de shadcn, que arrastra una dependencia nueva; y un `<select>` nativo cuesta dos interacciones y desentona con el resto de la interfaz.

*Trade-off:* tres botones por fila ocupan sitio. Con el ancho de una lista de escritorio caben; si en el futuro aprieta, el cambio queda contenido en un componente.

### El cambio de estado se pinta antes de que conteste el servidor

Al pulsar, la fila cambia en el acto; si la petición falla, vuelve al estado anterior y se explica el fallo.

*Por qué:* la especificación pide que el nuevo estado se refleje «de inmediato» y también que no se quede enseñando un estado falso si el cambio no llegó a aplicarse. Hacerlo optimista con vuelta atrás satisface las dos; esperar la respuesta satisface solo la segunda.

*Alternativa descartada:* volver a pedir la lista entera después de cada cambio. Parpadea, y con la ordenación sin decidir podría además reordenar las filas bajo el ratón.

### La pantalla gestiona su propio estado, sin librería de datos

La lista se pide al montar la pantalla y se guarda en el estado del componente. Crear añade la tarea devuelta a ese estado; cambiar el estado sustituye la fila afectada.

*Por qué:* es exactamente lo que ya hace el proveedor de sesión, no añade dependencias, y el alcance —una sola pantalla, sin refresco automático, sin caché compartida entre vistas— no justifica más.

### Nada se ordena en ninguna capa

Ni la consulta lleva orden explícito, ni la pantalla reordena lo que recibe.

*Por qué:* el orden de la lista es un punto abierto del PRD (PA-3) y el encargo es explícito en no decidirlo. Poner un orden «provisional» es decidirlo de facto: en cuanto alguien lo ve, se convierte en el comportamiento esperado.

*Consecuencia asumida y consciente:* el orden observado será el que devuelva la base de datos, y puede cambiar sin aviso. No debe construirse nada encima.

### El acceso a la lista se añade sin tocar la redirección por defecto

Se añade un enlace a la lista desde el perfil y otro de vuelta desde la lista. La ruta comodín sigue llevando al perfil.

*Por qué:* cambiar dónde aterriza la aplicación es una decisión de producto que nadie ha pedido, y modificaría comportamiento ya especificado del vertical de acceso.

## Risks / Trade-offs

- **Dos personas cambian el estado de la misma tarea a la vez** → gana la última escritura y la otra ve un dato viejo hasta que recargue. Es el `PA-8` del PRD, sin refresco automático en este alcance; no se mitiga aquí, se asume y queda anotado.
- **El orden sin decidir se convierte en contrato por costumbre** → alguien verá un orden estable en desarrollo y construirá encima. Mitigación: está escrito como requisito explícito en la especificación, no solo como nota.
- **Tres botones por fila no escalan a móvil ni a más estados** → el control queda aislado en un componente propio, para que cambiarlo por un desplegable el día que se pueda traer uno no toque la fila entera.
- **Que cualquiera pueda mover cualquier tarea hace muy barato marcar «Hecho» por error** → riesgo real que el PRD ya señala (`PA-7`), agravado porque no hay filtro por estado en este alcance para ir a buscarla. Mitigación parcial: las transiciones son libres, así que la vuelta atrás siempre existe.
- **El límite de 255 caracteres del título es una decisión de ingeniería, no de producto** → se ha fijado para que el criterio sea verificable. Si producto decide otro, es cambiar el validador y la columna.

## Migration Plan

Todo es aditivo: una tabla nueva, cuatro rutas nuevas y una pantalla nueva. Ninguna respuesta ni pantalla existente cambia de forma, así que no hay paso de compatibilidad ni ventana de despliegue coordinado.

La migración crea la tabla de tareas con su clave ajena al usuario responsable y regenera el esquema. Deshacerla es tirar la tabla; como no hay datos previos que transformar, la vuelta atrás es limpia.

## Open Questions

Ninguna que bloquee la implementación. Los puntos abiertos que quedan —el orden de la lista, cuántas tareas «En curso» caben por persona, y qué se ve cuando dos personas chocan— están en `proposal.md` y son decisiones de producto que este cambio deja deliberadamente sin tomar: ninguna de ellas altera la especificación, el enfoque ni el desglose de trabajo de este cambio.
