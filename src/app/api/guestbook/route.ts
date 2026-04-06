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

const STORE_KEY = 'site:guestbook:v1'
const LOCAL_STORE_PATH = path.join(process.cwd(), '.site-data', 'guestbook.json')
const EMPTY_STORE: GuestbookStore = {
  entries: [],
  decorations: [],
  updatedAt: '',
}

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
  try {
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8')
  } catch {
    // Ignore local persistence errors so API still responds.
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

const readStore = async (): Promise<GuestbookStore> => {
  const redis = createRedisClient()

  if (redis) {
    try {
      const data = await redis.get<GuestbookStore>(STORE_KEY)
      return normalizeStore(data)
    } catch {
      // Fall back to local storage when remote store is unavailable.
    }
  }

  return readLocalStore()
}

const writeStore = async (nextStore: GuestbookStore) => {
  const redis = createRedisClient()

  if (redis) {
    try {
      await redis.set(STORE_KEY, nextStore)
      return
    } catch {
      // Fall back to local storage when remote write fails.
    }
  }

  await writeLocalStore(nextStore)
}

const buildResponse = (store: GuestbookStore) => (
  NextResponse.json(store, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
)

export async function GET() {
  const store = await readStore()
  return buildResponse(store)
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

const upsertStore = async (request: NextRequest) => {
  const incoming = parseIncomingStorePatch(await request.json().catch(() => null))

  if (!incoming) {
    return NextResponse.json({ error: 'Invalid guestbook payload.' }, { status: 400 })
  }

  const current = await readStore()
  const nextStore: GuestbookStore = {
    entries: incoming.entries ?? current.entries,
    decorations: incoming.decorations ?? current.decorations,
    updatedAt: new Date().toISOString(),
  }

  await writeStore(nextStore)
  return buildResponse(nextStore)
}

export async function PUT(request: NextRequest) {
  return upsertStore(request)
}

export async function PATCH(request: NextRequest) {
  return upsertStore(request)
}
