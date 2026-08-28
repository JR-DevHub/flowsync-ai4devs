import { defineConfig } from '@foadonis/openapi'

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
    },
  },
})
