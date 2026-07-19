'use client'

import GuestbookBook from '@/app/components/GuestbookBook'

const SOCIAL_LINKS = [
  { label: 'X', icon: 'X', href: 'https://x.com/yourusername' },
  { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/in/yourusername' },
  { label: 'Email', icon: '@', href: 'mailto:your.email@example.com' },
]

export default function Connect() {
  return (
    <div className="connect-page-root mobile-main-content bg-background">
      <div className="connect-page-inner">
        <section className="connect-page-section">
          <h1 className="sr-only">Connect</h1>

          <div className="connect-board-shell page-load-seq page-load-seq-1">
            <GuestbookBook compact fullHeight showZoomTools={false} enableBoardZoom={false} />
          </div>

          <div className="connect-social-under">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="connect-social-under-link"
                aria-label={item.label}
              >
                <span className={`connect-social-under-icon ${item.label === 'Email' ? 'is-email' : ''}`}>{item.icon}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
