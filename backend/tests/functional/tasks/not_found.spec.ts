import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Los tres `404` de la capability. Cubren los scenarios «Tarea que no existe»
 * de *Consulta de una tarea suelta* y «Tarea inexistente» de *Cambio de estado
 * de cualquier tarea* y de *Fijar, cambiar y retirar la fecha de vencimiento*,
 * en `openspec/specs/tasks/spec.md`.
 *
 * Se afirma el código y no el cuerpo, a propósito: fuera de producción el
 * manejador de excepciones responde con el volcado de Youch y no con el
 * `{ message }` que documenta el esquema `NotFoundError`. Afirmar aquí esa
 * forma sería afirmar algo que en esta configuración no se cumple.
 *
 * Las tres escrituras van con un identificador que no existe, así que también
 * comprueban lo que el `404` protege: que la petición muere antes de tocar
 * nada.
 */
test.group('Tasks | tarea inexistente', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const NO_EXISTE = 999999
  const DIA = '2026-08-28'

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

  test('consultar una tarea que no existe responde 404', async ({ client }) => {
    const token = await sesion(client)

    const response = await client
      .get(`/api/v1/tasks/${NO_EXISTE}`)
      .qs({ today: DIA })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  test('cambiar el estado de una tarea que no existe responde 404', async ({ client }) => {
    const token = await sesion(client)

    const response = await client
      .patch(`/api/v1/tasks/${NO_EXISTE}/status`)
      .header('Authorization', `Bearer ${token}`)
      .json({ status: 'done' })

    response.assertStatus(404)
  })

  test('fijar la fecha de una tarea que no existe responde 404', async ({ client }) => {
    const token = await sesion(client)

    const response = await client
      .put(`/api/v1/tasks/${NO_EXISTE}/due-date`)
      .header('Authorization', `Bearer ${token}`)
      .json({ dueDate: '2026-09-30', today: DIA })

    response.assertStatus(404)
  })
})
