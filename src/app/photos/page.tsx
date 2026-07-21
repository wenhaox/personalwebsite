'use client'

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import { SITE_PHOTOS } from '@/data/site-photos'
import type { PhotoItem } from '@/lib/photo-types'

type SortBy = 'theme' | 'color' | 'location' | 'date'
type OrderBy = 'newest' | 'oldest' | 'az' | 'za' | 'most'

export type { PhotoItem }

interface PhotoCluster {
  key: string
  value: string
  label: string
  photos: PhotoItem[]
}

const SORT_OPTIONS: Array<{ key: SortBy; icon: string; label: string }> = [
  { key: 'theme', icon: '◈', label: 'Theme' },
  { key: 'color', icon: '◉', label: 'Color' },
  { key: 'location', icon: '⌖', label: 'Location' },
  { key: 'date', icon: '◴', label: 'Date' },
]

const TIME_ORDER_OPTIONS: Array<{ key: OrderBy; label: string }> = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'most', label: 'Most photos' },
]

const ALPHA_ORDER_OPTIONS: Array<{ key: OrderBy; label: string }> = [
  { key: 'az', label: 'A–Z' },
  { key: 'za', label: 'Z–A' },
  { key: 'most', label: 'Most photos' },
]

const getOrderOptions = (sortBy: SortBy | null): Array<{ key: OrderBy; label: string }> => (
  sortBy === 'date' ? TIME_ORDER_OPTIONS : ALPHA_ORDER_OPTIONS
)

const getDefaultOrder = (sortBy: SortBy | null): OrderBy => (
  sortBy === 'date' ? 'newest' : 'az'
)

const DEFAULT_PHOTOS: PhotoItem[] = SITE_PHOTOS

const PALETTE_LABELS: Record<string, string> = {
  blue: 'cool blues',
  golden: 'golden tones',
  warm: 'warm neutrals',
  monochrome: 'mono contrast',
  green: 'green tones',
}

const THEME_LABELS: Record<string, string> = {
  people: 'people',
  landscape: 'landscape',
  street: 'street',
  interior: 'interior',
  detail: 'detail',
}

const normalizePhoto = (photo: Partial<PhotoItem>, index: number): PhotoItem => ({
  id: photo.id ?? `custom-${index}`,
  title: photo.title?.trim() || 'Untitled Moment',
  location: photo.location?.trim() || 'Unknown location',
  aspectRatio: photo.aspectRatio || 'aspect-[4/3]',
  color: photo.color?.trim() || 'neutral',
  theme: photo.theme?.trim() || 'detail',
  description: photo.description?.trim() || 'A quiet frame from daily life.',
  createdAt: typeof photo.createdAt === 'string' ? photo.createdAt : undefined,
  imageUrl: typeof photo.imageUrl === 'string' ? photo.imageUrl : undefined,
  favorite: Boolean(photo.favorite),
})

const toIdKey = (id: number | string): string => String(id)

