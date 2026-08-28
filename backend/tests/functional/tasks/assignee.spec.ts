import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea enseña de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`.
 *
 * Cada scenario se comprueba sobre las dos lecturas que devuelven una tarea —la
 * lista y la tarea suelta—, porque el requisito habla de «cualquier tarea,
 * suelta o dentro de la lista» y hoy cada una pasa por un transformer distinto:
 * cumplirlo en una no dice absolutamente nada de la otra.
 *
 * El aislamiento es una transacción global y no un truncate, por el mismo
 * motivo que en los tests de auth: la suite functional pega contra el mismo
 * fichero SQLite que el servidor de desarrollo.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // El día de referencia que exige la consulta de una tarea suelta. Aquí es
  // irrelevante —ninguna de estas tareas tiene fecha de vencimiento—, pero es
  // obligatorio y sin él la petición ni siquiera llega al transformer.
  const DIA = '2026-08-28'

  async function sesion(client: any, fullName: string | null, email: string) {
    await User.create({ fullName, email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function crearTarea(client: any, token: string) {
    const response = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    response.assertStatus(201)

    return response.body().data
  }

  /**
   * Las dos lecturas que devuelven una tarea, etiquetadas para que, cuando una
   * falle, el mensaje diga cuál de las dos es.
   */
  async function elResponsableSegunCadaLectura(client: any, token: string) {
    const creada = await crearTarea(client, token)

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    const suelta = await client
      .get(`/api/v1/tasks/${creada.id}`)
      .qs({ today: DIA })
      .header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    suelta.assertStatus(200)

    return [
      ['la lista', lista.body().data[0].assignee],
      ['la tarea suelta', suelta.body().data.assignee],
    ] as const
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const token = await sesion(client, 'Ada Lovelace', 'ada@example.com')

    for (const [donde, assignee] of await elResponsableSegunCadaLectura(client, token)) {
      assert.equal(assignee.fullName, 'Ada Lovelace', `${donde}: el nombre no llega`)
      assert.equal(assignee.initials, 'AL', `${donde}: las iniciales no llegan`)
    }
  })

  test('la tarea no filtra datos de cuenta', async ({ client, assert }) => {
    const token = await sesion(client, 'Ada Lovelace', 'ada@example.com')

    for (const [donde, assignee] of await elResponsableSegunCadaLectura(client, token)) {
      assert.notProperty(assignee, 'email', `${donde}: la tarea expone el email del responsable`)

      // No basta con que no venga bajo la clave `email`: lo que el requisito
      // prohíbe es que el dato salga, se llame como se llame el campo.
      assert.notInclude(
        JSON.stringify(assignee),
        'ada@example.com',
        `${donde}: el email del responsable viaja dentro de la tarea`
      )
    }
  })

  test('un responsable sin nombre conserva sus iniciales', async ({ client, assert }) => {
    const token = await sesion(client, null, 'sin-nombre@example.com')

    for (const [donde, assignee] of await elResponsableSegunCadaLectura(client, token)) {
      assert.isNull(assignee.fullName, `${donde}: el nombre no llega nulo`)

      // El scenario pide iniciales «para que la interfaz pueda representarlo
      // sin recurrir a su email»: si faltaran, el email sería el único recurso.
      assert.equal(assignee.initials, 'SE', `${donde}: las iniciales no llegan`)
    }
  })
})
