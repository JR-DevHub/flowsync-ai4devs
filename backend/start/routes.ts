/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import openapi from '@foadonis/openapi/services/main'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

/**
 * Documentación de la API: la interfaz en `/api` y el documento en `/api.json`
 * y `/api.yaml`. Se registran sin argumento, con el path por defecto del
 * paquete, y quedan fuera del grupo `/api/v1`: no son parte de la API que
 * documentan y no deben heredar su autenticación.
 */
openapi.registerRoutes()

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/', [controllers.Tasks, 'index'])
        router.post('/', [controllers.Tasks, 'store'])
        router.get(':id', [controllers.Tasks, 'show'])
        router.patch(':id/status', [controllers.TaskStatuses, 'update'])
        router.put(':id/due-date', [controllers.TaskDueDates, 'update'])
      })
      .prefix('tasks')
      .as('tasks')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
