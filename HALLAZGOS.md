# Hallazgos

Aquí van **las tres líneas** del ejercicio, una por cada punto de abajo. Es lo único que hay que
traer hecho: un cambio de motor a medias con estas tres líneas escritas vale más que lo contrario,
porque lo que se discute en el directo es dónde te chocaste.

Escribe **una sola línea por punto**, con tus palabras y con lo que mediste, no con lo que suponías.

## 1. Las filas que cambian y la rama

Cuántas filas cambian de valor en tu cambio de esquema, medido con una consulta, y en qué rama del
árbol de reversibilidad cae. Si tu migración no toca datos, dilo tal cual: también es una respuesta.

- 0 filas cambian de valor (consulta `count(*)` sobre `users`, `tasks` y `auth_access_tokens`, en SQLite y en la base `db` de Postgres, ambas vacías); la migración no toca datos y no modifica ninguna migración. Cae en la rama reversible sin costo, basta con solo revertir a la conexion de SQLite y listo.

## 2. Lo que la batería de pruebas no podía ver

Una cosa que la batería de pruebas no podía ver. Si no encontraste ninguna, escribe qué buscaste y dónde.

- `Task.isOverdueOn` (`backend/app/models/task.ts:52`) devuelve siempre `false` sobre Postgres: `pg` entrega las columnas `date` como `Date` y no como texto, y `this.dueDate < referenceDay` compara un `Date` con un string; lo medí leyendo una tarea con `dueDate` `2020-01-01` contra `db-test` (`typeof` = `object`, `isOverdueOn('2026-10-07')` = `false`). La batería (23 tests, todos de `auth`) no lo veía porque `tasks` no tiene ningún test, y `typecheck` tampoco, porque `schema_rules.ts` declara `string` y eso solo fija el tipo escrito, no el valor en ejecución.

## 3. Tu duda

De qué dudaste, o qué no pudiste comprobar.

- No pude comprobar el comportamiento con datos reales: las bases (SQLite y `db`) están vacías y `backups/produccion-2026-10-02.dump` no lo restauré, así que no sé qué pasaría con las fechas de producción; y dudé del docblock de `isOverdueOn`, que dice que una tarea vencida "no está hecha" pero el código no comprueba el estado, así que una tarea `done` con fecha pasada saldría vencida (esto no lo probé contra la base, solo lo leí).
