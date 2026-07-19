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

type ModerateAction = 'list' | 'approve' | 'reject' | 'delete-decoration'

const resolveAction = (value: unknown): ModerateAction | null => {
  if (value === 'list') return 'list'
  if (value === 'approve') return 'approve'
  if (value === 'reject' || value === 'delete') return 'reject'
  if (value === 'delete-decoration') return 'delete-decoration'
  return null
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

  const action = resolveAction(body.action)

  if (body.password !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  if (!action) {
    return NextResponse.json(
      { error: 'Need action (list|approve|reject|delete|delete-decoration).' },
      { status: 400 }
    )
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
  const decorations = store.decorations.filter(isObject)

  if (action === 'delete-decoration') {
    const nextStore = {
      ...store,
      decorations: decorations.filter((item) => item.id !== id),
      updatedAt: new Date().toISOString(),
    }
    await writeStore(nextStore)
    return NextResponse.json(nextStore, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (action === 'reject') {
    const nextStore = {
      ...store,
      entries: entries.filter((entry) => entry.id !== id),
      updatedAt: new Date().toISOString(),
    }
    await writeStore(nextStore)
    return NextResponse.json(nextStore, { headers: { 'Cache-Control': 'no-store' } })
  }

  const nextStore = {
    ...store,
    entries: entries.map((entry) => (
      entry.id === id ? { ...entry, approved: true } : entry
    )),
    updatedAt: new Date().toISOString(),
  }
  await writeStore(nextStore)
  return NextResponse.json(nextStore, { headers: { 'Cache-Control': 'no-store' } })
}
