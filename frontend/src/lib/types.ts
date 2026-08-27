/**
 * Espejo de `UserTransformer` del backend (app/transformers/user_transformer.ts).
 */
export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string
}

/**
 * Respuesta de `POST /auth/signup` y `POST /auth/login`, ya sin el envoltorio `{ data }`.
 */
export type AuthResult = {
  user: User
  token: string
}

export type SignupPayload = {
  /** El backend lo declara `.nullable()`: la clave debe viajar siempre, aunque valga `null`. */
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginPayload = {
  email: string
  password: string
}

/**
 * Repertorio cerrado de estados, con los identificadores tal y como viajan por
 * la API. Su etiqueta en castellano vive en `lib/task-status.ts`.
 */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

/**
 * El responsable tal y como lo devuelve la lista: quién la lleva, y nada más.
 * El backend no manda su correo ni ningún otro dato de su cuenta.
 */
export type TaskAssignee = {
  id: number
  fullName: string | null
}

export type Task = {
  id: number
  title: string
  status: TaskStatus
  assignee: TaskAssignee
}

/** Al crear, el título es lo único que viaja: el resto lo decide el servidor. */
export type CreateTaskPayload = {
  title: string
}

export type UpdateTaskStatusPayload = {
  status: TaskStatus
}
