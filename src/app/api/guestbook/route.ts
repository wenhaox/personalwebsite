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

const isPublicDecoration = (item: unknown) => {
  if (!isObject(item)) return false
  if (item.kind === 'emoji') return true
  if (item.kind === 'photo') return item.approved !== false
  return item.approved !== false
}

export async function GET() {
  const { store, mode } = await readStore()
  const publicEntries = store.entries.filter((entry) => {
    if (!isObject(entry)) return false
    return entry.approved !== false
  })
  const publicDecorations = store.decorations.filter(isPublicDecoration)

  return buildResponse(
    {
      ...store,
      entries: publicEntries,
      decorations: publicDecorations,
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

const decorationId = (item: Record<string, unknown>) => {
  const id = typeof item.id === 'number' ? item.id : Number(item.id)
  return Number.isFinite(id) ? id : null
}

const isApprovedEntry = (entry: Record<string, unknown>) => entry.approved !== false

const isApprovedDecoration = (item: Record<string, unknown>) => item.approved !== false

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

/** Public writes may add stickers and move them, but cannot self-approve photos/GIFs. */
const mergePublicDecorations = (currentDecorations: unknown[], incomingDecorations: unknown[]) => {
  const current = currentDecorations.filter(isObject)
  const incoming = incomingDecorations.filter(isObject)
  const currentById = new Map<number, Record<string, unknown>>()
  for (const item of current) {
    const id = decorationId(item)
    if (id != null) currentById.set(id, item)
  }

  const incomingIds = new Set<number>()
  const merged: Record<string, unknown>[] = []
  const seen = new Set<number>()

  for (const item of incoming) {
    const id = decorationId(item)
    if (id == null) continue
    incomingIds.add(id)
    const existing = currentById.get(id)
    const kind = item.kind === 'photo' ? 'photo' : 'emoji'

    if (kind === 'emoji') {
      merged.push({ ...item, kind: 'emoji', approved: true, id })
      seen.add(id)
      continue
    }

    if (existing && existing.kind === 'photo' && isApprovedDecoration(existing)) {
      merged.push({
        ...existing,
        ...item,
        kind: 'photo',
        value: existing.value,
        approved: true,
        id,
      })
      seen.add(id)
      continue
    }

    if (existing && existing.kind === 'photo') {
      merged.push({
        ...existing,
        ...item,
        kind: 'photo',
        value: existing.value,
        approved: false,
        id,
      })
      seen.add(id)
      continue
    }

    merged.push({ ...item, kind: 'photo', approved: false, id })
    seen.add(id)
  }

  for (const item of current) {
    const id = decorationId(item)
    if (id == null || seen.has(id)) continue
    if (!incomingIds.has(id)) {
      merged.push(item)
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
    decorations: incoming.decorations !== undefined
      ? mergePublicDecorations(current.decorations, incoming.decorations)
      : current.decorations,
    updatedAt: new Date().toISOString(),
  }

  const mode = await writeStore(nextStore)

  if (mode === 'memory' && isProduction) {
    return NextResponse.json(
      {
        ...nextStore,
        storage: mode,
        durable: false,
        error: 'Guestbook storage is not configured on the server.',
        hint: 'Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel env, then redeploy.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  return buildResponse(nextStore, mode, {
    hint: undefined,
  })
}

export async function PUT(request: NextRequest) {
  return upsertStore(request)
}

export async function PATCH(request: NextRequest) {
  return upsertStore(request)
}
