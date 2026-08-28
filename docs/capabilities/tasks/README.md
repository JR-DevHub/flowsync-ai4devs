# Capability `tasks`

La lista de trabajo compartida del equipo: **una sola lista** para todo el espacio, donde apuntar algo cuesta escribir un título y donde el responsable y el estado de cada tarea se leen sin abrir nada. Cada tarea puede además tener una fecha de vencimiento, que se pone y se quita desde su pantalla propia.

**Las reglas de esta capability no se escriben aquí.** Viven, con sus requisitos y sus scenarios, en [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md) — 32 requisitos y 124 scenarios. Este README dice **dónde está cada cosa** y **cómo ejercerla en local**; para saber *qué debe hacer* el sistema, se sigue el enlace. Si algo de aquí contradice a la spec, manda la spec.

## Dónde vive el código

**Backend** (`backend/`)

| Fichero | Qué contiene |
|---|---|
| [`start/routes.ts`](../../../backend/start/routes.ts) | Las cinco rutas, bajo `/api/v1/tasks` y con `middleware.auth()` sobre el grupo |
| [`app/models/task.ts`](../../../backend/app/models/task.ts) | `TASK_STATUSES`, `DEFAULT_LIST_STATUSES`, la relación con el responsable y `isOverdueOn()` |
| [`app/validators/task.ts`](../../../backend/app/validators/task.ts) | Los cinco validadores de entrada y `toCalendarDay()` |
| [`app/controllers/tasks_controller.ts`](../../../backend/app/controllers/tasks_controller.ts) | `index` (lista), `show` (tarea suelta), `store` (crear) |
| [`app/controllers/task_statuses_controller.ts`](../../../backend/app/controllers/task_statuses_controller.ts) | `update` — el cambio de estado |
| [`app/controllers/task_due_dates_controller.ts`](../../../backend/app/controllers/task_due_dates_controller.ts) | `update` — fijar, cambiar y retirar la fecha |
| [`app/transformers/`](../../../backend/app/transformers/) | `TaskTransformer` (lista), `TaskDetailTransformer` (detalle), `TaskAssigneeTransformer` (responsable) |
| [`app/openapi/schemas.ts`](../../../backend/app/openapi/schemas.ts) | Los esquemas que publica el documento OpenAPI |
| [`database/migrations/`](../../../backend/database/migrations/) | `…_create_tasks_table.ts` y `…_add_due_date_to_tasks_table.ts` |

El esquema de la tabla no se escribe: `database/schema.ts` se regenera desde las migraciones al correr `node ace migration:run`.

**Frontend** (`frontend/src/`)

| Fichero | Qué contiene |
|---|---|
| [`lib/api.ts`](../../../frontend/src/lib/api.ts) | `listTasks`, `createTask`, `getTask`, `updateTaskStatus`, `setTaskDueDate` — único punto de contacto con la API |
| [`lib/types.ts`](../../../frontend/src/lib/types.ts) | `Task`, `TaskDetail`, `TaskAssignee` y el espejo de `DEFAULT_LIST_STATUSES` |
| [`pages/tasks-page.tsx`](../../../frontend/src/pages/tasks-page.tsx) | La lista: alta, filtro, cambio de estado y los cuatro finales de una lista sin filas |
| [`pages/task-page.tsx`](../../../frontend/src/pages/task-page.tsx) | La pantalla de una tarea: fecha de vencimiento y señal de vencida |
| [`components/task-item.tsx`](../../../frontend/src/components/task-item.tsx) · [`task-filter.tsx`](../../../frontend/src/components/task-filter.tsx) | La fila de la lista y el control para acotar por estado |

## Endpoints

Todos cuelgan de `/api/v1`, exigen `Authorization: Bearer <token>` y responden envueltos en `{ "data": ... }`.

| Método | Ruta | Controlador | Entrada | Devuelve |
|---|---|---|---|---|
| `GET` | `/tasks` | `TasksController.index` | `?status=` opcional | Colección con la forma de `TaskTransformer` — **sin** fecha ni condición de vencida |
| `POST` | `/tasks` | `TasksController.store` | `{ "title": "…" }` | `201` con la tarea creada |
| `GET` | `/tasks/:id` | `TasksController.show` | `?today=AAAA-MM-DD` **obligatorio** | La tarea con `dueDate` e `isOverdue` (`TaskDetailTransformer`) |
| `PATCH` | `/tasks/:id/status` | `TaskStatusesController.update` | `{ "status": "…" }` | La tarea ya en el nuevo estado |
| `PUT` | `/tasks/:id/due-date` | `TaskDueDatesController.update` | `{ "dueDate": "AAAA-MM-DD" \| null, "today": "AAAA-MM-DD" }` | La tarea con la fecha y el vencimiento recalculados |

El contrato completo —códigos de error, esquemas, campos nulables— lo publica el documento OpenAPI, que se genera desde los decoradores de los propios controladores: `http://localhost:3333/api` con el servidor arrancado.

## Reglas de negocio: dónde está cada requisito

La columna de la izquierda enlaza al requisito en la spec, que es donde está escrito **qué** debe pasar. Las otras dos dicen dónde se cumple y qué lo sujeta.

