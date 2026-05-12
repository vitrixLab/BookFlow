// lib/cache.ts
type Entry = { value: any; timestamp: number; ttl: number }

const store = new Map<string, Entry>()

export function getCached(key: string, ttl = 60_000): any | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp < entry.ttl) return entry.value
  store.delete(key)
  return null
}

export function setCached(key: string, value: any, ttl = 60_000) {
  store.set(key, { value, timestamp: Date.now(), ttl })
}

export function invalidateCache(key: string) {
  store.delete(key)
}

export function clearCache(key?: string) {
  if (key) {
    store.delete(key)
  } else {
    store.clear()
  }
}