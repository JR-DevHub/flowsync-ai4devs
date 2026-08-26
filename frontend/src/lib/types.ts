export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string
  initials: string
}

export type AuthResponse = {
  user: User
  token: string
}

export type SignupPayload = {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginPayload = {
  email: string
  password: string
}
