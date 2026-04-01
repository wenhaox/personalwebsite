'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type PhotoSort = 'theme' | 'color' | 'location' | 'date'

const PHOTO_SORT_OPTIONS: Array<{ key: PhotoSort | 'all'; icon: string; label: string; href: string }> = [
  { key: 'all', icon: '◍', label: 'All Photos', href: '/photos' },
  { key: 'date', icon: '◴', label: 'Date', href: '/photos?sort=date' },
  { key: 'color', icon: '◉', label: 'Color', href: '/photos?sort=color' },
  { key: 'location', icon: '⌖', label: 'Location', href: '/photos?sort=location' },
  { key: 'theme', icon: '◈', label: 'Theme', href: '/photos?sort=theme' },
]

interface SidebarPhotoSeed {
  theme: string
  color: string
  location: string
  createdAt?: string
}

interface SidebarFilterItem {
  icon: string
  label: string
  value: string
}

const PHOTO_DATA_SEED: SidebarPhotoSeed[] = [
  { theme: 'street', color: 'blue', location: 'San Francisco, CA', createdAt: '2026-03-29T08:00:00.000Z' },
  { theme: 'scenery', color: 'golden', location: 'Marin County, CA', createdAt: '2026-03-26T18:00:00.000Z' },
  { theme: 'person', color: 'warm', location: 'Studio', createdAt: '2026-03-22T13:00:00.000Z' },
  { theme: 'details', color: 'monochrome', location: 'Downtown', createdAt: '2026-03-19T14:00:00.000Z' },
  { theme: 'scenery', color: 'green', location: 'Muir Woods, CA', createdAt: '2026-03-15T09:00:00.000Z' },
  { theme: 'street', color: 'blue', location: 'Urban', createdAt: '2026-03-11T10:30:00.000Z' },
]

const toTitleLabel = (value: string): string => (
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
)

