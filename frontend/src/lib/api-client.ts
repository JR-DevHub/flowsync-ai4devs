import type { AuthResponse, LoginPayload, SignupPayload, User } from '@/lib/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export class ApiError extends Error {}

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (Array.isArray(body?.errors) && typeof body.errors[0]?.message === 'string') {
      return body.errors[0].message
    }
    if (typeof body?.message === 'string') {
      return body.message
    }
  } catch {
    // Response body wasn't JSON (or was empty) — fall through to the generic message.
  }
  return 'Ocurrió un error. Intentá de nuevo.'
}

async function apiFetch<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    token?: string | null
    /** `serialize()`-backed endpoints wrap their payload as `{ data: T }`. */
    unwrap?: boolean
  } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(await parseApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const json = await response.json()
  return (options.unwrap ? json.data : json) as T
}

export function signup(payload: SignupPayload) {
  return apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body: payload, unwrap: true })
}

export function login(payload: LoginPayload) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: payload, unwrap: true })
}

export function getProfile(token: string) {
  return apiFetch<User>('/account/profile', { token, unwrap: true })
}

export function logout(token: string) {
  return apiFetch<{ message: string }>('/account/logout', { method: 'POST', token })
}
