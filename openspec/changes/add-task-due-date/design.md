## Context

Ver `proposal.md` — Why. El vertical de tareas ya está construido de punta a punta y este cambio se mete dentro de él: tabla, modelo sin columnas declaradas, validadores VineJS, transformers, tres rutas bajo `/api/v1/tasks` y una pantalla de lista con el estado editable desde la fila.

Dos cosas del estado actual condicionan el diseño más que ninguna otra:

- **El veredicto de vencimiento depende de quién y cuándo mira.** No es un atributo de la tarea, es el resultado de comparar su fecha con un día que cambia solo. Eso descarta guardarlo y obliga a que el día de referencia entre por la petición.
- **La regla no puede vivir en dos sitios.** Si el cliente la reimplementa para pintar más rápido, la primera vez que difieran —un huso, un cambio de día, una tarea que pasa a hecha— nadie sabrá cuál de las dos miente.

## Goals / Non-Goals

**Goals:**

- Que la regla de vencimiento exista una sola vez, en el dominio, y que todas las capas la consuman ya resuelta.
- Que el día de referencia sea explícito en la petición y no un supuesto escondido en el servidor.
- Que poner, cambiar y quitar la fecha sean la misma operación, y que quitarla no sea un caso especial ni un error.
- Que el detalle de una tarea nazca corto a propósito y no se convierta en el cajón de sastre de todo lo que una tarea podría enseñar.

**Non-Goals:**

- No se monta base de pruebas ni se escriben tests, así que los criterios de prueba de `FS-118.2`, `FS-118.3` y `FS-118.5` quedan sin cubrir.
- No se toca la lista más allá de convertir el título de cada fila en enlace.
- No se traen dependencias nuevas, tampoco un componente de calendario.

## Decisions

### La regla vive en el modelo y recibe el día como argumento

Una única función del dominio decide si una tarea está vencida, tomando el día de referencia como parámetro explícito: sin fecha, no; en `done`, no; fecha anterior al día dado, sí.

*Por qué el día entra como argumento y no se lee dentro:* una función que consulta el reloj por su cuenta no se puede interrogar por dos días distintos, que es justo lo que `CA-19` exige y lo que `CA-20` obliga a poder comprobar. Pasarlo por fuera hace la regla determinista.

*Alternativa descartada:* una propiedad calculada del modelo sin argumentos, resuelta contra el día del servidor. Más cómoda de llamar y directamente incompatible con `CA-19`.

### El día de referencia viaja como parámetro de consulta en las cuatro operaciones

Las peticiones aceptan `?today=AAAA-MM-DD`. Si no viene, el servidor usa el suyo. Un valor con formato inválido se rechaza con `422`.

*Por qué el día y no el huso:* mandar `Europe/Madrid` es más expresivo, pero mete la base de datos de husos en el camino y no aporta nada aquí — el servidor no necesita saber dónde está nadie, solo qué día es para quien pregunta. El navegador ya sabe su día sin ayuda.

*Por qué en las cuatro y no solo en las lecturas:* crear y actualizar también devuelven una tarea, y esa respuesta lleva el veredicto. Sin el día, la tarea que acabas de guardar volvería resuelta contra un día que no es el tuyo.

*Trade-off asumido:* un cliente puede mentir sobre su día y verse tareas vencidas que no lo están. No hay nada que proteger: el engaño solo afecta a su propia lectura y no cambia ningún dato.

### El transformer recibe el día, no lo averigua

El día de referencia se le pasa al transformer al construirlo, y este llama a la regla del dominio para rellenar el veredicto.

*Por qué:* es el único punto por el que sale una tarea hacia el cliente, así que es donde el veredicto tiene que aparecer, y hacerlo ahí garantiza que las cuatro operaciones lo devuelvan sin repetir nada. La clase base ya admite argumentos extra en el constructor, así que no hay que inventar ningún canal.

### Quitar la fecha se distingue de no tocarla en el propio esquema de validación

El campo se declara a la vez anulable y opcional, de modo que la validación devuelve tres resultados distinguibles: ausente (no se toca), vacío (se retira la fecha) y una fecha (se fija).

*Por qué:* es la diferencia entre `PATCH` que respeta lo que no menciona y un `PATCH` que borra por omisión. Sin esa distinción, `CA-3` y el resto de actualizaciones parciales se pisan.

### La actualización exige al menos uno de los dos campos

Un cuerpo sin estado y sin fecha se rechaza con `422`, en el mismo formato de error que produce el resto de la API.

*Por qué:* un `PATCH` que no pide nada casi siempre es un cliente equivocado —un nombre de campo mal escrito, un formulario que no envió lo que creía—, y responder `200` a eso esconde el fallo justo donde más cuesta encontrarlo. La comprobación de la pareja va donde el validador no llega, pero levantando la misma excepción de validación del framework para que el cliente no distinga su origen.

