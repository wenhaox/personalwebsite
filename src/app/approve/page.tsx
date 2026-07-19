'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

interface GuestbookEntry {
  id: number
  name?: string
  message: string
  date?: string
  approved?: boolean
  createdAt?: string
  color?: string
}

interface BoardDecoration {
  id: number
  kind: 'emoji' | 'photo'
  value: string
  x?: number
  y?: number
  size?: number
  rotation?: number
}

const PASSWORD_KEY = 'guestbook-approve-auth'

const normalizeDecorations = (value: unknown): BoardDecoration[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'number' ? item.id : index,
      kind: item.kind === 'photo' ? 'photo' : 'emoji',
      value: typeof item.value === 'string' ? item.value : '',
      x: typeof item.x === 'number' ? item.x : undefined,
      y: typeof item.y === 'number' ? item.y : undefined,
      size: typeof item.size === 'number' ? item.size : undefined,
      rotation: typeof item.rotation === 'number' ? item.rotation : undefined,
    }))
    .filter((item) => item.value.trim().length > 0)
}

export default function ApproveGuestbookPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [decorations, setDecorations] = useState<BoardDecoration[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const pending = useMemo(
    () => entries.filter((entry) => entry.approved === false),
    [entries]
  )

  const approved = useMemo(
    () => entries.filter((entry) => entry.approved !== false),
    [entries]
  )

  const applyStore = useCallback((payload: Record<string, unknown>) => {
    setEntries(Array.isArray(payload.entries) ? payload.entries as GuestbookEntry[] : [])
    setDecorations(normalizeDecorations(payload.decorations))
  }, [])

  const loadWithPassword = useCallback(async (nextPassword: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/guestbook/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nextPassword, action: 'list' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Could not load guestbook.')
      }
      applyStore(payload)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed.')
      setAuthed(false)
      sessionStorage.removeItem(PASSWORD_KEY)
      return false
    } finally {
      setLoading(false)
    }
  }, [applyStore])

  useEffect(() => {
    const saved = sessionStorage.getItem(PASSWORD_KEY)
    if (!saved) return
    setPassword(saved)
    void loadWithPassword(saved).then((ok) => {
      if (ok) setAuthed(true)
    })
  }, [loadWithPassword])

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault()
    const nextPassword = password.trim()
    if (!nextPassword) {
      setError('Enter your approve password.')
      return
    }

    const ok = await loadWithPassword(nextPassword)
    if (!ok) return

    sessionStorage.setItem(PASSWORD_KEY, nextPassword)
    setAuthed(true)
    setError('')
  }

  const moderate = async (
    id: number,
    action: 'approve' | 'reject' | 'delete-decoration',
  ) => {
    setStatus('')
    setError('')
    try {
      const response = await fetch('/api/guestbook/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id, action }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed.')
      }
      applyStore(payload)
      setStatus(
        action === 'approve'
          ? 'Approved.'
          : action === 'delete-decoration'
            ? 'Decoration deleted.'
            : 'Deleted.'
      )
      window.setTimeout(() => setStatus(''), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update guestbook.')
    }
  }

  if (!authed) {
    return (
      <div className="approve-page mobile-main-content bg-background">
        <form className="approve-card" onSubmit={(event) => void handleUnlock(event)}>
          <h1 className="approve-title">Approve guestbook</h1>
          <p className="approve-copy">Only you should know this password. It is not linked from the site nav.</p>
          <input
            type="password"
            className="approve-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Approve password"
            autoComplete="current-password"
          />
          {error && <p className="approve-error">{error}</p>}
          <button type="submit" className="approve-btn" disabled={loading}>
            {loading ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="approve-page mobile-main-content bg-background">
      <div className="approve-card approve-card-wide">
        <div className="approve-header">
          <div>
            <h1 className="approve-title">Guestbook moderation</h1>
            <p className="approve-copy">
              {pending.length} pending · {approved.length} notes · {decorations.length} stickers
            </p>
          </div>
          <button
            type="button"
            className="approve-btn approve-btn-ghost"
            onClick={() => void loadWithPassword(password)}
          >
            Refresh
          </button>
        </div>

        {loading && <p className="approve-copy">Loading…</p>}
        {error && <p className="approve-error">{error}</p>}
        {status && <p className="approve-status">{status}</p>}

        <section className="approve-section">
          <h2 className="approve-section-title">Pending</h2>
          {!loading && pending.length === 0 && (
            <p className="approve-copy">Nothing pending. New Connect notes land here first.</p>
          )}

          <ul className="approve-list">
            {pending.map((entry) => (
              <li key={entry.id} className="approve-item">
                <p className="approve-message">{entry.message}</p>
                <div className="approve-meta">
                  <span>{entry.date || 'Undated'}</span>
                  <div className="approve-actions">
                    <button type="button" className="approve-btn" onClick={() => void moderate(entry.id, 'approve')}>
                      Approve
                    </button>
                    <button type="button" className="approve-btn approve-btn-danger" onClick={() => void moderate(entry.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="approve-section">
          <h2 className="approve-section-title">Notes on the board</h2>
          {!loading && approved.length === 0 && (
            <p className="approve-copy">No approved sticky notes yet.</p>
          )}

          <ul className="approve-list">
            {approved.map((entry) => (
              <li key={entry.id} className="approve-item">
                <p className="approve-message">{entry.message}</p>
                <div className="approve-meta">
                  <span>{entry.date || 'Undated'}</span>
                  <div className="approve-actions">
                    <button
                      type="button"
                      className="approve-btn approve-btn-danger"
                      onClick={() => {
                        if (!window.confirm('Delete this sticky note from the board?')) return
                        void moderate(entry.id, 'reject')
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="approve-section">
          <h2 className="approve-section-title">Images & emojis</h2>
          {!loading && decorations.length === 0 && (
            <p className="approve-copy">No photos or emojis on the board.</p>
          )}

          <ul className="approve-list">
            {decorations.map((item) => (
              <li key={item.id} className="approve-item approve-item-decoration">
                <div className="approve-decoration-preview">
                  {item.kind === 'photo' ? (
                    <img src={item.value} alt="" className="approve-decoration-photo" />
                  ) : (
                    <span className="approve-decoration-emoji" aria-hidden="true">{item.value}</span>
                  )}
                  <div>
                    <p className="approve-message">
                      {item.kind === 'photo' ? 'Photo sticker' : 'Emoji sticker'}
                    </p>
                    <p className="approve-copy">
                      {item.kind === 'photo' ? item.value.slice(0, 64) : item.value}
                    </p>
                  </div>
                </div>
                <div className="approve-meta">
                  <span>{item.kind}</span>
                  <div className="approve-actions">
                    <button
                      type="button"
                      className="approve-btn approve-btn-danger"
                      onClick={() => {
                        if (!window.confirm(`Delete this ${item.kind === 'photo' ? 'image' : 'emoji'} from the board?`)) return
                        void moderate(item.id, 'delete-decoration')
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
