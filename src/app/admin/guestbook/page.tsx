'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  date: string;
  approved: boolean;
}

export default function AdminGuestbook() {
  const router = useRouter()
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  
  useEffect(() => {
    loadEntries()
  }, [])
  
  const loadEntries = () => {
    const stored = localStorage.getItem('guestbookEntries')
    if (stored) {
      const all = JSON.parse(stored)
      setEntries(all)
      setPendingCount(all.filter((e: GuestbookEntry) => !e.approved).length)
    }
  }
  
  const approveEntry = (id: number) => {
    const updated = entries.map(e => 
      e.id === id ? { ...e, approved: true } : e
    )
    setEntries(updated)
    localStorage.setItem('guestbookEntries', JSON.stringify(updated))
    loadEntries()
  }
  
  const deleteEntry = (id: number) => {
    if (!confirm('Delete this message?')) return
    
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem('guestbookEntries', JSON.stringify(updated))
    loadEntries()
  }
  
  const pendingEntries = entries.filter(e => !e.approved)
  const approvedEntries = entries.filter(e => e.approved)
  
  return (
    <div className="flex items-start justify-center min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-4xl w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif italic">Guestbook Admin</h1>
            {pendingCount > 0 && (
              <p className="text-sm text-accent mt-2">
                {pendingCount} message{pendingCount !== 1 ? 's' : ''} awaiting approval
              </p>
            )}
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors notion-button"
          >
            Back to Admin
          </Link>
        </div>

        {/* Pending Entries */}
        {pendingEntries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-serif mb-4">Pending Approval ({pendingEntries.length})</h2>
            <div className="space-y-4">
              {pendingEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{entry.name}</h3>
                      <p className="text-xs text-muted">{entry.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveEntry(entry.id)}
                        className="px-3 py-1 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded transition-colors notion-button"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors notion-button"
                      >
                        ✕ Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Entries */}
        <div>
          <h2 className="text-2xl font-serif mb-4">Approved Messages ({approvedEntries.length})</h2>
          {approvedEntries.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted">No approved messages yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-4 bg-card border border-border rounded-lg notion-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{entry.name}</h3>
                      <p className="text-xs text-muted">{entry.date}</p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors notion-button"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

