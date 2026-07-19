import { NextRequest, NextResponse } from 'next/server'

import {
  isObject,
  readStore,
  writeStore,
  type GuestbookStore,
} from '@/lib/guestbook-store'

export const runtime = 'nodejs'

const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

const buildResponse = (store: GuestbookStore, mode: string, extra?: Record<string, unknown>) => (
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
  const publicEntries = store.entries.filter((entry) => {
    if (!isObject(entry)) return false
    return entry.approved !== false
  })

  return buildResponse(
    {
      ...store,
      entries: publicEntries,
    },
    mode,
    {
      hint: mode === 'memory' && isProduction
        ? 'Add Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) in Vercel env for shared guestbook storage.'
        : undefined,
    }
  )
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
      merged.push({
        ...existing,
        ...entry,
        message: existing.message,
        approved: true,
        id,
      })
      seen.add(id)
      continue
    }

    merged.push({ ...entry, approved: false, id })
    seen.add(id)
  }

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
