import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, setTokens, clearTokens, getAccessToken } from './api'
import { clearCache } from './cache'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  facility?: { name?: string } | null
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>(null as unknown as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from storage. The backend has no /users/me endpoint, and
    // the login response already carries the full user, so we persist it and
    // rehydrate here. Token expiry is handled lazily by the API interceptor.
    const token = getAccessToken()
    const stored = localStorage.getItem('nsrtms_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        clearTokens()
        localStorage.removeItem('nsrtms_user')
      }
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    setTokens(res.data.accessToken, res.data.refreshToken)
    localStorage.setItem('nsrtms_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  function logout() {
    clearTokens()
    localStorage.removeItem('nsrtms_user')
    clearCache() // don't leak one user's cached data into the next session
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
