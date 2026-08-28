# 1. Las delta-specs de OpenSpec son la fuente de verdad viva del producto

## Contexto

FlowSync tiene hoy cuatro sitios distintos que dicen qué debe hacer el producto, y no dicen lo mismo ni sirven para lo mismo:

- **`docs/prd/`** — el PRD del MVP y el alcance consensuado. Es la intención inicial, escrita antes de existir el código.
- **`docs/backlog/`** — doce historias con sus criterios de aceptación (`CA-n`) y, en dos de ellas, sus tickets con Definition of Done. Es lo que se pidió, historia a historia.
- **Jira (proyecto FLOW)** — el tablero. `docs/backlog/README.md` ya zanja su papel: «El tablero es seguimiento del trabajo […] Si los dos se contradicen, manda el repositorio».
- **`openspec/specs/`** — dos capabilities, `auth` (19 requisitos, 45 scenarios) y `tasks` (32 requisitos, 124 scenarios), escritas en formato requisito + scenarios con `SHALL` / `WHEN` / `THEN`.

Lo que faltaba por decidir es cuál de los tres artefactos del repositorio manda cuando alguien —persona o agente— pregunta **qué hace el sistema ahora mismo**. El PRD y el backlog responden a otra pregunta: qué se quiso. Envejecen a propósito, porque son el registro de una conversación que ya ocurrió, y no se actualizan cuando el código cambia.

OpenSpec ya está en uso: en esta rama entra con `5b5cd0a` (2026-08-13), que trae a la vez el código de la capability y sus specs. La mecánica es esta:

- Un cambio nace como carpeta en `openspec/changes/<nombre>/` con cuatro artefactos: `proposal.md` (por qué y qué cambia, incluido lo que queda **fuera de alcance a propósito**), `design.md` (las decisiones, con las alternativas descartadas y sus trade-offs), `tasks.md` (la lista de trabajo) y una o varias **delta-specs** en `specs/<capability>/spec.md`.
- La delta-spec no es una copia de la spec: declara solo lo que cambia, bajo cabeceras `## ADDED Requirements` y `## MODIFIED Requirements`. Los tres cambios archivados usan ambas; ninguno ha necesitado todavía una `REMOVED`.
- Al archivar, la delta se **funde** en la spec viva de esa capability y el cambio se mueve a `openspec/changes/archive/<fecha>-<nombre>/`. La fusión la hace un agente editando la spec, no un parche mecánico: la skill `openspec-sync-specs` la describe como «agent-driven».
- Hay tres cambios archivados, todos de `2026-08-13`: `add-task-list` (18 requisitos, el único que toca dos capabilities, porque la lista obligó a cambiar los destinos de navegación de `auth`), `add-task-status-filter` (11) y `add-task-due-date` (12).
- El tooling son la CLI `openspec` (hoy 1.10.0, instalada global) y siete skills `openspec-*` con sus comandos `/opsx:*`.

Dos hechos del historial pesan más que la mecánica, y son la razón de que esto haya que decidirlo en vez de darlo por supuesto:

1. **La spec viva ya se ha quedado atrás una vez.** El `proposal.md` de `add-task-due-date` anota, bajo el epígrafe «Deriva conocida de la spec viva», que el requisito *Una sola lista compartida del espacio* seguía afirmando que la lista devolvía todas las tareas del espacio cuando eso había dejado de ser cierto al implementarse el filtro por estado. Se corrigió después, con un cambio escrito a posteriori.
2. **Ese cambio correctivo, `add-task-status-filter`, documenta código ya escrito.** Su propio `proposal.md` lo dice: «Este change documenta comportamiento que ya está implementado y funcionando en el repositorio», y su `tasks.md` abre avisando de que la lista de tareas «es el registro de lo que se hizo, no un plan de trabajo».

El historial de esta rama lo confirma: `add-task-status-filter` **nace ya archivado**, en el mismo commit (`2de0f39`) que funde sus 476 líneas en la spec viva, y sobre código que había entrado en el commit anterior. La práctica existe, pero no está escrita, y por eso se ha aplicado de forma desigual.

## Decisión

**`openspec/specs/` es la fuente de verdad viva de qué hace y qué debe hacer FlowSync.** Cuando cualquier otro documento del repositorio la contradiga, manda la spec viva.

En concreto:

- **Todo cambio de comportamiento entra por una delta-spec.** Antes de tocar código se escribe el cambio en `openspec/changes/`, con su delta declarando `ADDED` / `MODIFIED` / `REMOVED` sobre los requisitos existentes. Al terminar, se archiva y se funde en la spec viva. El código y su delta viajan en la misma unidad de trabajo.
- **Romper un requisito existente obliga a declararlo.** Ese es el punto del formato: `add-task-status-filter` no pudo limitarse a añadir el filtro, tuvo que modificar explícitamente *Una sola lista compartida del espacio*, que su propio cambio volvía falso.
- **Los scenarios son el contrato verificable.** Son la unidad que se cita en los tests (`tests/functional/tasks/assignee.spec.ts` cubre los tres scenarios de *Lo que cada tarea muestra de su responsable*) y contra la que se contrasta cualquier otro artefacto derivado, como el documento OpenAPI.
- **El PRD y el backlog no se actualizan y no se borran.** Quedan como el registro de la intención y como origen de los `CA-n` que citan las historias y los tickets de Jira. Se leen para saber qué se pidió y por qué, nunca para saber qué hace el sistema hoy.
- **`design.md` es donde vive el porqué.** La spec viva dice qué, en presente y sin historia; las alternativas descartadas y los trade-offs se buscan en el cambio archivado que introdujo el requisito.

