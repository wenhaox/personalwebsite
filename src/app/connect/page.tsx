'use client'

import GuestbookBook from '@/app/components/GuestbookBook'

const SOCIAL_LINKS = [
  { label: 'X', icon: 'X', href: 'https://x.com/yourusername' },
  { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/in/yourusername' },
  { label: 'Email', icon: '@', href: 'mailto:your.email@example.com' },
]

export default function Connect() {
  return (
    <div className="connect-page-root flex items-stretch justify-start min-h-[100dvh] overflow-y-auto px-32 py-10 mobile-main-content bg-background">
      <div className="w-full flex flex-col">
        <section className="space-y-5 flex flex-col flex-1 min-h-0">
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

          <div className="connect-board-shell page-load-seq page-load-seq-2 flex-1 min-h-0">
            <GuestbookBook compact fullHeight showZoomTools={false} enableBoardZoom={false} />
          </div>
        </section>
      </div>
    </div>
  )
}