### La API

| Requisito | Implementado en | Cubierto por |
|---|---|---|
| [Creación de una tarea con solo el título](../../../openspec/specs/tasks/spec.md#requirement-creación-de-una-tarea-con-solo-el-título) | `tasks_controller.ts` → `store` | — |
| [Ninguna tarea sin título](../../../openspec/specs/tasks/spec.md#requirement-ninguna-tarea-sin-título) | `createTaskValidator` (`trim` antes de `minLength`) | — |
| [Aviso ante un título demasiado largo](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-un-título-demasiado-largo) | `createTaskValidator` (`maxLength(200)`) | — |
| [Una sola lista compartida del espacio](../../../openspec/specs/tasks/spec.md#requirement-una-sola-lista-compartida-del-espacio) | `tasks_controller.ts` → `index` | `tasks/status_filter.spec.ts` (parcial) |
| [Lo que cada tarea muestra de su responsable](../../../openspec/specs/tasks/spec.md#requirement-lo-que-cada-tarea-muestra-de-su-responsable) | `TaskAssigneeTransformer` | `tasks/assignee.spec.ts` (los 3 scenarios) |
| [Tres estados fijos](../../../openspec/specs/tasks/spec.md#requirement-tres-estados-fijos) | `TASK_STATUSES` en `models/task.ts` | `unit/openapi/schemas.spec.ts` (que no se desvíen) |
| [Cambio de estado de cualquier tarea](../../../openspec/specs/tasks/spec.md#requirement-cambio-de-estado-de-cualquier-tarea) | `task_statuses_controller.ts` | `tasks/status_filter.spec.ts` (parcial) |
| [Las tareas exigen sesión](../../../openspec/specs/tasks/spec.md#requirement-las-tareas-exigen-sesión) | `middleware.auth()` sobre el grupo, en `routes.ts` | — |
| [Acotar la lista por estado](../../../openspec/specs/tasks/spec.md#requirement-acotar-la-lista-por-estado) | `listTasksValidator` + `index` | `tasks/status_filter.spec.ts` |
| [Un filtro válido sin resultados es una lista vacía legítima](../../../openspec/specs/tasks/spec.md#requirement-un-filtro-válido-sin-resultados-es-una-lista-vacía-legítima) | `index` (rama con `status`) | `tasks/status_filter.spec.ts` |
| [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío) | `listTasksValidator` (`vine.enum`, no `vine.string`) | `tasks/status_filter.spec.ts` |
| [Fecha de vencimiento opcional](../../../openspec/specs/tasks/spec.md#requirement-fecha-de-vencimiento-opcional) | Columna nulable + `TaskDetailTransformer` | — |
| [Fijar, cambiar y retirar la fecha de vencimiento](../../../openspec/specs/tasks/spec.md#requirement-fijar-cambiar-y-retirar-la-fecha-de-vencimiento) | `task_due_dates_controller.ts` | — |
| [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida) | `Task.isOverdueOn()` — **la única definición del sistema** | — |
| [El día de referencia lo pone quien mira](../../../openspec/specs/tasks/spec.md#requirement-el-día-de-referencia-lo-pone-quien-mira) | `taskReferenceDayValidator` y `setTaskDueDateValidator` (sin valor por defecto) | — |
| [Consulta de una tarea suelta](../../../openspec/specs/tasks/spec.md#requirement-consulta-de-una-tarea-suelta) | `tasks_controller.ts` → `show` | `tasks/assignee.spec.ts` (parcial) |
| [La lista no lleva el vencimiento](../../../openspec/specs/tasks/spec.md#requirement-la-lista-no-lleva-el-vencimiento) | Que `TaskTransformer` y `TaskDetailTransformer` sean dos clases distintas | — |

### La interfaz

Ningún requisito de interfaz tiene cobertura automática: `frontend/` no tiene runner de tests instalado.

| Requisito | Implementado en |
|---|---|
| [Pantalla de la lista del equipo](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-la-lista-del-equipo) · [El espacio sin tareas](../../../openspec/specs/tasks/spec.md#requirement-el-espacio-sin-tareas) · [Una lista sin filas no significa siempre lo mismo](../../../openspec/specs/tasks/spec.md#requirement-una-lista-sin-filas-no-significa-siempre-lo-mismo) | `pages/tasks-page.tsx` |
| [Crear una tarea desde la lista](../../../openspec/specs/tasks/spec.md#requirement-crear-una-tarea-desde-la-lista) · [Aviso al intentar crear sin un título válido](../../../openspec/specs/tasks/spec.md#requirement-aviso-al-intentar-crear-sin-un-título-válido) | `pages/tasks-page.tsx` + `components/field-error.tsx` |
| [Cambiar el estado desde la propia fila](../../../openspec/specs/tasks/spec.md#requirement-cambiar-el-estado-desde-la-propia-fila) · [Lo que sale de la vista no se pierde](../../../openspec/specs/tasks/spec.md#requirement-lo-que-sale-de-la-vista-no-se-pierde) | `components/task-item.tsx` |
| [El control para acotar la lista](../../../openspec/specs/tasks/spec.md#requirement-el-control-para-acotar-la-lista) · [El filtro se pide en la dirección de la lista](../../../openspec/specs/tasks/spec.md#requirement-el-filtro-se-pide-en-la-dirección-de-la-lista) | `components/task-filter.tsx` + `useSearchParams` en `tasks-page.tsx` |
| [Pantalla de una tarea](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-una-tarea) · [Poner y quitar la fecha desde la pantalla de la tarea](../../../openspec/specs/tasks/spec.md#requirement-poner-y-quitar-la-fecha-desde-la-pantalla-de-la-tarea) · [Aviso ante una fecha que no vale](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-una-fecha-que-no-vale) · [La señal de tarea vencida](../../../openspec/specs/tasks/spec.md#requirement-la-señal-de-tarea-vencida) | `pages/task-page.tsx` |
| [Una sola vista de tareas, sin señales de presencia](../../../openspec/specs/tasks/spec.md#requirement-una-sola-vista-de-tareas-sin-señales-de-presencia) · [No tener fecha no se penaliza](../../../openspec/specs/tasks/spec.md#requirement-no-tener-fecha-no-se-penaliza) | Requisitos de que algo **no** exista: se cumplen por ausencia, en `routes/app-routes.tsx` y en las dos pantallas |

## Cómo se prueba en local

### Arrancar

```bash
cd backend
npm install
cp .env.example .env && node ace generate:key   # solo la primera vez
node ace migration:run                          # crea tmp/db.sqlite3 y regenera database/schema.ts
npm run dev                                     # http://localhost:3333
```

```bash
cd frontend
npm install
npm run dev                                     # http://localhost:5173
```

O las dos a la vez con `make start` desde la raíz.

### Tests

```bash
cd backend
npm test                                        # las dos suites
node ace test functional --files=status_filter  # un fichero
node ace test --tests="un estado inventado se rechaza con 422 sobre el campo"
```

Hoy cubren `auth` entera y, de `tasks`, el responsable, el filtro por estado y la coherencia del enum documentado. El resto de la capability se verifica a mano.

> **Cuidado con la base de datos.** `config/database.ts` declara una sola conexión SQLite, sin override por entorno, así que la suite `functional` escribe en **el mismo fichero** que el servidor de desarrollo (`backend/tmp/db.sqlite3`). Los tests se aíslan con `testUtils.db().withGlobalTransaction()`, pero las filas que ya existan siguen siendo visibles: no escribas tests que afirmen cuántas tareas hay en el espacio.

El frontend no tiene runner de tests. Su comprobación automática es `npm run build`, que hace el typecheck, y `npm run lint` (oxlint, no eslint).

### A mano, contra la API

```bash
# 1. Una cuenta y su token
TOKEN=$(curl -s -X POST http://localhost:3333/api/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"password123","passwordConfirmation":"password123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# 2. Crear una tarea → 201
curl -s -X POST http://localhost:3333/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Revisar el informe"}'

# 3. La lista, y la lista acotada
curl -s "http://localhost:3333/api/v1/tasks" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3333/api/v1/tasks?status=done" -H "Authorization: Bearer $TOKEN"

# 4. Los dos caminos que nunca deben confundirse
curl -s "http://localhost:3333/api/v1/tasks?status=archivado" -H "Authorization: Bearer $TOKEN"    # 422
curl -s "http://localhost:3333/api/v1/tasks?status=in_progress" -H "Authorization: Bearer $TOKEN"  # 200 y lista vacía

# 5. La tarea suelta exige el día de referencia
curl -s "http://localhost:3333/api/v1/tasks/1"                   -H "Authorization: Bearer $TOKEN"  # 422
curl -s "http://localhost:3333/api/v1/tasks/1?today=2026-08-28"  -H "Authorization: Bearer $TOKEN"  # 200

# 6. Poner y retirar la fecha
curl -s -X PUT http://localhost:3333/api/v1/tasks/1/due-date \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"dueDate":"2026-09-30","today":"2026-08-28"}'
curl -s -X PUT http://localhost:3333/api/v1/tasks/1/due-date \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"dueDate":null,"today":"2026-08-28"}'
```

Para probar el vencimiento no hay que esperar a mañana ni tocar el reloj: `today` es un parámetro, así que basta con mandar dos días distintos sobre la misma tarea.

Lo que se escriba por aquí cae en la base de desarrollo y se queda. Para dejarla limpia: `node ace migration:fresh`.

### Desde el navegador

- La aplicación, en `http://localhost:5173/tasks`. El filtro va en la URL (`?status=done`), así que las cuatro vistas —y el estado inventado— se alcanzan escribiendo la dirección.
- La documentación de la API, en `http://localhost:3333/api`, con el documento en `/api.json` y `/api.yaml`.

## Ver también

- [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md) — los requisitos y sus scenarios
- [`openspec/changes/archive/`](../../../openspec/changes/archive/) — los tres cambios que construyeron esta capability, con el `design.md` donde está el porqué de cada decisión
- [`docs/architecture.md`](../../architecture.md) — el diagrama de contenedores del sistema
- [`docs/adr/`](../../adr/) — las decisiones de arquitectura y su estado
