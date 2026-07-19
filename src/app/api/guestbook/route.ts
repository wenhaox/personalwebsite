import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface GuestbookStore {
  entries: unknown[]
  decorations: unknown[]
  updatedAt: string
}

type StorageMode = 'redis' | 'local-file' | 'memory'

const STORE_KEY = 'site:guestbook:v1'
const LOCAL_STORE_PATH = path.join(process.cwd(), '.site-data', 'guestbook.json')
const EMPTY_STORE: GuestbookStore = {
  entries: [],
  decorations: [],
  updatedAt: '',
}

const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

const isObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
)

const normalizeStore = (value: unknown): GuestbookStore => {
  if (!isObject(value)) return { ...EMPTY_STORE }

  return {
    entries: Array.isArray(value.entries) ? value.entries : [],
    decorations: Array.isArray(value.decorations) ? value.decorations : [],
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
  }
}

const readLocalStore = async (): Promise<GuestbookStore> => {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8')
    return normalizeStore(JSON.parse(raw))
  } catch {
    return { ...EMPTY_STORE }
  }
}

const writeLocalStore = async (nextStore: GuestbookStore) => {
  // On Vercel the filesystem is ephemeral — only useful for local `next dev`.
  if (process.env.VERCEL === '1') return false

  try {
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({ url, token })
}

const resolveStorage = (): { redis: Redis | null; mode: StorageMode } => {
  const redis = createRedisClient()
  if (redis) return { redis, mode: 'redis' }
  if (process.env.VERCEL === '1') return { redis: null, mode: 'memory' }
  return { redis: null, mode: 'local-file' }
}

const readStore = async (): Promise<{ store: GuestbookStore; mode: StorageMode }> => {
  const { redis, mode } = resolveStorage()

  if (redis) {
    try {
      const data = await redis.get<GuestbookStore>(STORE_KEY)
      return { store: normalizeStore(data), mode: 'redis' }
    } catch {
      // Fall through to local/memory.
    }
  }

  if (mode === 'local-file') {
    return { store: await readLocalStore(), mode: 'local-file' }
  }

  // Vercel without Redis: empty store (browser localStorage still works for each visitor).
  return { store: { ...EMPTY_STORE }, mode: 'memory' }
}

const writeStore = async (nextStore: GuestbookStore): Promise<StorageMode> => {
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

const buildResponse = (store: GuestbookStore, mode: StorageMode, extra?: Record<string, unknown>) => (
  NextResponse.json(
    {
      ...store,
      storage: mode,
      durable: mode === 'redis' || mode === 'local-file',
      ...extra,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
)

export async function GET() {
  const { store, mode } = await readStore()
  return buildResponse(store, mode, {
    hint: mode === 'memory' && isProduction
      ? 'Add Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) in Vercel env for shared guestbook storage.'
      : undefined,
  })
}

const parseIncomingStorePatch = (body: unknown) => {
  if (!isObject(body)) {
    return null
  }

  const entries = 'entries' in body && Array.isArray(body.entries) ? body.entries : undefined
  const decorations = 'decorations' in body && Array.isArray(body.decorations) ? body.decorations : undefined

  if (entries === undefined && decorations === undefined) {
    return null
  }

  return {
    entries,
    decorations,
  }
}

const entryId = (entry: Record<string, unknown>) => {
  const id = typeof entry.id === 'number' ? entry.id : Number(entry.id)
  return Number.isFinite(id) ? id : null
}

const isApprovedEntry = (entry: Record<string, unknown>) => entry.approved !== false

/** Public writes may add/update pending notes and decorations, but cannot self-approve. */
const mergePublicEntries = (currentEntries: unknown[], incomingEntries: unknown[]) => {
  const current = currentEntries.filter(isObject)
  const incoming = incomingEntries.filter(isObject)
  const currentById = new Map<number, Record<string, unknown>>()
  for (const entry of current) {
    const id = entryId(entry)
    if (id != null) currentById.set(id, entry)
  }

  const incomingIds = new Set<number>()
  const merged: Record<string, unknown>[] = []
  const seen = new Set<number>()

  for (const entry of incoming) {
    const id = entryId(entry)
    if (id == null) continue
    incomingIds.add(id)
    const existing = currentById.get(id)

    if (existing && isApprovedEntry(existing)) {
      merged.push({ ...entry, ...existing, approved: true, id })
      seen.add(id)
      continue
    }

    merged.push({ ...entry, approved: false, id })
    seen.add(id)
  }

  // Keep server notes the client omitted (other visitors' pending / approved).
  for (const entry of current) {
    const id = entryId(entry)
    if (id == null || seen.has(id)) continue
    if (!incomingIds.has(id)) {
      merged.push(entry)
      seen.add(id)
    }
  }

  return merged
}

const upsertStore = async (request: NextRequest) => {
  const incoming = parseIncomingStorePatch(await request.json().catch(() => null))

  if (!incoming) {
    return NextResponse.json({ error: 'Invalid guestbook payload.' }, { status: 400 })
  }

  const { store: current } = await readStore()
  const nextStore: GuestbookStore = {
    entries: incoming.entries !== undefined
      ? mergePublicEntries(current.entries, incoming.entries)
      : current.entries,
    decorations: incoming.decorations ?? current.decorations,
    updatedAt: new Date().toISOString(),
  }

  const mode = await writeStore(nextStore)

  return buildResponse(nextStore, mode, {
    hint: mode === 'memory' && isProduction
      ? 'Guestbook saved in this browser only until Redis env vars are set on Vercel.'
      : undefined,
  })
}

export async function PUT(request: NextRequest) {
  return upsertStore(request)
}

export async function PATCH(request: NextRequest) {
  return upsertStore(request)
}
