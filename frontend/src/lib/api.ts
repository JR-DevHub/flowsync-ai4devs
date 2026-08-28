import type {
  AuthResult,
  CreateTaskPayload,
  LoginPayload,
  SignupPayload,
  Task,
  UpdateTaskPayload,
  User,
} from '@/lib/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

/** Forma de cada error que devuelve el backend: `{ errors: [...] }`. */
type BackendError = {
  message: string
  rule?: string
  field?: string
  meta?: Record<string, unknown>
}

/**
 * Error de API con el mensaje ya traducido y listo para pintar, más los errores
 * desglosados por campo para colocarlos bajo su input correspondiente.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const FIELD_LABELS: Record<string, string> = {
  fullName: 'el nombre',
  email: 'el email',
  password: 'la contraseña',
  passwordConfirmation: 'la confirmación de la contraseña',
  title: 'el título',
  status: 'el estado',
  dueDate: 'la fecha de vencimiento',
  today: 'el día de hoy',
}

const label = (field?: string) => FIELD_LABELS[field ?? ''] ?? 'el campo'

/**
 * Traduce un error de VineJS a una frase que el usuario pueda entender.
 * Cubre todas las reglas que usa `app/validators/user.ts` en el backend.
 */
function translate(error: BackendError): string {
  const { rule, field, meta } = error

  switch (rule) {
    case 'database.unique':
      return field === 'email'
        ? 'Ese email ya está registrado. Inicia sesión en su lugar.'
        : `Ya existe un registro con ${label(field)}.`
    case 'sameAs':
      return 'Las contraseñas no coinciden.'
    case 'enum':
      return field === 'status'
        ? 'Ese estado no existe.'
        : `El valor de ${label(field)} no es válido.`
    case 'date':
      return field === 'dueDate'
        ? 'Esa fecha no existe. Escríbela como día, mes y año.'
        : `${label(field)} no es una fecha válida.`
    case 'atLeastOne':
      return 'No has cambiado nada.'
    case 'email':
      return 'Introduce una dirección de email válida.'
    case 'required':
      return `Falta rellenar ${label(field)}.`
    case 'minLength':
      return `${label(field)} debe tener al menos ${meta?.min} caracteres.`
    case 'maxLength':
      return `${label(field)} no puede superar los ${meta?.max} caracteres.`
    default:
      return `Revisa ${label(field)}.`
  }
}

/**
 * Convierte una respuesta de error del backend en un `ApiError`.
 */
function toApiError(status: number, body: unknown): ApiError {
  const errors = (body as { errors?: BackendError[] } | null)?.errors

  if (status === 401) {
    return new ApiError(
      'Tu sesión ha caducado. Vuelve a iniciar sesión.',
      status,
    )
  }

  // `User.verifyCredentials` lanza E_INVALID_CREDENTIALS con un 400 sin `field`.
  if (status === 400) {
    return new ApiError('El email o la contraseña no son correctos.', status)
  }

  if (status === 422 && errors?.length) {
    const fieldErrors: Record<string, string> = {}
    for (const error of errors) {
      if (error.field && !fieldErrors[error.field]) {
        fieldErrors[error.field] = translate(error)
      }
    }

    return new ApiError(translate(errors[0]), status, fieldErrors)
  }

  return new ApiError(
    'Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.',
    status,
  )
}

/**
 * El día de calendario de quien mira, que el servidor necesita para decidir si
 * una tarea está vencida. Se calcula aquí, en el único punto de contacto con la
 * API, para que ninguna pantalla tenga que acordarse de mandarlo.
 */
function browserToday(): string {
  const now = new Date()
  const mes = String(now.getMonth() + 1).padStart(2, '0')
  const dia = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${mes}-${dia}`
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  token?: string | null
}

async function request<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Comprueba que el backend está arrancado.',
      0,
    )
  }

  // Un 500 puede responder HTML, así que el parseo no puede darse por hecho.
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw toApiError(response.status, payload)
  }

  return payload as T
}

export function signup(payload: SignupPayload): Promise<AuthResult> {
  return request<{ data: AuthResult }>('/api/v1/auth/signup', {
    method: 'POST',
    body: payload,
  }).then((response) => response.data)
}

export function login(payload: LoginPayload): Promise<AuthResult> {
  return request<{ data: AuthResult }>('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
  }).then((response) => response.data)
}

export function getProfile(token: string): Promise<User> {
  return request<{ data: User }>('/api/v1/account/profile', { token }).then(
    (response) => response.data,
  )
}

export function logout(token: string): Promise<void> {
  return request('/api/v1/account/logout', { method: 'POST', token }).then(
    () => undefined,
  )
}

/** Sufijo con el día del navegador, que acompaña a toda petición de tareas. */
const withToday = (path: string) =>
  `${path}${path.includes('?') ? '&' : '?'}today=${browserToday()}`

export function getTasks(token: string): Promise<Task[]> {
  return request<{ data: Task[] }>(withToday('/api/v1/tasks'), { token }).then(
    (response) => response.data,
  )
}

export function getTask(token: string, id: number): Promise<Task> {
  return request<{ data: Task }>(withToday(`/api/v1/tasks/${id}`), {
    token,
  }).then((response) => response.data)
}

export function createTask(
  token: string,
  payload: CreateTaskPayload,
): Promise<Task> {
  return request<{ data: Task }>(withToday('/api/v1/tasks'), {
    method: 'POST',
    body: payload,
    token,
  }).then((response) => response.data)
}

export function updateTask(
  token: string,
  id: number,
  payload: UpdateTaskPayload,
): Promise<Task> {
  return request<{ data: Task }>(withToday(`/api/v1/tasks/${id}`), {
    method: 'PATCH',
    body: payload,
    token,
  }).then((response) => response.data)
}
