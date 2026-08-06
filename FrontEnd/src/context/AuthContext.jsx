import { useEffect, useMemo, useState } from 'react'
import { listPermissionsRequest, loginRequest, registerRequest } from '../auth/auth.service'
import { AuthContext } from './auth-context.js'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const AUTH_SESSION_EVENT = 'auth:session-changed'

function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : 0
  } catch {
    return 0
  }
}

function isTokenValid(token) {
  return Boolean(token) && getTokenExpiration(token) > Date.now()
}

function readStoredSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const storedUser = localStorage.getItem(AUTH_USER_KEY)

  if (!isTokenValid(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)

    return { token: null, user: null }
  }

  let user = null

  try {
    user = storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
  }

  return {
    token,
    user,
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

  useEffect(() => {
    if (!session.token) {
      return undefined
    }

    const remainingTime = getTokenExpiration(session.token) - Date.now()

    if (remainingTime <= 0) {
      clearSession()
      setSession({ token: null, user: null })
      return undefined
    }

    const expirationTimer = window.setTimeout(() => {
      clearSession()
      setSession({ token: null, user: null })
    }, remainingTime)

    return () => window.clearTimeout(expirationTimer)
  }, [session.token])

  useEffect(() => {
    let active = true

    const hydratePermissions = async () => {
      if (!session.token || !session.user || (session.user.permisos?.length ?? 0) > 0) {
        return
      }

      try {
        const permisos = await listPermissionsRequest()

        if (!active) {
          return
        }

        const nextUser = {
          ...session.user,
          permisos,
        }

        persistSession({ token: session.token, user: nextUser })
        setSession(readStoredSession())
      } catch {
        // Si no se pueden cargar los permisos, mantenemos la sesión actual.
      }
    }

    hydratePermissions()

    return () => {
      active = false
    }
  }, [session.token, session.user])

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
      isAuthenticated: isTokenValid(session.token),
      login,
      register,
      logout,
    }
  }, [session.token, session.user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