const getPhotoImage = (photo: PhotoItem, idKey: string): string => (
  photo.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(`photo-${idKey}`)}/1200/1600`
)

/** Resize picsum-style /w/h URLs to a target width (keeps aspect). */
const resizePhotoUrl = (url: string, targetW: number): string => {
  const match = url.match(/^(.*?)\/(\d+)\/(\d+)(\?.*)?$/)
  if (!match) return url

  const base = match[1]
  const width = Number(match[2])
  const height = Number(match[3])
  const query = match[4] || ''

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= targetW) return url

  const targetH = Math.max(1, Math.round((height * targetW) / width))
  return `${base}/${targetW}/${targetH}${query}`
}

const isNarrowViewport = () => (
  typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
)

/** Width tuned for the lightbox — phone stays modest so files stay small. */
const getLightboxTargetWidth = () => {
  if (typeof window === 'undefined') return 1100
  if (!isNarrowViewport()) return 1100
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  return Math.min(860, Math.max(640, Math.round(window.innerWidth * dpr)))
}

const getPhotoThumb = (photo: PhotoItem, idKey: string): string => (
  resizePhotoUrl(getPhotoImage(photo, idKey), 360)
)

const getPhotoLightboxImage = (photo: PhotoItem, idKey: string): string => (
  resizePhotoUrl(getPhotoImage(photo, idKey), getLightboxTargetWidth())
)

/**
 * Grid/strip source. On phone this matches the lightbox URL so tap-open
 * is usually already in the HTTP cache (biggest perceived speedup).
 */
const getPhotoStripImage = (photo: PhotoItem, idKey: string): string => {
  if (isNarrowViewport()) return getPhotoLightboxImage(photo, idKey)
  return getPhotoThumb(photo, idKey)
}

const fullImagePreloadCache = new Map<string, HTMLImageElement>()

const preloadFullPhoto = (photo: PhotoItem) => {
  const idKey = toIdKey(photo.id)
  const fullSrc = getPhotoLightboxImage(photo, idKey)
  const cached = fullImagePreloadCache.get(fullSrc)
  if (cached) return cached

  const image = new window.Image()
  image.decoding = 'async'
  try {
    image.fetchPriority = 'high'
  } catch {
    // Older browsers may not support fetchPriority on Image().
  }
  image.src = fullSrc
  fullImagePreloadCache.set(fullSrc, image)
  return image
}

const warmPhotoBatch = (list: PhotoItem[], limit = 8) => {
  list.slice(0, limit).forEach((photo) => {
    preloadFullPhoto(photo)
  })
}

const getDateBucket = (timestamp: number): string => {
  const date = new Date(timestamp)
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
    month: 'long',
    year: 'numeric',
  })
}

const getClusterValue = (photo: PhotoItem, sortBy: SortBy, timestampMap: Map<string, number>): string => {
  if (sortBy === 'date') {
    const timestamp = timestampMap.get(toIdKey(photo.id)) || Date.now()
    return getDateBucket(timestamp)
  }

  if (sortBy === 'location') {
    return photo.location.trim() || 'Unknown'
  }

  return photo[sortBy]
}

const getClusterLabel = (sortBy: SortBy, value: string): string => {
  if (sortBy === 'date') return getDateBucketLabel(value)
  if (sortBy === 'color') return PALETTE_LABELS[value.toLowerCase()] || value
  if (sortBy === 'theme') return THEME_LABELS[value.toLowerCase()] || value
  return value
}

const isPortraitAspect = (aspectRatio: string): boolean => {
  if (aspectRatio === 'aspect-square') return false

  const ratioMatch = aspectRatio.match(/(\d+)\s*\/\s*(\d+)/)
  if (!ratioMatch) {
    return aspectRatio.includes('2/3') || aspectRatio.includes('3/5') || aspectRatio.includes('3/4')
  }

  const width = Number(ratioMatch[1])
  const height = Number(ratioMatch[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) return false
  return width < height
}

const getAspectSize = (aspectRatio: string): { width: number; height: number } => {
  if (aspectRatio === 'aspect-square') return { width: 1200, height: 1200 }

  const ratioMatch = aspectRatio.match(/(\d+)\s*\/\s*(\d+)/)
  if (!ratioMatch) return { width: 1200, height: 900 }

  const width = Number(ratioMatch[1])
  const height = Number(ratioMatch[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1200, height: 900 }
  }

  return { width: width * 400, height: height * 400 }
}

interface FilmReelClusterProps {
  cluster: PhotoCluster
  clusterIndex: number
  sortBy: SortBy
  timestampMap: Map<string, number>
  onSelectPhoto: (photo: PhotoItem) => void
}

const getPhotoCategoryTag = (
  photo: PhotoItem,
  sortBy: SortBy,
  timestampMap: Map<string, number>
): string => {
  if (sortBy === 'theme') return getClusterLabel('theme', photo.theme)
  if (sortBy === 'color') return getClusterLabel('color', photo.color)
  if (sortBy === 'location') return photo.location
  if (sortBy === 'date') {
    return getClusterLabel('date', getClusterValue(photo, 'date', timestampMap))
  }
  return photo.title
}

function useFilmStripViewport() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const desktopMedia = window.matchMedia('(min-width: 901px)')
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setIsDesktop(desktopMedia.matches)
      setReduceMotion(motionMedia.matches)
    }
    sync()
    desktopMedia.addEventListener('change', sync)
    motionMedia.addEventListener('change', sync)
    return () => {
      desktopMedia.removeEventListener('change', sync)
      motionMedia.removeEventListener('change', sync)
    }
  }, [])

  return { isDesktop, reduceMotion }
}

function FilmReelCluster({ cluster, clusterIndex, sortBy, timestampMap, onSelectPhoto }: FilmReelClusterProps) {
  const sourcePhotos = cluster.photos
  const sourcePhotoCount = sourcePhotos.length
  const { isDesktop, reduceMotion } = useFilmStripViewport()
  const direction = clusterIndex % 2 === 0 ? 1 : -1
  const shellRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  const measureOverflow = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return

    const slides = Array.from(shell.querySelectorAll('.photo-film-slide')).slice(0, sourcePhotoCount) as HTMLElement[]
    if (slides.length === 0) {
      setOverflows(false)
      return
    }

    const totalWidth = slides.reduce((sum, slide, index) => {
      const rect = slide.getBoundingClientRect().width
      const marginRight = index < slides.length - 1
        ? (parseFloat(window.getComputedStyle(slide).marginRight) || 0)
        : 0
      return sum + rect + marginRight
    }, 0)
    setOverflows(totalWidth > shell.clientWidth + 8)
  }, [sourcePhotoCount])

  useLayoutEffect(() => {
    measureOverflow()
  }, [measureOverflow, sourcePhotos])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const observer = new ResizeObserver(() => {
      measureOverflow()
    })
    observer.observe(shell)
    window.addEventListener('resize', measureOverflow)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureOverflow)
    }
  }, [measureOverflow])

  // Auto-scroll on mobile too — the strip is the browse surface when sorted,
  // and continuous motion helps you discover frames without dragging every one.
  const shouldAutoScroll = overflows && sourcePhotoCount > 1 && !reduceMotion
  const scrollSpeed = (isDesktop ? 0.55 : 0.38) * direction

  const loopPhotos = useMemo(() => {
    const base = sourcePhotos.map((photo, index) => ({
      photo,
      key: `${cluster.key}-0-${toIdKey(photo.id)}-${index}`,
    }))

    if (!shouldAutoScroll) return base

    const minSlides = Math.max(10, sourcePhotoCount * 2)
    const copies = Math.max(2, Math.ceil(minSlides / sourcePhotoCount))

    return Array.from({ length: copies }, (_, copyIndex) =>
      sourcePhotos.map((photo, photoIndex) => ({
        photo,
        key: `${cluster.key}-${copyIndex}-${toIdKey(photo.id)}-${photoIndex}`,
      }))
    ).flat()
  }, [cluster.key, shouldAutoScroll, sourcePhotos, sourcePhotoCount])

  const plugins = useMemo(() => {
    const list = [WheelGesturesPlugin()]
    if (shouldAutoScroll) {
      list.unshift(
        AutoScroll({
          playOnInit: true,
          speed: scrollSpeed,
          startDelay: isDesktop ? 500 : 700,
          stopOnInteraction: !isDesktop,
          stopOnMouseEnter: isDesktop,
          stopOnFocusIn: true,
        })
      )
    }
    return list
  }, [isDesktop, scrollSpeed, shouldAutoScroll])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: shouldAutoScroll,
      align: 'start',
      dragFree: true,
      containScroll: shouldAutoScroll ? false : 'trimSnaps',
      skipSnaps: true,
      duration: 20,
    },
    plugins
  )

  useEffect(() => {
    if (!emblaApi) return
    // Re-measure after portrait/landscape widths settle so spacing stays correct.
    const id = window.requestAnimationFrame(() => {
      emblaApi.reInit()
      measureOverflow()
    })
    return () => window.cancelAnimationFrame(id)
  }, [emblaApi, loopPhotos, measureOverflow, shouldAutoScroll])

  // On mobile, pause while the user drags, then resume after a short idle.
  useEffect(() => {
    if (!emblaApi || !shouldAutoScroll || isDesktop) return

    const root = emblaApi.rootNode()
    let resumeTimer: ReturnType<typeof setTimeout> | undefined

    const stop = () => {
      if (resumeTimer) clearTimeout(resumeTimer)
      emblaApi.plugins()?.autoScroll?.stop()
    }

    const schedulePlay = () => {
      if (resumeTimer) clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        emblaApi.plugins()?.autoScroll?.play()
      }, 1600)
    }

    root.addEventListener('pointerdown', stop)
    root.addEventListener('pointerup', schedulePlay)
    root.addEventListener('pointercancel', schedulePlay)
    root.addEventListener('touchend', schedulePlay)

    return () => {
      if (resumeTimer) clearTimeout(resumeTimer)
      root.removeEventListener('pointerdown', stop)
      root.removeEventListener('pointerup', schedulePlay)
      root.removeEventListener('pointercancel', schedulePlay)
      root.removeEventListener('touchend', schedulePlay)
    }
  }, [emblaApi, isDesktop, shouldAutoScroll])

  return (
    <section className="photo-vsco-cluster-section">
      <div className="photo-vsco-cluster-section-head">
        <div className="photo-reel-meta" role="group" aria-label={`Photo roll ${cluster.label}`}>
          <span className="photo-reel-title">{cluster.label}</span>
          <span className="photo-reel-count">{sourcePhotoCount}</span>
        </div>
      </div>

      <div className="photo-film-strip-shell" ref={shellRef}>
        <div className="photo-film-embla" ref={emblaRef}>
          <div className="photo-film-embla-container">
            {loopPhotos.map(({ photo, key }, photoIndex) => {
              const idKey = toIdKey(photo.id)
              const portraitSource = isPortraitAspect(photo.aspectRatio)
              const squareSource = photo.aspectRatio === 'aspect-square'
              const slideShape = portraitSource ? 'is-portrait' : squareSource ? 'is-square' : 'is-landscape'

              return (
                <div key={key} className={`photo-film-slide ${slideShape}`}>
                  <button
                    type="button"
                    className="photo-film-frame"
                    onClick={() => onSelectPhoto(photo)}
                    onTouchStart={() => {
                      preloadFullPhoto(photo)
                    }}
                    onPointerDown={() => {
                      preloadFullPhoto(photo)
                    }}
                    onMouseEnter={() => {
                      preloadFullPhoto(photo)
                    }}
                    aria-label={`Preview ${photo.title}`}
                  >
                    <span className="photo-film-image-shell">
                      <img
                        src={getPhotoStripImage(photo, idKey)}
                        alt={photo.title}
                        loading={photoIndex < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={photoIndex < 2 ? 'high' : 'auto'}
                        className="photo-image-fade"
                        ref={(node) => {
                          if (node?.complete) node.classList.add('is-loaded')
                          // Warm lightbox (same URL on phone) as soon as the strip tile paints.
                          if (photoIndex < 6) preloadFullPhoto(photo)
                        }}
                        onLoad={(event) => {
                          event.currentTarget.classList.add('is-loaded')
                          if (photoIndex === 0) measureOverflow()
                        }}
                      />
                    </span>
                    <span className="photo-meta-overlay photo-meta-overlay-compact">
                      <span className="photo-meta-overlay-line">
                        {getPhotoCategoryTag(photo, sortBy, timestampMap)}
                      </span>
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function PhotographyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sortBy, setSortBy] = useState<SortBy | null>(null)
  const [filterTag, setFilterTag] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('newest')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [lightboxReady, setLightboxReady] = useState(false)
  const [customPhotos, setCustomPhotos] = useState<PhotoItem[]>([])

  const openPhoto = (photo: PhotoItem) => {
    setSelectedPhoto(photo)
    document.body.classList.add('photo-lightbox-open')

    const image = preloadFullPhoto(photo)
    const alreadyReady = image.complete && image.naturalWidth > 0
    setLightboxReady(alreadyReady)

    if (alreadyReady) return

    const markReady = () => setLightboxReady(true)
    image.addEventListener('load', markReady, { once: true })
    image.addEventListener('error', markReady, { once: true })
  }

  const closePhoto = () => {
    setSelectedPhoto(null)
    document.body.classList.remove('photo-lightbox-open')
  }

  useEffect(() => {
    const stored = localStorage.getItem('customPhotos')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setCustomPhotos(parsed.map((photo, index) => normalizePhoto(photo, index)))
      }
    } catch {
      setCustomPhotos([])
    }
  }, [])

  useEffect(() => () => {
    document.body.classList.remove('photo-lightbox-open')
  }, [])

  useEffect(() => {
    const sortParam = searchParams.get('sort')
    const tagParam = searchParams.get('tag')
    const orderParam = searchParams.get('order')
    const validSort = SORT_OPTIONS.some((option) => option.key === sortParam)
    const nextSort = validSort ? (sortParam as SortBy) : null
    const allowedOrders = getOrderOptions(nextSort).map((option) => option.key)
    const nextOrder = allowedOrders.includes(orderParam as OrderBy)
      ? (orderParam as OrderBy)
      : getDefaultOrder(nextSort)

    setSortBy(nextSort)
    setFilterTag(validSort && tagParam ? tagParam.trim() : '')
    setOrderBy(nextOrder)
    closePhoto()
  }, [searchParams])

  useEffect(() => {
    if (!selectedPhoto) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePhoto()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [selectedPhoto])

  const photos = useMemo(() => [...DEFAULT_PHOTOS, ...customPhotos], [customPhotos])

  const favoritePhotos = useMemo(
    () => photos.filter((photo) => photo.favorite),
    [photos]
  )

  const photoTimestampMap = useMemo(() => {
    const map = new Map<string, number>()

    photos.forEach((photo, index) => {
      const createdAtTime = photo.createdAt ? new Date(photo.createdAt).getTime() : Number.NaN
      const idAsTime = typeof photo.id === 'number' && photo.id > 1_000_000_000_000 ? photo.id : Number.NaN
      const fallback = 1_700_000_000_000 + index * 86_400_000

      if (!Number.isNaN(createdAtTime)) {
        map.set(toIdKey(photo.id), createdAtTime)
      } else if (!Number.isNaN(idAsTime)) {
        map.set(toIdKey(photo.id), idAsTime)
      } else {
        map.set(toIdKey(photo.id), fallback)
      }
    })

    return map
  }, [photos])

  const filteredByTag = useMemo(() => {
    if (!sortBy || !filterTag) return photos

    return photos.filter((photo) => {
      const value = getClusterValue(photo, sortBy, photoTimestampMap)
      return value.toLowerCase() === filterTag.toLowerCase()
    })
  }, [filterTag, photoTimestampMap, photos, sortBy])

  const clusters = useMemo<PhotoCluster[]>(() => {
    if (!sortBy) return []

    const activeSort = sortBy
    const activeOrder = orderBy
    const sourcePhotos = filteredByTag
    const grouped = new Map<string, PhotoCluster>()

    sourcePhotos.forEach((photo) => {
      const value = getClusterValue(photo, activeSort, photoTimestampMap)
      const key = `${activeSort}:${value}`.toLowerCase()
      const existing = grouped.get(key)

      if (existing) {
        existing.photos.push(photo)
        return
      }

      grouped.set(key, {
        key,
        value,
        label: getClusterLabel(activeSort, value),
        photos: [photo],
      })
    })

    const values = Array.from(grouped.values())

    const clusterTime = (cluster: PhotoCluster) => cluster.photos.reduce(
      (max, photo) => Math.max(max, photoTimestampMap.get(toIdKey(photo.id)) || 0),
      0
    )

    if (activeOrder === 'az') {
      values.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }))
    } else if (activeOrder === 'za') {
      values.sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true, sensitivity: 'base' }))
    } else if (activeOrder === 'most') {
      values.sort((a, b) => {
        const countDiff = b.photos.length - a.photos.length
        if (countDiff !== 0) return countDiff
        return clusterTime(b) - clusterTime(a)
      })
    } else if (activeOrder === 'oldest') {
      values.sort((a, b) => clusterTime(a) - clusterTime(b))
    } else {
      values.sort((a, b) => clusterTime(b) - clusterTime(a))
    }

    values.forEach((cluster) => {
      cluster.photos.sort((a, b) => {
        const timeA = photoTimestampMap.get(toIdKey(a.id)) || 0
        const timeB = photoTimestampMap.get(toIdKey(b.id)) || 0
        return activeOrder === 'oldest' ? timeA - timeB : timeB - timeA
      })
    })

    return values
  }, [filteredByTag, orderBy, photoTimestampMap, sortBy])

  const collagePhotos = useMemo(() => (
    [...favoritePhotos]
      .sort((a, b) => {
        const timeA = photoTimestampMap.get(toIdKey(a.id)) || 0
        const timeB = photoTimestampMap.get(toIdKey(b.id)) || 0
        return timeB - timeA
      })
      .map((photo) => {
        const idKey = toIdKey(photo.id)
        const size = getAspectSize(photo.aspectRatio)
        return {
          src: getPhotoStripImage(photo, idKey),
          width: size.width,
          height: size.height,
          alt: photo.title,
          key: idKey,
        }
      })
  ), [favoritePhotos, photoTimestampMap])

  useEffect(() => {
    if (photos.length === 0) return

    const runWarm = () => warmPhotoBatch(photos, isNarrowViewport() ? 10 : 6)
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleHandle: number | null = null
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null

    if (typeof w.requestIdleCallback === 'function') {
      idleHandle = w.requestIdleCallback(runWarm)
    } else {
      timeoutHandle = setTimeout(runWarm, 180)
    }

    return () => {
      if (idleHandle !== null && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle !== null) clearTimeout(timeoutHandle)
    }
  }, [photos])

  const pushSort = (nextSort: SortBy | null, nextOrder?: OrderBy) => {
    if (!nextSort) {
      router.push('/photos')
      return
    }

    const order = nextOrder || getDefaultOrder(nextSort)
    router.push(`/photos?sort=${nextSort}&order=${order}`)
  }

  return (
    <div className="photos-page-root mobile-main-content bg-background">
      <div className="photos-page-inner">
        <h1 className="sr-only">Photos</h1>

        <div className="photo-mobile-toolbar photo-inline-sorter">
          <div className="photo-mobile-filter-row" role="tablist" aria-label="Sort photos">
            <button
              type="button"
              role="tab"
              aria-selected={!sortBy}
              className={`photo-mobile-chip ${!sortBy ? 'is-active' : ''}`}
              onClick={() => pushSort(null)}
            >
              Favorites
            </button>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={sortBy === option.key}
                className={`photo-mobile-chip ${sortBy === option.key ? 'is-active' : ''}`}
                onClick={() => pushSort(option.key)}
              >
                {option.label}
              </button>
            ))}

            {sortBy && (
              <label className="photo-mobile-order">
                <select
                  className="photo-mobile-order-select"
                  value={orderBy}
                  aria-label="Order"
                  onChange={(event) => {
                    const nextOrder = event.target.value as OrderBy
                    setOrderBy(nextOrder)
                    router.push(`/photos?sort=${sortBy}&order=${nextOrder}`)
                  }}
                >
                  {getOrderOptions(sortBy).map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="photos-page-content">
        {!sortBy ? (
          <div className="photo-collage-shell">
            <MasonryPhotoAlbum
              photos={collagePhotos}
              spacing={8}
              columns={(containerWidth) => {
                if (containerWidth < 520) return 2
                if (containerWidth < 900) return 3
                return 4
              }}
              onClick={({ photo }) => {
                const match = favoritePhotos.find((item) => toIdKey(item.id) === photo.key)
                  || photos.find((item) => toIdKey(item.id) === photo.key)
                if (match) openPhoto(match)
              }}
              render={{
                image: (props, context) => {
                  const match = favoritePhotos.find((item) => toIdKey(item.id) === context.photo.key)
                    || photos.find((item) => toIdKey(item.id) === context.photo.key)
                  return (
                    <img
                      {...props}
                      className={`photo-image-fade photo-collage-image ${props.className || ''}`.trim()}
                      loading={context.index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={context.index < 3 ? 'high' : 'auto'}
                    onPointerDown={() => {
                      if (match) preloadFullPhoto(match)
                    }}
                    onTouchStart={() => {
                      if (match) preloadFullPhoto(match)
                    }}
                    onMouseEnter={() => {
                      if (match) preloadFullPhoto(match)
                    }}
                      onLoad={(event) => {
                        props.onLoad?.(event)
                        event.currentTarget.classList.add('is-loaded')
                      }}
                    />
                  )
                },
              }}
            />
          </div>
        ) : (
          <div className="photo-vsco-cluster-stack">
            {clusters.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No photos in this filter</div>
                <div className="empty-state-message">Try a different sort.</div>
              </div>
            ) : (
              clusters.map((cluster, clusterIndex) => (
                <FilmReelCluster
                  key={cluster.key}
                  cluster={cluster}
                  clusterIndex={clusterIndex}
                  sortBy={sortBy}
                  timestampMap={photoTimestampMap}
                  onSelectPhoto={openPhoto}
                />
              ))
            )}
          </div>
        )}

        {selectedPhoto && (
          <div
            className="photo-lightbox"
            onClick={closePhoto}
          >
            <div className="photo-lightbox-panel" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closePhoto}
                className="photo-lightbox-close"
                aria-label="Close photo view"
              >
                ✕
              </button>

              <div className="photo-lightbox-frame">
                <img
                  src={getPhotoStripImage(selectedPhoto, toIdKey(selectedPhoto.id))}
                  alt=""
                  aria-hidden="true"
                  className={`photo-lightbox-thumb ${lightboxReady ? 'is-faded' : ''}`}
                />
                {!lightboxReady && (
                  <div className="photo-lightbox-loading" aria-live="polite" aria-label="Loading photo">
                    <span className="photo-lightbox-spinner" aria-hidden="true" />
                  </div>
                )}
                <img
                  src={getPhotoLightboxImage(selectedPhoto, toIdKey(selectedPhoto.id))}
                  alt={selectedPhoto.title}
                  className={`photo-lightbox-image ${lightboxReady ? 'is-ready' : ''}`}
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => setLightboxReady(true)}
                />
              </div>

              <div className="photo-lightbox-meta">
                <h2 className="photo-lightbox-title">{selectedPhoto.title}</h2>
                <div className="photo-lightbox-line">
                  <span>{selectedPhoto.location}</span>
                  <span>|</span>
                  <span>{selectedPhoto.color}</span>
                  <span>|</span>
                  <span>{selectedPhoto.theme}</span>
                </div>
                <p className="photo-lightbox-copy">{selectedPhoto.description}</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default function PhotographyPage() {
  return (
    <Suspense fallback={<div className="photos-page-root min-h-screen bg-background" />}>
      <PhotographyClient />
    </Suspense>
  )
}
