import { test } from '@japa/runner'
import { TASK_STATUSES } from '#models/task'
import { taskSchemas, taskStatusQuery, updateTaskStatusBody } from '#openapi/schemas'

/**
 * `#openapi/schemas` no puede importar el modelo —lo carga `config/openapi.ts`,
 * antes de que exista el servicio `hash`—, así que lleva los tres estados
 * escritos a mano. Este test es lo que impide que esa copia se quede atrás: si
 * alguien toca `TASK_STATUSES`, el documento deja de mentir porque aquí salta
 * un fallo, no porque alguien se acuerde.
 *
 * Se comprueban los tres sitios donde el enum aparece, y no solo uno: son tres
 * copias distintas y actualizar dos de las tres es exactamente el error que
 * este test tiene que cazar.
 */
test.group('OpenAPI | esquemas de tareas', () => {
  test('el enum documentado es el del dominio, en los tres sitios', ({ assert }) => {
    const esperado = [...TASK_STATUSES]

    assert.deepEqual(
      taskSchemas.Task.properties?.status,
      { type: 'string', enum: esperado },
      'el estado del esquema Task se ha desviado de TASK_STATUSES'
    )

    assert.deepEqual(
      taskStatusQuery.enum,
      esperado,
      'el filtro por estado documentado se ha desviado de TASK_STATUSES'
    )

    assert.deepEqual(
      updateTaskStatusBody.properties?.status,
      { type: 'string', enum: esperado },
      'el cuerpo del cambio de estado se ha desviado de TASK_STATUSES'
    )
  })
})
