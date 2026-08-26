import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as api from '@/lib/api-client'
import type { LoginPayload, SignupPayload, User } from '@/lib/types'

const TOKEN_STORAGE_KEY = 'flowsync.token'

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    api
      .getProfile(storedToken)
      .then((profile) => {
        setToken(storedToken)
        setUser(profile)
      })
      .catch((error) => {
        // Only drop the token when the server actually rejected it (e.g. expired/invalid).
        // A network failure here shouldn't sign out a user who still holds a valid token.
        if (error instanceof api.ApiError) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  function applyAuthResponse({ user, token }: { user: User; token: string }) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setUser(user)
    setToken(token)
  }

  async function login(payload: LoginPayload) {
    applyAuthResponse(await api.login(payload))
  }

  async function signup(payload: SignupPayload) {
    applyAuthResponse(await api.signup(payload))
  }

  async function logout() {
    if (token) {
      await api.logout(token).catch(() => {})
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
