# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Sonnet 5 1M High
**Herramienta:** Claude Code

```
Necesito que migres el proyecto actual de SQLite a PostgreSQL ejecutándose sobre Docker. Debes configurar dos bases de datos independientes: una para el entorno de desarrollo y otra para el entorno de pruebas.

Asegúrate de seguir estrictamente todas las siguientes restricciones no negociables:

1. Fichero Docker Compose:
   - El archivo debe llamarse `compose.yaml`.
   - No debes incluir la propiedad obsoleta `version:` en el archivo (para evitar avisos de deprecación de Docker).
   - Debe definir exactamente dos servicios: `db` (desarrollo) y `db-test` (pruebas).

2. Imagen Docker:
   - Utiliza para ambos servicios la imagen oficial `pgvector/pgvector:pg17` (incluye la extensión de vectores).

3. Mapeo de Puertos:
   - Asigna el puerto del host `54410` para el servicio `db` (desarrollo) -> `54410:5432`.
   - Asigna el puerto del host `54411` para el servicio `db-test` (pruebas) -> `54411:5432`.
   - No utilices el puerto por defecto `5432` en el host para evitar colisiones con instancias de PostgreSQL locales.

4. Efimeridad en Pruebas:
   - La base de datos de desarrollo (`db`) debe persistir sus datos usando un volumen.
   - La base de datos de pruebas (`db-test`) debe ser efímera y ejecutarse en memoria (usando `tmpfs`), sin volumen persistente, para garantizar aislamiento total entre ejecuciones de tests.

5. Healthchecks y Dependencias:
   - Configura comprobaciones de salud (`healthcheck`) usando `pg_isready` en ambos servicios.
   - Si existen otros servicios o procesos dependientes, deben esperar explicitamente a que las bases de datos estén en estado `healthy` (`condition: service_healthy`) antes de conectar, evitando errores en la inicialización previa.

6. Configuración de Entorno:
   - Configura las variables de entorno necesarias para conectar a PostgreSQL en desarrollo.
   - Crea/actualiza el archivo de entorno específico para la batería de pruebas (por ejemplo, `.env.test`), asegurándote de que apunte al puerto `54411` y a la base de pruebas efímera para que el framework lo cargue automáticamente durante los tests.

7. Atajos en el Makefile:
   - Añade comandos/targets en el `Makefile` del proyecto para facilitar las siguientes operaciones:
     * Levantar los contenedores de las bases de datos (`docker compose up -d`).
     * Parar y limpiar los contenedores.
     * Ejecutar las migraciones en ambas bases de datos (`db` y `db-test`).
     * Ejecutar la batería de tests completa.

Por favor, revisa el código existente, ajusta la configuración de la ORM/conexión en la aplicación para dar soporte a PostgreSQL y genera las configuraciones requeridas.
```

**Qué salió:** ※ recap: Objetivo: migrar el backend de SQLite a PostgreSQL en Docker con bases separadas de desarrollo y pruebas. Ya está hecho y verificado, con 23 tests pasando.

---

## Prompt 2

**Modelo:** Sonnet 5 1M High
**Herramienta:** Claude Code

```
cómo decide el proyecto si una tarea está vencida?
```

**Qué salió:** Lógica en backend/app/models/task.ts:52.
