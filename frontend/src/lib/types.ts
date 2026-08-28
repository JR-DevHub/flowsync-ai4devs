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
  /** Día de calendario, `AAAA-MM-DD`, o vacío si nadie le ha puesto plazo. */
  dueDate: string | null
  /**
   * Si la tarea se ha pasado de plazo. Lo decide el servidor contra el día que
   * le mandamos: aquí no se compara ninguna fecha con ninguna otra.
   */
  isOverdue: boolean
}

/** Al crear, el título es lo único obligatorio: el resto lo decide el servidor. */
export type CreateTaskPayload = {
  title: string
}

/**
 * Estado, fecha o ambos. Omitir un campo lo deja intacto; mandar la fecha como
 * `null` la retira. Esa diferencia es la que separa «no lo toques» de «quítalo».
 */
export type UpdateTaskPayload = {
  status?: TaskStatus
  dueDate?: string | null
}
