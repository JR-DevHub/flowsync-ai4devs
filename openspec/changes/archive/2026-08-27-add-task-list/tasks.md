> Este cambio **no lleva pruebas automatizadas**: no se monta base de pruebas ni se escribe ningún test. La verificación de cada tarea es una comprobación manual con `curl` o en pantalla, más los comandos de tipos y estilo que el repositorio ya tiene.

## 1. Modelo de datos

- [x] 1.1 Crear la migración de la tabla de tareas con título, estado (texto, por defecto `pending`), responsable como clave ajena obligatoria al usuario, y las marcas de tiempo de creación y modificación. Verificar que `node ace migration:run` la aplica sin error.
- [x] 1.2 Confirmar que `database/schema.ts` se ha regenerado con la clase de la tarea y commitear ese diff. Verificar que el fichero contiene las columnas nuevas y que **no** se ha editado a mano.
- [x] 1.3 Crear el modelo de tarea extendiendo la clase generada, sin declarar columnas, y declarar únicamente la relación con el usuario responsable. Verificar con `npm run typecheck` en `backend/`.

## 2. Contrato de la API

- [x] 2.1 Definir el repertorio de estados como una constante compartida con los tres identificadores `pending`, `in_progress` y `done`, y usarla como única fuente tanto para el validador como para el valor por defecto. Verificar que no queda ningún literal de estado suelto (`grep` por los tres valores).
- [x] 2.2 Escribir el validador de creación: el título como única entrada, recortando espacios de los extremos, con al menos un carácter y como mucho 255. Verificar con `curl` que un título vacío, uno de solo espacios y uno de 256 caracteres devuelven `422` señalando el campo del título.
- [x] 2.3 Escribir el validador de actualización: el estado como única entrada, restringido al repertorio. Verificar con `curl` que `pending`, `in_progress` y `done` pasan y que cualquier otro valor —incluido `Pendiente`— devuelve `422`.
- [x] 2.4 Escribir el transformer de la tarea, exponiendo identificador, título, estado y el responsable como objeto anidado reducido con solo su identificador y su nombre completo. Verificar con `curl` que la respuesta **no** trae el correo ni las fechas de cuenta del responsable, ni ningún campo de vencimiento.

## 3. Endpoints

- [x] 3.1 Implementar el listado: devuelve todas las tareas del espacio con el responsable precargado en la misma consulta, sin cláusula de orden. Verificar con `curl` que devuelve `200` con la lista completa, y revisar los registros de la consulta para confirmar que no hay una consulta por fila.
- [x] 3.2 Implementar la creación: toma solo el título validado, fija el estado en `pending` y el responsable en el usuario de la sesión, y responde `201` con la tarea creada. Verificar con `curl` que enviar además `status` o un responsable no altera el resultado.
- [x] 3.3 Implementar la actualización parcial del estado: busca la tarea fallando con `404` si no existe, aplica el estado y responde `200` con la tarea. Verificar con `curl` un cambio en una tarea ajena, una vuelta desde `done` a `pending`, y un identificador inexistente.
- [x] 3.4 Registrar las tres rutas bajo `/api/v1/tasks` dentro de un grupo protegido por el middleware de sesión, referenciando el controlador desde el mapa generado. Verificar con `node ace list:routes` que aparecen exactamente esas tres y con `curl` sin token que las tres responden `401`.
- [x] 3.5 Confirmar que no ha aparecido ninguna operación de más: ni lectura individual, ni borrado, ni listado de personas. Verificar con `node ace list:routes` que la tabla de rutas no tiene ninguna otra ruta de tareas.
- [x] 3.6 Arrancar el servidor para regenerar el registro tipado de `.adonisjs/` y commitear el diff. Verificar con `npm run typecheck`, `npm run lint` y `npm run format` en `backend/`.

## 4. Contacto del frontend con la API

