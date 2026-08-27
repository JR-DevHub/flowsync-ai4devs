## Why

FlowSync ya sabe quién eres, pero todavía no sabe en qué anda nadie: hoy la aplicación solo tiene registro, acceso y perfil. Sin una lista de tareas del equipo, el producto no responde la única pregunta para la que existe —«¿quién está en qué?»—, y ninguna de las historias de las épicas E2 y E3 tiene dónde apoyarse.

Este change da de alta esa base: una sola lista compartida, crear una tarea con solo el título, y mover el estado desde la propia fila.

## What Changes

Alcance completo, de la API a la pantalla, cubriendo cinco historias del backlog: `E3-1` (lista compartida), `E2-1` (crear con solo el título), `E2-2` (título obligatorio), `E2-3` (nace mía y pendiente) y `E2-4` (cambiar el estado desde la lista).

**API (AdonisJS, bajo `/api/v1`, toda con sesión iniciada):**

- Listar todas las tareas del espacio, con el nombre de su responsable ya resuelto.
- Crear una tarea. El único dato que se acepta es el título; el responsable es quien la crea y el estado es `pending`, ambos sin poder indicarse.
- Actualizar una tarea para moverla de estado. Es lo único que la actualización acepta.
- Exactamente tres operaciones: **no** hay lectura individual de una tarea, **no** hay borrado y **no** hay endpoints de equipo ni de usuarios.

**Estados:** conjunto cerrado de tres valores que viajan por la API como `pending`, `in_progress` y `done`. Cualquier otro valor se rechaza con `422`. Las transiciones son libres entre los tres, incluida la vuelta desde `done` (PA-7 sigue abierto en el PRD; se especifica lo permisivo por no inventar un grafo que ningún requisito declara).

**Interfaz (React 19):** una pantalla nueva de lista, protegida igual que el perfil, con:

- Una fila por tarea con su título, el **nombre** de su responsable y su estado. Si el responsable no tiene nombre puesto se pinta «Sin nombre»: nunca su correo ni su identificador.
- Los tres estados en castellano —Pendiente, En curso, Hecho— como etiquetas de presentación sobre los identificadores de la API.
- Un campo de título para crear, con la tarea nueva apareciendo en la lista sin recargar ni navegar.
- Un cambio de estado desde la propia fila, sin abrir nada, sin diálogo de confirmación y sin rellenar ningún campo.
- Un estado vacío que explica qué es la lista y ofrece crear la primera tarea, en lugar de una tabla vacía.

**Lo que este change deja fuera a propósito:**

- **Fecha de vencimiento.** La tarea no la tiene, la lista no muestra fechas ni marcas de vencida, y no se deja preparada.
- **Reasignar el responsable.** Ni la API ni la pantalla lo permiten todavía: la actualización solo mueve el estado.
- **Refresco automático.** La lista es correcta en el momento en que se pide; que se actualice sola cuando otro cambia algo es la historia `E3-2`.
- **Filtros, búsqueda, agrupación y vista «mis tareas».** No hay ninguna lente sobre la lista.
- **Señales de presencia.** Ni quién está conectado, ni actividad por persona.
- **Pruebas automatizadas.** Este change no monta base de pruebas ni escribe tests.

**Decisiones tomadas para poder especificar:**

- **Longitud máxima del título: 255 caracteres.** `PA-9` deja el umbral sin decidir y `E2-2/CA-3` exige avisar en lugar de recortar en silencio; se fija un límite concreto para que el criterio sea verificable. Pasarse devuelve `422` y la pantalla lo explica junto al campo.
- **Transiciones libres**, como se ha dicho arriba.

## Open Questions

- **En qué orden salen las tareas de la lista (PA-3).** Sigue sin decidir, y este change **no lo decide**: no se especifica ningún criterio de ordenación ni se ordena explícitamente. El orden que se observe es el que devuelva la base de datos, y no debe darse por contrato ni construirse encima de él. Es la ausencia que más condiciona si la lista responde su propia pregunta cuando crezca, y merece una historia propia antes de que haya volumen.
- **Cuántas tareas «En curso» puede acumular una persona (PA-4).** Nada lo limita.
- **Qué ve alguien cuando la tarea que mira cambia bajo sus pies (PA-8).** Sin refresco automático, el choque se manifiesta como datos viejos en pantalla hasta la siguiente carga.

## Capabilities

### New Capabilities

- `tasks`: la lista compartida de tareas del equipo — crearlas con solo un título, verlas todas con responsable y estado, y moverlas entre los tres estados fijos.

### Modified Capabilities

Ninguna. La capability `auth` se apoya tal cual está: las operaciones de tareas exigen sesión iniciada y usan la identidad que `auth` ya establece, pero ningún requisito suyo cambia.

## Impact

- **Backend:** modelo de tarea nuevo y su migración; relación con el usuario ya existente; controlador, validadores y transformer nuevos; cuatro rutas nuevas bajo `/api/v1` protegidas por el middleware de sesión que ya se usa en el perfil. El esquema se regenera desde la migración, no se escribe a mano.
- **Frontend:** una página nueva y su ruta protegida, siguiendo el patrón que ya usan las pantallas de acceso y de perfil; las llamadas nuevas se añaden al único punto de contacto con la API que ya existe. Se reutilizan los componentes de interfaz ya presentes.
- **Dependencias:** ninguna nueva, ni en el backend ni en el frontend. No se introduce ningún sistema de diseño.
- **Compatibilidad:** todo es aditivo. Ninguna respuesta ni pantalla existente cambia de forma.
