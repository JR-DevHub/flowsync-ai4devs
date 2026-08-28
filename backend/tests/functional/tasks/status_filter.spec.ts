import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * El filtro por estado de la lista. Cubre el requisito «Un estado que no existe
 * se rechaza, no se responde vacío» de `openspec/specs/tasks/spec.md`, que es
 * el que se había perdido: el validador aceptaba el filtro como texto libre, el
 * valor inventado llegaba al `where` y volvía como un `200` con lista vacía.
 *
 * Los dos casos se comprueban juntos y en el mismo test cuando el scenario los
 * compara, porque lo que el requisito exige no es solo que uno sea `422`: es
 * que ambos sean **distinguibles desde fuera**. Comprobarlos por separado
 * dejaría pasar precisamente el fallo que esto vigila.
 *
 * El aislamiento es una transacción global, igual que en el resto de la suite:
 * la functional pega contra el mismo fichero SQLite que el servidor de dev.
 */
test.group('Tasks | filtro por estado', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesion(client: any) {
    await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'ada@example.com', password: 'secreto123' })

    return response.body().data.token as string
  }

  test('un estado inventado se rechaza con 422 sobre el campo', async ({ client, assert }) => {
    const token = await sesion(client)

    const response = await client
      .get('/api/v1/tasks')
      .qs({ status: 'archivado' })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(422)

    // El registro tipado de rutas solo conoce las respuestas correctas, así que
    // la forma del error se afirma aquí y no viene dada.
    const body = response.body() as unknown as { errors: { field?: string }[] }
    assert.equal(body.errors[0].field, 'status', 'el error no señala el campo del filtro')

    // Y sobre todo: no llega ninguna lista. Devolver `data` aquí, aunque fuera
    // vacío, sería el fallo silencioso que este requisito prohíbe.
    assert.notProperty(body, 'data')
  })

  test('el error no se confunde con un filtro válido sin resultados', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)

    const inventado = await client
      .get('/api/v1/tasks')
      .qs({ status: 'archivado' })
      .header('Authorization', `Bearer ${token}`)

    const sinResultados = await client
      .get('/api/v1/tasks')
      .qs({ status: 'in_progress' })
      .header('Authorization', `Bearer ${token}`)

    inventado.assertStatus(422)
    sinResultados.assertStatus(200)

    // Lo que el scenario exige es que las dos sean distinguibles sin
    // ambigüedad: una trae `errors` y ninguna lista, la otra trae la lista con
    // la misma forma que cualquier otra respuesta. No se afirma cuántas tareas
    // hay, porque la suite comparte fichero SQLite con el servidor de dev y el
    // contenido previo del espacio no es asunto de este test.
    assert.notProperty(inventado.body(), 'data')
    assert.isArray(sinResultados.body().data)
  })

  test('un estado válido devuelve solo el suyo', async ({ client, assert }) => {
    const token = await sesion(client)

    const creada = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    creada.assertStatus(201)

    const { id } = creada.body().data as { id: number }

    await client
      .patch(`/api/v1/tasks/${id}/status`)
      .header('Authorization', `Bearer ${token}`)
      .json({ status: 'done' })

    const hechas = await client
      .get('/api/v1/tasks')
      .qs({ status: 'done' })
      .header('Authorization', `Bearer ${token}`)

    const porDefecto = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    hechas.assertStatus(200)
    porDefecto.assertStatus(200)

    // Se sigue a la tarea concreta en vez de contar filas: el espacio puede
    // traer tareas de antes y cuántas haya no es lo que este scenario afirma.
    const idsHechas = (hechas.body().data as { id: number }[]).map((tarea) => tarea.id)
    const idsPorDefecto = (porDefecto.body().data as { id: number }[]).map((tarea) => tarea.id)

    assert.include(idsHechas, id, 'lo hecho tiene que seguir siendo consultable')

    // Y la vista por defecto no es «todas»: lo hecho se queda fuera.
    assert.notInclude(idsPorDefecto, id)
  })
})