- [x] 4.1 Añadir los tipos de la tarea, del responsable reducido y del repertorio de estados, reflejando exactamente lo que devuelve el transformer. Verificar con `npm run build` en `frontend/`.
- [x] 4.2 Añadir al único punto de contacto con la API las tres llamadas —listar, crear y cambiar de estado—, reutilizando el envoltorio existente para el token y el desenvuelto de `{ data }`. Verificar que ninguna llamada nueva aparece fuera de ese fichero.
- [x] 4.3 Extender la traducción de errores para que el rechazo del título por vacío o por longitud, y el del estado por valor no admitido, salgan en castellano y asociados a su campo. Verificar en pantalla forzando cada caso.

## 5. La lista en pantalla

- [x] 5.1 Crear el mapa único que traduce cada identificador de estado a su etiqueta —Pendiente, En curso, Hecho— y fija el orden en que se ofrecen. Verificar que no hay ninguna etiqueta castellana escrita fuera de ese mapa.
- [x] 5.2 Crear la pantalla de la lista, que pide las tareas al montarse y muestra el indicador de carga que ya se usa mientras llegan. Verificar en el navegador con sesión iniciada.
- [x] 5.3 Pintar cada tarea como una fila con su título, el nombre de su responsable y su estado, usando los componentes de interfaz que ya existen. Verificar que una tarea de otra persona se ve igual que una propia, y que no aparece ninguna fecha en ninguna fila.
- [x] 5.4 Mostrar «Sin nombre» cuando el responsable no tiene nombre completo. Verificar creando una tarea desde una cuenta sin nombre y comprobando que no se filtra ni su correo ni su identificador.
- [x] 5.5 Añadir el estado vacío: explicar qué es la lista e invitar a crear la primera tarea. Verificar entrando con la lista sin ninguna tarea.
- [x] 5.6 Registrar `/tasks` como ruta protegida siguiendo el mismo patrón que el perfil, sin tocar la redirección de la ruta comodín. Verificar que sin sesión lleva a la pantalla de inicio de sesión y que la ruta comodín sigue llevando al perfil.

## 6. Crear desde la lista

- [x] 6.1 Añadir a la pantalla el formulario de creación con un único campo de título, reutilizando los componentes de campo y botón existentes. Verificar recorriendo el flujo entero que no se ofrece ni se sugiere responsable, estado ni fecha.
- [x] 6.2 Insertar la tarea devuelta en la lista y vaciar el campo al terminar, sin recargar ni navegar. Verificar creando dos tareas seguidas.
- [x] 6.3 Indicar el envío en curso y bloquear el segundo envío mientras tanto. Verificar pulsando dos veces seguidas.
- [x] 6.4 Mostrar junto al campo el motivo del rechazo, conservando lo escrito. Verificar con el campo vacío, con solo espacios y con un título de más de 255 caracteres.

## 7. Cambiar el estado desde la fila

- [x] 7.1 Construir el control de estado como tres botones sobre el componente de botón existente, con el estado actual marcado y sin traer ninguna dependencia nueva. Verificar que `frontend/package.json` no ha cambiado.
- [x] 7.2 Aplicar el cambio de forma optimista: la fila muestra el estado nuevo al pulsar, sin diálogo ni formulario de por medio. Verificar que un solo clic basta y que no se abandona la lista.
- [x] 7.3 Deshacer el cambio en pantalla y explicar el fallo si el servidor lo rechaza o no responde. Verificar parando el backend y pulsando un estado.
- [x] 7.4 Comprobar que funciona igual sobre una tarea de otra persona, sin advertencias ni permisos. Verificar con dos cuentas distintas.

## 8. Cierre

- [ ] 8.1 Añadir el enlace a la lista desde el perfil y el de vuelta desde la lista. Verificar que se puede ir y volver sin escribir ninguna dirección a mano.
- [ ] 8.2 Repasar que no ha entrado nada fuera de alcance: ni fecha de vencimiento, ni borrado, ni lectura individual, ni vista de «mis tareas», ni filtros, ni orden explícito en ninguna capa. Verificar con `git diff` contra la especificación.
- [ ] 8.3 Pasar `npm run typecheck`, `npm run lint` y `npm run format` en `backend/`, y `npm run build`, `npm run lint` y `npm run format` en `frontend/`. Verificar que los seis terminan limpios.
