import { NextRequest, NextResponse } from 'next/server'

import {
  isObject,
  readStore,
  writeStore,
} from '@/lib/guestbook-store'

export const runtime = 'nodejs'

const getApprovePassword = () => (
  process.env.GUESTBOOK_APPROVE_PASSWORD
  || process.env.ADMIN_PASSWORD
  || ''
)

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

  const action = body.action === 'reject'
    ? 'reject'
    : body.action === 'approve'
      ? 'approve'
      : body.action === 'list'
        ? 'list'
        : null

  if (body.password !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  if (!action) {
    return NextResponse.json({ error: 'Need action (list|approve|reject).' }, { status: 400 })
  }

  const { store } = await readStore()

  if (action === 'list') {
    return NextResponse.json(store, { headers: { 'Cache-Control': 'no-store' } })
  }

  const id = typeof body.id === 'number' ? body.id : Number(body.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Need id.' }, { status: 400 })
  }

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
