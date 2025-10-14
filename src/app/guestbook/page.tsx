'use client'

import { useState, useEffect } from 'react'

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  date: string;
  approved: boolean;
}

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  useEffect(() => {
    // Load approved entries
    const stored = localStorage.getItem('guestbookEntries')
    if (stored) {
      const all = JSON.parse(stored)
      setEntries(all.filter((e: GuestbookEntry) => e.approved))
    }
  }, [])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !message.trim()) return
    
    const newEntry: GuestbookEntry = {
      id: Date.now(),
      name: name.trim(),
      message: message.trim(),
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      approved: false // Needs admin approval
    }
    
    // Save to pending entries
    const stored = localStorage.getItem('guestbookEntries') || '[]'
    const all = JSON.parse(stored)
    all.push(newEntry)
    localStorage.setItem('guestbookEntries', JSON.stringify(all))
    
    setSubmitted(true)
    setName('')
    setMessage('')
    
    setTimeout(() => setSubmitted(false), 3000)
  }
  
  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-3xl mx-auto">
        <section>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-4 mobile-hide-title">Guestbook</h1>
              <p className="text-sm text-muted leading-relaxed">
                Leave a message, share your thoughts, or just say hi! All messages are reviewed before appearing.
              </p>
            </div>

            {/* Submit Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-serif mb-4">Sign the Guestbook</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Jane Doe"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    placeholder="Love your work! Keep it up..."
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-muted mt-1">{message.length}/500 characters</p>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg shadow-sm notion-button"
                >
                  {submitted ? '✓ Submitted for Review!' : 'Submit Message'}
                </button>
                {submitted && (
                  <p className="text-sm text-accent">
                    Thanks! Your message will appear after approval.
                  </p>
                )}
              </form>
            </div>

            {/* Approved Entries */}
            <div>
              <h2 className="text-2xl font-serif mb-4">Messages ({entries.length})</h2>
              {entries.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted">No messages yet. Be the first to sign!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="p-4 bg-card border border-border rounded-lg notion-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{entry.name}</h3>
                          <p className="text-xs text-muted">{entry.date}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{entry.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-border">
              <p className="text-xs text-muted italic">
                💡 Tip: All messages are reviewed by me before appearing publicly. 
                Please keep it friendly and respectful!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

