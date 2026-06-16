import axios, { type InternalAxiosRequestConfig } from 'axios'
import { cacheGet, cacheSet } from './idb'
import { enqueue } from './outbox'

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api/v1'

export const api = axios.create({ baseURL: API_BASE })

// Stable key for caching a GET (path + query) in IndexedDB.
function cacheKey(config: InternalAxiosRequestConfig): string {
  const m = (config.method ?? 'get').toLowerCase()
  const p = config.params ? `?${JSON.stringify(config.params)}` : ''
  return `${m}:${config.url}${p}`
}

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
  (res) => {
    // Mirror successful GETs into IndexedDB so they can be served offline.
    if ((res.config.method ?? 'get').toLowerCase() === 'get') {
      void cacheSet(cacheKey(res.config as InternalAxiosRequestConfig), res.data)
    }
    return res
  },
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? refreshAccess()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }

    // No response = offline / server unreachable. Serve GETs from the IndexedDB
    // cache, and queue writes to replay on reconnect.
    if (!error.response && original) {
      const method = (original.method ?? 'get').toLowerCase()
      if (method === 'get') {
        const cached = await cacheGet<unknown>(cacheKey(original))
        if (cached) {
          return {
            data: cached.data,
            status: 200,
            statusText: 'OK (offline cache)',
            headers: {},
            config: original,
            request: null,
            fromCache: true,
          }
        }
      } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
        // Never queue auth flows — they must hit the network live.
        if (!String(original.url ?? '').includes('/auth/')) {
          let body: unknown = original.data
          if (typeof body === 'string') {
            try {
              body = JSON.parse(body)
            } catch {
              /* leave as-is */
            }
          }
          await enqueue({
            method,
            url: original.url ?? '',
            body,
            label: `${method.toUpperCase()} ${original.url ?? ''}`,
          })
          return {
            data: { queued: true, offline: true },
            status: 202,
            statusText: 'Queued offline',
            headers: {},
            config: original,
            request: null,
            queued: true,
          }
        }
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
