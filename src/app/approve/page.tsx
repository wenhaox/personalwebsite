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

const PASSWORD_KEY = 'guestbook-approve-auth'

export default function ApproveGuestbookPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const pending = useMemo(
    () => entries.filter((entry) => entry.approved === false),
    [entries]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/guestbook', { cache: 'no-store' })
      if (!response.ok) throw new Error('Could not load guestbook.')
      const payload = await response.json()
      setEntries(Array.isArray(payload.entries) ? payload.entries : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(PASSWORD_KEY)
    if (saved) {
      setPassword(saved)
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) void load()
  }, [authed, load])

  const handleUnlock = (event: FormEvent) => {
    event.preventDefault()
    if (!password.trim()) {
      setError('Enter your approve password.')
      return
    }
    sessionStorage.setItem(PASSWORD_KEY, password.trim())
    setAuthed(true)
    setError('')
  }

  const moderate = async (id: number, action: 'approve' | 'reject') => {
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
      setEntries(Array.isArray(payload.entries) ? payload.entries : [])
      setStatus(action === 'approve' ? 'Approved.' : 'Rejected.')
      window.setTimeout(() => setStatus(''), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update note.')
    }
  }

  if (!authed) {
    return (
      <div className="approve-page mobile-main-content bg-background">
        <form className="approve-card" onSubmit={handleUnlock}>
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
          <button type="submit" className="approve-btn">Unlock</button>
        </form>
      </div>
    )
  }

  return (
    <div className="approve-page mobile-main-content bg-background">
      <div className="approve-card approve-card-wide">
        <div className="approve-header">
          <div>
            <h1 className="approve-title">Pending notes</h1>
            <p className="approve-copy">{pending.length} waiting</p>
          </div>
          <button type="button" className="approve-btn approve-btn-ghost" onClick={() => void load()}>
            Refresh
          </button>
        </div>

        {loading && <p className="approve-copy">Loading…</p>}
        {error && <p className="approve-error">{error}</p>}
        {status && <p className="approve-status">{status}</p>}

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
      </div>
    </div>
  )
}
