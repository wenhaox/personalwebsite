'use client'

import { useState, useEffect } from 'react'

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  date: string;
  approved: boolean;
}

export default function Connect() {
  const [copied, setCopied] = useState(false)
  const email = 'your.email@example.com'
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
  
  const copyEmail = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
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
      approved: false
    }
    
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
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-4 mobile-hide-title">Connect</h1>
            <p className="text-sm text-muted leading-relaxed">
              I&apos;m always excited to meet new people, collaborate on interesting projects, 
              or simply have a good conversation over coffee.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif mb-3">Get in Touch</h2>
                <div className="space-y-3">
                  <button
                    onClick={copyEmail}
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group relative"
                    title="Click to copy email"
                  >
                    <span className="text-accent font-bold">@</span>
                    <span className="group-hover:underline">{email}</span>
                    {copied && (
                      <span className="absolute -right-20 text-xs bg-accent text-stone-100 px-2 py-1 rounded animate-fade-in">
                        Copied!
                      </span>
                    )}
                  </button>
                  
                  <a 
                    href="https://twitter.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">T</span>
                    <span className="group-hover:underline">Twitter</span>
                  </a>
                  
                  <a 
                    href="https://instagram.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">I</span>
                    <span className="group-hover:underline">Instagram</span>
                  </a>
                  
                  <a 
                    href="https://linkedin.com/in/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">L</span>
                    <span className="group-hover:underline">LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif mb-3">Current Status</h2>
                <div className="space-y-3">
                    <div className="p-3 bg-card border border-border rounded-lg notion-card">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Available for new projects</span>
                      </div>
                      <p className="text-xs text-muted">
                        Currently accepting freelance photography work.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-card border border-border rounded-lg notion-card">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span className="text-sm font-medium">Based in San Francisco</span>
                      </div>
                      <p className="text-xs text-muted">
                        Happy to meet for coffee.
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guestbook Section */}
          <div className="pt-6 border-t border-border">
            <h2 className="text-xl font-serif mb-4">Guestbook</h2>
            
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Form - Left Side */}
              <div className="flex flex-col">
                <p className="text-sm text-muted mb-4">
                  Leave a message! All entries are reviewed before appearing.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your name"
                    required
                    maxLength={50}
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    placeholder="Your message..."
                    required
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-sm bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg notion-button"
                  >
                    {submitted ? '✓ Submitted for Review!' : 'Sign Guestbook'}
                  </button>
                </form>
              </div>
              
              {/* Messages - Right Side */}
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-muted mb-3">
                  Recent Messages {entries.length > 0 && `(${entries.length})`}
                </h3>
                {entries.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">👋</div>
                    <div className="empty-state-title">No messages yet</div>
                    <div className="empty-state-message">Be the first to sign the guestbook!</div>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {entries.slice(0, 5).map((entry) => (
                      <div 
                        key={entry.id}
                        className="p-3 bg-card border border-border rounded-lg notion-card"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium">{entry.name}</span>
                          <span className="text-xs text-muted">{entry.date}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{entry.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}