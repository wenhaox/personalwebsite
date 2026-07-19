import { NextRequest, NextResponse } from 'next/server'

import { Redis } from '@upstash/redis'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

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

const getApprovePassword = () => (
  process.env.GUESTBOOK_APPROVE_PASSWORD
  || process.env.ADMIN_PASSWORD
  || ''
)

const normalizeStore = (value: unknown): GuestbookStore => {
  if (!isObject(value)) return { ...EMPTY_STORE }
  return {
    entries: Array.isArray(value.entries) ? value.entries : [],
    decorations: Array.isArray(value.decorations) ? value.decorations : [],
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
  }
}

const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
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
  if (process.env.VERCEL === '1') return
  try {
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8')
  } catch {
    // ignore
  }
}

const readStore = async (): Promise<GuestbookStore> => {
  const redis = createRedisClient()
  if (redis) {
    try {
      return normalizeStore(await redis.get<GuestbookStore>(STORE_KEY))
    } catch {
      // fall through
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
      // fall through
    }
  }
  await writeLocalStore(nextStore)
}

export async function POST(request: NextRequest) {
  const expected = getApprovePassword()
  if (!expected) {
    return NextResponse.json(
      { error: 'Set GUESTBOOK_APPROVE_PASSWORD in your environment to enable approvals.' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!isObject(body)) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  if (body.password !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const action = body.action === 'reject' ? 'reject' : body.action === 'approve' ? 'approve' : null
  const id = typeof body.id === 'number' ? body.id : Number(body.id)

  if (!action || !Number.isFinite(id)) {
    return NextResponse.json({ error: 'Need action (approve|reject) and id.' }, { status: 400 })
  }

  const store = await readStore()
  const entries = store.entries.filter(isObject)

  if (action === 'reject') {
    const nextEntries = entries.filter((entry) => entry.id !== id)
    const nextStore = {
      ...store,
      entries: nextEntries,
      updatedAt: new Date().toISOString(),
    }
    await writeStore(nextStore)
    return NextResponse.json(nextStore, { headers: { 'Cache-Control': 'no-store' } })
  }

  const nextEntries = entries.map((entry) => (
    entry.id === id ? { ...entry, approved: true } : entry
  ))
  const nextStore = {
    ...store,
    entries: nextEntries,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(nextStore)
  return NextResponse.json(nextStore, { headers: { 'Cache-Control': 'no-store' } })
}
