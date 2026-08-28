# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) dibujado como un flowchart de Mermaid. Muestra las tres piezas que se ejecutan por separado —la SPA de React en el navegador, la API de AdonisJS en `localhost:3333` y el fichero SQLite que le sirve de almacén— y, dentro de cada una, los bloques que hoy existen en el repositorio: las rutas y middlewares de `start/`, los controladores, los validadores de VineJS, los transformers que envuelven toda respuesta en `{ data }`, los modelos de Lucid sobre el esquema generado, y en el frontend el enrutado con sus guards, las pantallas y el único cliente HTTP (`src/lib/api.ts`). Las flechas etiquetan el protocolo real y los endpoints que se llaman de verdad. Todo lo dibujado está verificado leyendo el código: no aparecen colas, caches, servicios externos ni despliegue en producción porque en este repositorio no existen.

```mermaid
flowchart TB
  user(["Miembro del equipo — Persona<br/>Crea tareas, las filtra, cambia su estado<br/>y les pone fecha de vencimiento"])

  subgraph browser["Navegador"]
    direction TB

    subgraph spa["Contenedor: SPA FlowSync — React 19 + Vite 8 + Tailwind 4 — puerto 5173"]
      direction TB
      routes["Enrutado<br/>routes/app-routes.tsx<br/>guards protected-route y public-only-route<br/>/login /register /tasks /tasks/:id /profile"]
      pages["Pantallas<br/>pages/: login, register, tasks, task, profile<br/>components/: task-item, task-filter, field-error,<br/>auth-layout, full-screen-loader y ui/ de shadcn"]
      authctx["Sesión en cliente<br/>auth/auth-provider.tsx, use-auth, use-auth-form<br/>guarda el token y lo rehidrata al arrancar<br/>contra GET /account/profile"]
      apiclient["Cliente HTTP<br/>lib/api.ts y lib/types.ts<br/>único punto de contacto con la API: fetch,<br/>quita el envoltorio data, pone el Bearer<br/>y traduce los errores a ApiError"]
      routes --> pages
      pages --> authctx
      authctx --> apiclient
      pages --> apiclient
    end

    storage[("localStorage<br/>clave flowsync.token")]
  end

  subgraph server["Contenedor: API FlowSync — AdonisJS 7 + TypeScript 6 — puerto 3333"]
    direction TB
    router["Rutas y middlewares<br/>start/routes.ts con prefijo /api/v1<br/>start/kernel.ts: force_json_response, cors,<br/>bodyparser, session, shield, silent_auth<br/>y el middleware auth sobre account/ y tasks/"]

    subgraph ctrls["Controladores — app/controllers/"]
      direction LR
      cAuth["NewAccountController.store<br/>AccessTokensController.store y .destroy"]
      cProfile["ProfileController.show"]
      cTasks["TasksController.index, .show, .store<br/>TaskStatusesController.update<br/>TaskDueDatesController.update"]
    end

    validators["Validadores — app/validators/ — VineJS 4<br/>user.ts: signup y login<br/>task.ts: crear, listar, estado, día de<br/>referencia y fecha de vencimiento"]
    transformers["Transformers y serializer<br/>app/transformers/: User, Task, TaskDetail, TaskAssignee<br/>providers/api_provider.ts envuelve todo en data"]

    subgraph domain["Modelos — app/models/"]
      direction LR
      mUser["User<br/>withAuthFinder y DbAccessTokensProvider<br/>getter initials"]
      mTask["Task<br/>belongsTo assignee, isOverdueOn,<br/>TASK_STATUSES y DEFAULT_LIST_STATUSES"]
    end

    orm["Capa de datos — Lucid 22<br/>database/schema.ts autogenerado desde<br/>database/migrations/ — driver better-sqlite3"]

    router --> ctrls
    ctrls --> validators
    ctrls --> domain
    ctrls --> transformers
    domain --> orm
  end

  db[("Contenedor: base de datos — SQLite<br/>backend/tmp/db.sqlite3<br/>tablas users, auth_access_tokens y tasks")]

  user -->|"usa, HTTP en el navegador"| spa
  authctx -->|"lee y escribe el token"| storage
  apiclient -->|"JSON sobre HTTP con Authorization Bearer<br/>POST /api/v1/auth/signup y /auth/login<br/>GET /api/v1/account/profile y POST /account/logout<br/>GET y POST /api/v1/tasks, GET /tasks/:id<br/>PATCH /tasks/:id/status, PUT /tasks/:id/due-date"| router
  orm -->|"SQL"| db
```
