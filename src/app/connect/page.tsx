'use client'

import GuestbookBook from '@/app/components/GuestbookBook'

const SOCIAL_LINKS = [
  { label: 'X', icon: 'X', href: 'https://x.com/yourusername' },
  { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/in/yourusername' },
  { label: 'Email', icon: '✉', href: 'mailto:your.email@example.com' },
]

export default function Connect() {
  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content bg-background">
      <div className="w-full">
        <section className="space-y-5">
          <h1 className="sr-only">Connect</h1>

          <div className="connect-icons-shell hidden max-sm:flex page-load-seq page-load-seq-1">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="connect-icon-link"
              >
                <span className={`connect-icon-badge ${item.label === 'Email' ? 'connect-icon-badge-email' : ''}`}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div className="connect-board-shell page-load-seq page-load-seq-2">
            <GuestbookBook compact />
          </div>
        </section>
      </div>
    </div>
  )
}
