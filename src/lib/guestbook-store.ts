import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { Redis } from '@upstash/redis'

export interface GuestbookStore {
  entries: unknown[]
  decorations: unknown[]
  updatedAt: string
}

export type StorageMode = 'redis' | 'local-file' | 'memory'

/** Fresh board key — starts from the minimal hi + emoji seed. */
export const STORE_KEY = 'site:guestbook:v3'
export const LOCAL_STORE_PATH = path.join(process.cwd(), '.site-data', 'guestbook.json')

export const SEED_STORE: GuestbookStore = {
  entries: [
    {
      id: 1,
      name: 'Anonymous',
      message: 'hi',
      date: 'Jul 18, 2026',
      approved: true,
      createdAt: '2026-07-18T19:00:00.000Z',
      x: 88,
      y: 72,
      color: '#f7f8fb',
    },
  ],
  decorations: [
    {
      id: 2,
      kind: 'emoji',
      value: '👋',
      x: 320,
      y: 110,
      size: 96,
      rotation: -6,
    },
  ],
  updatedAt: '2026-07-18T19:00:00.000Z',
}

export const EMPTY_STORE: GuestbookStore = {
  entries: [],
  decorations: [],
  updatedAt: '',
}

export const isObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
)

export const normalizeStore = (value: unknown): GuestbookStore => {
  if (!isObject(value)) return { ...EMPTY_STORE }

  return {
    entries: Array.isArray(value.entries) ? value.entries : [],
    decorations: Array.isArray(value.decorations) ? value.decorations : [],
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
  }
}

export const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export const readLocalStore = async (): Promise<GuestbookStore> => {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8')
    return normalizeStore(JSON.parse(raw))
  } catch {
    return { ...EMPTY_STORE }
  }
}

export const writeLocalStore = async (nextStore: GuestbookStore) => {
  if (process.env.VERCEL === '1') return false

  try {
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

export const resolveStorage = (): { redis: Redis | null; mode: StorageMode } => {
  const redis = createRedisClient()
  if (redis) return { redis, mode: 'redis' }
  if (process.env.VERCEL === '1') return { redis: null, mode: 'memory' }
  return { redis: null, mode: 'local-file' }
}

export const readStore = async (): Promise<{ store: GuestbookStore; mode: StorageMode }> => {
  const { redis, mode } = resolveStorage()

  if (redis) {
    try {
      const data = await redis.get<GuestbookStore>(STORE_KEY)
      const normalized = normalizeStore(data)
      if (normalized.entries.length === 0 && normalized.decorations.length === 0) {
        await redis.set(STORE_KEY, SEED_STORE)
        return { store: { ...SEED_STORE }, mode: 'redis' }
      }
      return { store: normalized, mode: 'redis' }
    } catch {
      // Fall through.
    }
  }

  if (mode === 'local-file') {
    const local = await readLocalStore()
    if (local.entries.length === 0 && local.decorations.length === 0) {
      await writeLocalStore(SEED_STORE)
      return { store: { ...SEED_STORE }, mode: 'local-file' }
    }
    return { store: local, mode: 'local-file' }
  }

  return { store: { ...SEED_STORE }, mode: 'memory' }
}

export const writeStore = async (nextStore: GuestbookStore): Promise<StorageMode> => {
  const { redis, mode } = resolveStorage()

  if (redis) {
    try {
      await redis.set(STORE_KEY, nextStore)
      return 'redis'
    } catch {
      // Fall through.
    }
  }

  if (mode === 'local-file') {
    const ok = await writeLocalStore(nextStore)
    return ok ? 'local-file' : 'memory'
  }

  return 'memory'
}
