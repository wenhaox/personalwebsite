'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type PhotoSort = 'theme' | 'color' | 'location' | 'date'

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'

const PHOTO_SORT_OPTIONS: Array<{ key: PhotoSort | 'all'; icon: string; label: string; href: string }> = [
  { key: 'all', icon: '◍', label: 'All Photos', href: '/photos' },
  { key: 'date', icon: '◴', label: 'Date', href: '/photos?sort=date' },
  { key: 'color', icon: '◉', label: 'Color', href: '/photos?sort=color' },
  { key: 'location', icon: '⌖', label: 'Location', href: '/photos?sort=location' },
  { key: 'theme', icon: '◈', label: 'Theme', href: '/photos?sort=theme' },
]

const SOCIAL_LINKS = [
  { label: 'X', icon: 'X', href: 'https://x.com/yourusername' },
  { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/in/yourusername' },
  { label: 'Email', icon: '@', href: 'mailto:your.email@example.com' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortParam = searchParams.get('sort')
  const orderParam = searchParams.get('order')
  const selectedSort: PhotoSort | null = sortParam && ['date', 'color', 'location', 'theme'].includes(sortParam)
    ? (sortParam as PhotoSort)
    : null
  const orderChoices = selectedSort === 'date'
    ? [{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'most', label: 'Most photos' }]
    : [{ value: 'az', label: 'A–Z' }, { value: 'za', label: 'Z–A' }, { value: 'most', label: 'Most photos' }]
  const defaultOrder = selectedSort === 'date' ? 'newest' : 'az'
  const selectedOrder = orderChoices.some((option) => option.value === orderParam)
    ? (orderParam as string)
    : defaultOrder

  const navItems = [
    { name: 'About', href: '/' },
    { name: 'Photos', href: '/photos' },
    { name: 'Recently', href: '/recently' },
    { name: 'Connect', href: '/connect' },
  ]

  const handleRecentlyShelfDice = () => {
    window.dispatchEvent(new Event(RECENTLY_SHUFFLE_EVENT))
  }

  return (
    <nav
      className="w-80 h-screen p-12 flex flex-col justify-start mobile-nav fixed left-0 top-0"
      style={{ paddingTop: 'calc(20vh + 8px)' }}
    >
      <div className="space-y-8 ml-16 mobile-nav-content">
        <div className="flex gap-2">
          <div
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            }}
          />
          <div
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            }}
          />
        </div>

        <div className="space-y-2 mobile-nav-links mobile-override-space">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block text-sm transition-colors hover:text-accent ${
                pathname === item.href ? 'text-accent font-medium' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {pathname === '/photos' && (
          <div className="sidebar-photos-panel mobile-hide-photo">
            <div className="photo-sort-panel">
              <p className="photo-sort-heading">Group by</p>
              <div className="photo-sort-list" role="tablist" aria-label="Sort photos">
                {PHOTO_SORT_OPTIONS.map((item) => {
                  const isActive = item.key === 'all'
                    ? !selectedSort
                    : selectedSort === item.key
                  const href = item.key === 'all'
                    ? '/photos'
                    : `/photos?sort=${item.key}&order=${item.key === 'date' ? 'newest' : 'az'}`
                  const label = item.label === 'All Photos' ? 'All' : item.label

                  return (
                    <Link
                      key={item.key}
                      href={href}
                      role="tab"
                      aria-selected={isActive}
                      className={`photo-sort-option ${isActive ? 'is-active' : ''}`}
                    >
                      {label}
                    </Link>
                  )
                })}
              </div>

              {selectedSort && (
                <label className="photo-order-field">
                  <span className="photo-sort-heading">Order</span>
                  <select
                    className="photo-order-select"
                    value={selectedOrder}
                    aria-label="Order photos"
                    onChange={(event) => {
                      router.push(`/photos?sort=${selectedSort}&order=${event.target.value}`)
                    }}
                  >
                    {orderChoices.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {pathname === '/connect' && (
          <div className="sidebar-connect-links mobile-hide-photo">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="sidebar-connect-link"
                aria-label={item.label}
              >
                <span className={`sidebar-connect-icon ${item.label === 'Email' ? 'sidebar-connect-icon-email' : ''}`}>{item.icon}</span>
              </a>
            ))}
          </div>
        )}

        {pathname === '/recently' && (
          <div className="sidebar-recently-dice-panel mobile-hide-photo">
            <button
              type="button"
              className="sidebar-recently-dice-btn"
              onClick={(event) => {
                const button = event.currentTarget
                button.classList.remove('is-rolling')
                // restart animation
                void button.offsetWidth
                button.classList.add('is-rolling')
                window.setTimeout(() => button.classList.remove('is-rolling'), 900)
                handleRecentlyShelfDice()
              }}
              aria-label="Shuffle shelf"
              title="Shuffle shelf"
            >
              <img src="/pixel-objects/dice-cube.svg" alt="" aria-hidden="true" className="sidebar-recently-dice-art" />
            </button>
          </div>
        )}

        {pathname === '/' && (
          <div
            className="w-48 h-64 bg-muted/10 rounded-md overflow-hidden flex items-end mobile-hide-photo"
            style={{
              backgroundImage: 'url(https://picsum.photos/id/1005/480/640)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <span className="w-full text-center text-[11px] text-stone-100 bg-black/35 py-2 backdrop-blur-[1px]">placeholder</span>
          </div>
        )}
      </div>
    </nav>
  )
}