## Estado

**Reemplazada** (2027-08-28) por el [ADR 0002 — Los tests de integración son la única fuente de verdad ejecutable](0002-tests-como-fuente-de-verdad-ejecutable.md). Lo que motivó el ADR 0002 fue precisamente el riesgo que este anotaba en sus consecuencias: que nada obliga a que la spec y el código coincidan. `openspec/specs/` queda congelada como registro histórico y deja de mantenerse.

~~**Aceptada** (2026-08-28).~~ Registró por escrito una práctica que estuvo en vigor desde `5b5cd0a` (2026-08-13) y que hasta entonces era tácita: `openspec/` se venía usando sin que ningún documento dijera qué autoridad tiene frente al PRD y al backlog.

El contexto, la decisión y las consecuencias de este documento se conservan tal cual se escribieron. Son lo que se creía y lo que se decidió el 2026-08-28, y se leen como registro de aquel momento, no como instrucción vigente.

## Consecuencias

### Lo que ganamos

- **Una sola respuesta a «qué hace el sistema hoy»**, en texto plano, versionada junto al código y revisable en el mismo PR que lo cambia.
- **Los cambios que rompen algo se ven.** Una `MODIFIED` en un diff es visible en revisión; una redefinición silenciosa en la cabeza de quien programa, no.
- **El porqué sobrevive a la gente.** Los `design.md` archivados conservan cosas que el código no puede expresar: por qué `DEFAULT_LIST_STATUSES` se escribe entera en vez de derivarse como `TASK_STATUSES` menos `done`, o por qué el filtro se resolvió a favor de `CA-9` frente a `CA-17`.
- **Los scenarios se convierten en tests casi sin traducción**, y en criterio de revisión para artefactos derivados. Contrastar el documento OpenAPI contra `specs/tasks/spec.md` fue posible únicamente porque los scenarios dicen códigos, campos y formas concretas.
- **Lo que se dejó fuera queda escrito.** Los tres proposals tienen su apartado de «Fuera de alcance, y a propósito», así que un hueco deliberado no se confunde con un olvido.

### Lo que nos cuesta

- **Nada obliga a que la spec y el código coincidan.** Es el coste principal y ya se ha cobrado dos veces. La segunda, en esta misma sesión: el commit `2ccf2c1` cambió el filtro de la lista de `vine.enum(TASK_STATUSES)` a `vine.string()`, con lo que `?status=archivado` pasó a devolver `200` con lista vacía en vez de `422`, volviendo falsos tres scenarios del requisito *Un estado que no existe se rechaza, no se responde vacío*. Ni el lint, ni el typecheck, ni los tests dijeron nada: se descubrió leyendo. Y `openspec validate --all --strict` sigue en verde con la deriva dentro, porque comprueba la **forma** de las specs, no su correspondencia con el código. Una spec que nadie ejecuta es documentación con mejor formato, no una red.
- **Dos documentos hablan de lo mismo, y hay que saber cuál manda.** El backlog dice de sí mismo que «el artefacto que dirige la implementación es el de este repositorio: los criterios de aceptación», y esta decisión lo relega a intención histórica. Quien llegue nuevo tiene que aprender esa jerarquía, porque los `CA-n` siguen siendo lo que citan las historias y los tickets de Jira.
- **La disciplina depende de las personas, y ya ha fallado.** La fusión de la delta es una edición en prosa hecha por un agente, no un merge mecánico: puede colar un requisito mal integrado sin que nada chirríe. Y archivar después de haber programado convierte la delta en una transcripción del código, con lo que la spec deja de ser una comprobación independiente y pasa a ser un espejo. Eso es exactamente lo que ocurrió en `add-task-status-filter`.
- **El papeleo es caro para el tamaño del producto.** Cinco endpoints de tareas sostienen 1.060 líneas de spec viva y 1.552 más de artefactos de cambio archivados. Cada cambio de comportamiento paga proposal, design, tasks y delta antes de la primera línea de código.
- **La spec afirma cosas que nada verifica.** Buena parte de los 124 scenarios de `tasks` son de interfaz, y los tres proposals declaran «Sin tests» como decisión explícita. Se han añadido tests después, pero la mayoría de los scenarios siguen sin cubrir: la spec promete más de lo que el repositorio demuestra.
- **El archivo no es un historial completo, y puede engañar.** Los 19 requisitos de `auth` se sembraron directamente en la spec viva, sin cambio que los introduzca: reconstruirla desde el archivo es imposible. Y las delta-specs archivadas están congeladas en el estado del mundo del día en que se escribieron, de modo que quien abra `changes/archive/*/specs/tasks/spec.md` buscando la verdad se llevará una versión vieja.
- **Dependemos de una herramienta externa que el repositorio no declara.** La CLI `openspec` está instalada de forma global y no la fija ningún manifiesto: ni `backend/package.json`, ni `frontend/package.json`, y no hay `package.json` raíz. Un clon limpio tiene las specs pero no el tooling que las mantiene, y nada avisa de la versión que se espera.