### La fecha se guarda como día de calendario, sin hora

La columna es de tipo fecha y anulable, y el modelo la trata como día, no como instante.

*Por qué:* la regla compara días. En cuanto un instante entra en la ecuación aparece el fallo clásico de `CA-5`, donde una tarea que vence hoy se ve vencida porque su medianoche ya pasó.

### El cambio de fecha no se pinta de forma optimista

Al contrario que el cambio de estado en la lista, la pantalla de la tarea envía la fecha, espera la respuesta y pinta lo que el servidor devuelva.

*Por qué:* adelantar el resultado exigiría saber si la tarea queda vencida, y eso es la regla — que por decisión no vive en el cliente. Sería reimplementarla para ahorrar unos milisegundos. Se indica que está guardando y se pinta la verdad cuando llega.

*Consecuencia asumida:* poner una fecha tiene un instante de espera que cambiar de estado no tiene. Es el precio de no duplicar la regla, y es coherente con que el veredicto sea del servidor.

### El detalle es una pantalla propia y deliberadamente corta

Una ruta nueva por tarea, protegida como el resto, con lo que la historia necesita: título, responsable, estado, fecha y la señal de vencida. El único cambio en la lista es que el título pasa a ser un enlace.

*Por qué una pantalla y no un panel desplegable en la lista:* la lista tiene la instrucción de no cambiar lo que muestra, y un panel que se abre dentro cambia lo que ofrece. Además una dirección propia por tarea es lo que hace que «abrir una tarea» se pueda compartir y recargar.

*Punto abierto que esto deja:* qué es de verdad el detalle de una tarea sigue sin decidir (`PA-6`). Esta pantalla es la superficie mínima de `FS-118`, no esa decisión, y conviene tomarla antes de que crezca a base de añadidos.

### El campo de fecha es el nativo del navegador

Un campo de fecha estándar, estilado con el componente de campo que ya existe.

*Por qué:* trae calendario, teclado y accesibilidad ya resueltos por el navegador, y cumple `FS-118.4` sin dependencias. Traer el calendario de la librería de componentes arrastraría dos paquetes nuevos.

*Trade-off:* el aspecto del selector lo pone cada navegador y no será idéntico en todos. A cambio, el comportamiento es el que la gente ya conoce.

### La señal de vencida no es solo color

El aviso se escribe con palabras, además de con el color que le corresponda.

*Por qué:* `CA-4` exige que la condición sea evidente sin cálculo mental, y `FS-118.4` pide que no dependa del color. Un texto explícito cumple las dos y además funciona leído en voz alta.

## Risks / Trade-offs

- **El fallo del día de más en `CA-5`** → es el error más probable de toda la historia y no se manifiesta hasta que alguien mira su tarea el día que vence. Mitigación: comparar días de calendario, nunca instantes, y que la regla reciba el día como dato para poder interrogarla por los cuatro bordes.
- **SQLite no tiene un tipo fecha de verdad** → el esquema se genera escaneando la base, y una columna de fecha puede acabar generada como texto o como instante. Mitigación: comprobar qué produce el generador en cuanto la migración corra y, si no es lo que hace falta, fijarlo en las reglas de generación del proyecto, que existen exactamente para esto.
- **Volver de «hecho» reactiva el vencimiento** → es la consecuencia coherente de calcular el veredicto en cada lectura, pero `PA-7` no lo ha decidido y podría querer otra cosa. Queda anotado, no resuelto.
- **Autoguardado y fecha inválida se rozan** → `CA-16` guarda sin botón y `CA-14` exige conservar el valor anterior ante una fecha imposible. El campo nativo no da por buena una fecha incompleta, así que no llega a dispararse el guardado a medias; aun así el rechazo del servidor tiene que dejar el campo como estaba.
- **La respuesta gana dos campos** → aditivo, ningún cliente existente se rompe. Pero la lista ahora recibe una fecha que tiene prohibido pintar: el criterio negativo `CA-11` deja de estar garantizado por la ausencia del dato y pasa a depender de que nadie lo use.

## Migration Plan

La migración añade una columna anulable sobre una tabla que ya tiene filas: las tareas existentes quedan sin fecha y, por la regla, nunca vencidas. Deshacerla es quitar la columna, y como ningún dato previo se transforma, la vuelta atrás es limpia.

El resto es aditivo: una ruta nueva, una pantalla nueva y dos campos más en una respuesta que ya existía.

## Open Questions

Ninguna que bloquee la implementación. Los puntos abiertos que quedan —la vuelta desde «hecho» con la fecha pasada, el choque de dos personas editando, y qué será el detalle de una tarea— están en `proposal.md` y son decisiones de producto que este cambio deja deliberadamente sin tomar.
