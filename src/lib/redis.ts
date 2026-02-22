/**
 * Phase 6: Redis cache for location intelligence
 * Uses Upstash Redis when configured; in-memory fallback otherwise.
 */

const CACHE_TTL_SECONDS = 3600 // 1 hour for location intel

const memoryStore = new Map<string, { value: string; expiresAt: number }>()

async function getUpstashRedis(): Promise<{ get: (k: string) => Promise<string | null>; set: (k: string, v: string, px?: number) => Promise<'OK'> } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  return {
    async get(k: string) {
      try {
        const res = await fetch(`${url}/get/${encodeURIComponent(k)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        return json?.result ?? null
      } catch {
        return null
      }
    },
    async set(k: string, v: string, px = CACHE_TTL_SECONDS * 1000) {
      try {
        await fetch(`${url}/set/${encodeURIComponent(k)}/${encodeURIComponent(v)}/px/${px}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        return 'OK'
      } catch {
        return 'OK'
      }
    },
  }
}

let redisClient: Awaited<ReturnType<typeof getUpstashRedis>> | undefined

async function getClient() {
  if (redisClient === undefined) {
    redisClient = await getUpstashRedis()
  }
  return redisClient
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getClient()
  if (client) {
    const raw = await client.get(key)
    if (raw) {
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    }
    return null
  }
  const entry = memoryStore.get(key)
  if (entry && entry.expiresAt > Date.now()) {
    try {
      return JSON.parse(entry.value) as T
    } catch {
      memoryStore.delete(key)
      return null
    }
  }
  if (entry) memoryStore.delete(key)
  return null
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value)
  const client = await getClient()
  if (client) {
    await client.set(key, serialized)
    return
  }
  memoryStore.set(key, {
    value: serialized,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  })
}

export function locationIntelCacheKey(lat: number, lng: number, propertyType?: string, businessType?: string): string {
  return `li:${lat.toFixed(5)}:${lng.toFixed(5)}:${propertyType ?? ''}:${businessType ?? ''}`
}
