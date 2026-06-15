import axios from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api/v1'

export const api = axios.create({ baseURL: API_BASE })

const ACCESS = 'nsrtms_access'
const REFRESH = 'nsrtms_refresh'

export function getAccessToken() {
  return localStorage.getItem(ACCESS)
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS, access)
  localStorage.setItem(REFRESH, refresh)
}
export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Attempt one refresh on 401, then retry the original request.
let refreshing: Promise<string | null> | null = null

async function refreshAccess(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH)
  if (!refresh) return null
  try {
    const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh }, {
      headers: { Authorization: `Bearer ${refresh}` },
    })
    setTokens(res.data.accessToken, res.data.refreshToken)
    return res.data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? refreshAccess()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export function apiError(e: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(e)) {
    const msg = e.response?.data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    if (e.code === 'ERR_NETWORK') return 'Cannot reach the API server (is it running on :3000?)'
  }
  return fallback
}