const getDateBucket = (createdAt?: string): string | null => {
  if (!createdAt) return null
  const parsed = new Date(createdAt).getTime()
  if (Number.isNaN(parsed)) return null

  const date = new Date(parsed)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const getDateBucketLabel = (bucket: string): string => {
  const [year, month] = bucket.split('-')
  const yearNum = Number(year)
  const monthNum = Number(month)

  if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return bucket
  }

  return new Date(yearNum, monthNum - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const buildPhotoQuickFilters = (photos: SidebarPhotoSeed[]): Record<PhotoSort, SidebarFilterItem[]> => {
  const themeMap = new Map<string, string>()
  const colorMap = new Map<string, string>()
  const locationMap = new Map<string, string>()
  const dateMap = new Map<string, string>()

  photos.forEach((photo) => {
    const themeValue = photo.theme.trim().toLowerCase()
    if (themeValue) themeMap.set(themeValue, toTitleLabel(themeValue))

    const colorValue = photo.color.trim().toLowerCase()
    if (colorValue) colorMap.set(colorValue, toTitleLabel(colorValue))

    const locationValue = photo.location.split(',')[0].trim()
    if (locationValue) locationMap.set(locationValue, locationValue)

    const bucket = getDateBucket(photo.createdAt)
    if (bucket) dateMap.set(bucket, getDateBucketLabel(bucket))
  })

  const toItems = (map: Map<string, string>, icon: string, sortByLabel = true): SidebarFilterItem[] => {
    const entries = Array.from(map.entries()).map(([value, label]) => ({ icon, label, value }))
    if (sortByLabel) {
      return entries.sort((a, b) => a.label.localeCompare(b.label))
    }
    return entries.sort((a, b) => b.value.localeCompare(a.value))
  }

  return {
    theme: toItems(themeMap, '●'),
    color: toItems(colorMap, '●'),
    location: toItems(locationMap, '●'),
    date: toItems(dateMap, '◷', false),
  }
}

const getSidebarIconClassName = (icon: string): string => {
  if (icon === '◍' || icon === '◌') return 'sidebar-context-icon sidebar-context-icon-all'
  if (icon === '⌖') return 'sidebar-context-icon sidebar-context-icon-location'
  if (icon === '◷') return 'sidebar-context-icon sidebar-context-icon-date'
  return 'sidebar-context-icon'
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clickCount, setClickCount] = useState(0)
  const [photoQuickFilters, setPhotoQuickFilters] = useState<Record<PhotoSort, SidebarFilterItem[]>>(
    () => buildPhotoQuickFilters(PHOTO_DATA_SEED)
  )

  const socialLinks = [
    { label: 'X', icon: 'X', href: 'https://x.com/yourusername' },
    { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com/in/yourusername' },
    { label: 'Email', icon: '✉', href: 'mailto:your.email@example.com' },
  ]

  const desktopConnectLinks = socialLinks

  const sortParam = searchParams.get('sort')
  const tagParam = searchParams.get('tag')?.trim() || ''
  const selectedSort: PhotoSort | null = sortParam && ['date', 'color', 'location', 'theme'].includes(sortParam)
    ? (sortParam as PhotoSort)
    : null
  const selectedTagLower = tagParam.toLowerCase()

  const selectedSortLabel = selectedSort
    ? PHOTO_SORT_OPTIONS.find((option) => option.key === selectedSort)?.label || 'Sort'
    : ''
  const selectedSortFilters = useMemo(
    () => (selectedSort ? photoQuickFilters[selectedSort].slice(0, 8) : []),
    [photoQuickFilters, selectedSort]
  )

  useEffect(() => {
    const stored = localStorage.getItem('customPhotos')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return

      const customPhotos: SidebarPhotoSeed[] = parsed.map((photo) => ({
        theme: typeof photo.theme === 'string' ? photo.theme : 'moments',
        color: typeof photo.color === 'string' ? photo.color : 'neutral',
        location: typeof photo.location === 'string' ? photo.location : 'Unknown',
        createdAt: typeof photo.createdAt === 'string' ? photo.createdAt : undefined,
      }))

      setPhotoQuickFilters(buildPhotoQuickFilters([...PHOTO_DATA_SEED, ...customPhotos]))
    } catch {
      setPhotoQuickFilters(buildPhotoQuickFilters(PHOTO_DATA_SEED))
    }
  }, [])

  const navItems = [
    { name: 'About', href: '/' },
    { name: 'Photos', href: '/photos' },
    { name: 'Recently', href: '/recently' },
    { name: 'Connect', href: '/connect' },
  ]

  const handleLogoClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    
    if (newCount === 5) {
      // Direct access to admin - no password needed
      router.push('/admin')
      setClickCount(0)
    }
    
    // Reset after 3 seconds of no clicks
    setTimeout(() => setClickCount(0), 3000)
  }

  return (
    <nav className="w-80 h-screen p-12 flex flex-col justify-start mobile-nav fixed left-0 top-0" style={{paddingTop: 'calc(20vh + 8px)'}}>
      <div className="space-y-8 ml-16 mobile-nav-content">
        {/* Logo diamonds - click 5x for admin */}
        <div className="flex gap-2 cursor-pointer" onClick={handleLogoClick}>
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
        </div>


        {/* Navigation Links */}
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
            <div className="sidebar-context-title">Browse Photos</div>
            <div className="sidebar-context-links">
              {PHOTO_SORT_OPTIONS.map((item) => {
                const isActive = item.key === 'all'
                  ? !selectedSort
                  : selectedSort === item.key

                return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`sidebar-context-link sidebar-photo-pill ${isActive ? 'sidebar-photo-pill-active' : ''}`}
                >
                  <span className={getSidebarIconClassName(item.icon)}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
                )
              })}
            </div>

            <div className="sidebar-context-title">Quick Filters</div>
            <div className="sidebar-context-links">
              {!selectedSort && (
                <div className="sidebar-context-text">
                  Choose a sort to reveal matching quick filters.
                </div>
              )}

              {selectedSort && (
                <>
                  <Link
                    href={`/photos?sort=${selectedSort}`}
                    className={`sidebar-context-link sidebar-photo-pill ${!selectedTagLower ? 'sidebar-photo-pill-active' : ''}`}
                  >
                    <span className={getSidebarIconClassName('◌')}>◌</span>
                    <span>All {selectedSortLabel}</span>
                  </Link>

                  {selectedSortFilters.map((item) => {
                    const isActive = selectedTagLower === item.value.toLowerCase()

                    return (
                      <Link
                        key={`${selectedSort}-${item.value}`}
                        href={`/photos?sort=${selectedSort}&tag=${encodeURIComponent(item.value)}`}
                        className={`sidebar-context-link sidebar-photo-pill ${isActive ? 'sidebar-photo-pill-active' : ''}`}
                      >
                        <span className={getSidebarIconClassName(item.icon)}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {pathname === '/connect' && (
          <div className="sidebar-connect-links mobile-hide-photo">
            {desktopConnectLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="sidebar-connect-link"
              >
                <span>{item.label}</span>
                <span className={`sidebar-connect-icon ${item.label === 'Email' ? 'sidebar-connect-icon-email' : ''}`}>{item.icon}</span>
              </a>
            ))}
          </div>
        )}

        {/* Photo - hidden on mobile, shown on desktop home page only */}
        {pathname === '/' && (
          <div className="w-48 h-64 bg-muted/10 rounded-2xl overflow-hidden flex items-end mobile-hide-photo" style={{
            backgroundImage: 'url(https://picsum.photos/id/1005/480/640)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <span className="w-full text-center text-[11px] text-stone-100 bg-black/35 py-2 backdrop-blur-[1px]">placeholder</span>
          </div>
        )}
      </div>
    </nav>
  )
}

