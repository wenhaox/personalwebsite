'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const commands = [
    { name: 'Home', shortcut: '1', action: () => router.push('/') },
    { name: 'Photos', shortcut: '2', action: () => router.push('/photos') },
    { name: 'Recently', shortcut: '3', action: () => router.push('/recently') },
    { name: 'Connect', shortcut: '4', action: () => router.push('/connect') },
    { name: 'Admin Panel', shortcut: 'A', action: () => router.push('/admin') },
    { name: 'Toggle Dark Mode', shortcut: 'D', action: () => {
      document.documentElement.classList.toggle('dark')
    }},
  ]

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      
      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
      }

      // Number keys for quick navigation (when palette is closed)
      if (!isOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key
        if (key >= '1' && key <= '4') {
          e.preventDefault()
          const command = commands[parseInt(key) - 1]
          command.action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const executeCommand = (command: typeof commands[0]) => {
    command.action()
    setIsOpen(false)
    setSearch('')
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-32"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-foreground placeholder:text-muted focus:outline-none text-lg"
            autoFocus
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={index}
                onClick={() => executeCommand(command)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/10 transition-colors text-left group"
              >
                <span className="text-foreground group-hover:text-accent transition-colors">
                  {command.name}
                </span>
                <kbd className="px-2 py-1 text-xs bg-muted/20 border border-border rounded">
                  {command.shortcut}
                </kbd>
              </button>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-3 border-t border-border bg-muted/5 text-xs text-muted flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted/20 border border-border rounded">ESC</kbd> to close</span>
          <span>Quick nav: <kbd className="px-1.5 py-0.5 bg-muted/20 border border-border rounded">1-4</kbd></span>
        </div>
      </div>
    </div>
  )
}

