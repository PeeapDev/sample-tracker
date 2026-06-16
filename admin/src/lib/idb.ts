// Minimal promise-wrapped IndexedDB — no external deps. Two stores:
//   'cache'  → last-seen GET responses, keyed by request key (method+url).
//   'outbox' → writes made while offline, auto-incrementing id, replayed on
//              reconnect.
const DB_NAME = 'nsrtms_offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache')
      if (!db.objectStoreNames.contains('outbox'))
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

export interface OutboxItem {
  id?: number
  method: string
  url: string
  body?: unknown
  label?: string // human description for the sync indicator
  createdAt: number
}

// Cache (keyed)
export const cacheGet = <T>(key: string) =>
  run<{ data: T; ts: number } | undefined>('cache', 'readonly', (s) => s.get(key))
export const cacheSet = <T>(key: string, data: T) =>
  run<IDBValidKey>('cache', 'readwrite', (s) => s.put({ data, ts: Date.now() }, key))

// Outbox
export const outboxAdd = (item: OutboxItem) =>
  run<IDBValidKey>('outbox', 'readwrite', (s) => s.add(item))
export const outboxAll = () => run<OutboxItem[]>('outbox', 'readonly', (s) => s.getAll())
export const outboxDelete = (id: number) =>
  run<undefined>('outbox', 'readwrite', (s) => s.delete(id))
