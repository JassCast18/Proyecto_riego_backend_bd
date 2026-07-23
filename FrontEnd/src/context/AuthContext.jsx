import { useEffect, useMemo, useState } from 'react'
import { loginRequest, registerRequest } from '../auth/auth.service'
import { AuthContext } from './auth-context.js'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const AUTH_SESSION_EVENT = 'auth:session-changed'

function readStoredSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const storedUser = localStorage.getItem(AUTH_USER_KEY)

  return {
    token,
    user: storedUser ? JSON.parse(storedUser) : null,
  }
}

function persistSession({ token, user }) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())

  useEffect(() => {
    const syncSession = () => {
      setSession(readStoredSession())
    }

    window.addEventListener(AUTH_SESSION_EVENT, syncSession)
    window.addEventListener('storage', syncSession)

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  const value = useMemo(() => {
    const login = async (credentials) => {
      const result = await loginRequest(credentials)

      persistSession({ token: result.token, user: result.user || null })
      setSession(readStoredSession())

      return result
    }

    const register = async (payload) => {
      const result = await registerRequest(payload)

      persistSession({ token: result.token, user: result.user || null })
      setSession(readStoredSession())

      return result
    }

    const logout = () => {
      clearSession()
      setSession({ token: null, user: null })
    }

    return {
      token: session.token,
      user: session.user,
      isAuthenticated: Boolean(session.token),
      login,
      register,
      logout,
    }
  }, [session.token, session.user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}