import { defineConfig } from '@foadonis/openapi'
import { taskSchemas } from '#openapi/schemas'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'FlowSync API',
      /**
       * La versión que se anuncia es la de la API, no la del paquete: lo único
       * versionado de verdad en este repo es el prefijo `/api/v1` de
       * `start/routes.ts`, y el documento tiene que decir lo mismo que la URL.
       */
      version: 'v1',
      description:
        'La lista de trabajo compartida del equipo. Toda respuesta viaja envuelta en `{ "data": ... }`, y todo lo que cuelga de `/api/v1/tasks` exige un token de acceso.',
    },
    components: {
      /**
       * El guard por defecto es `api`, con tokens opacos que se mandan en la
       * cabecera `Authorization: Bearer`. No son JWT, así que no se declara
       * `bearerFormat`.
       *
       * La clave tiene que llamarse `bearer` porque es el nombre que usa
       * `@ApiBearerAuth()` al declarar el requisito en cada operación.
       */
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
          description: 'El token que devuelven `POST /auth/signup` y `POST /auth/login`.',
        },
      },
      schemas: taskSchemas,
    },
  },
})
