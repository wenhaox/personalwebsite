'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type SortBy = 'theme' | 'color' | 'location' | 'date'
type OrderBy = 'newest' | 'oldest' | 'az' | 'za' | 'most'

interface PhotoItem {
  id: number | string
  title: string
  location: string
  aspectRatio: string
  color: string
  theme: string
  description: string
  createdAt?: string
  imageUrl?: string
}

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

const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    id: 1,
    title: 'City Lights',
    location: 'San Francisco, CA',
    aspectRatio: 'aspect-[3/4]',
    color: 'blue',
    theme: 'street',
    description: 'The quiet moments between the chaos',
    createdAt: '2026-03-29T08:00:00.000Z',
    imageUrl: 'https://picsum.photos/id/1011/1000/1400',
  },
  {
    id: 2,
    title: 'Golden Hour',
    location: 'Marin County, CA',
    aspectRatio: 'aspect-[4/3]',
    color: 'golden',
    theme: 'scenery',
    description: 'When the world glows softly',
    createdAt: '2026-03-26T18:00:00.000Z',
    imageUrl: 'https://picsum.photos/id/1025/1200/900',
  },
  {
    id: 3,
    title: 'Natural Light',
    location: 'Studio',
    aspectRatio: 'aspect-[2/3]',
    color: 'warm',
    theme: 'person',
    description: 'Capturing the essence of being',
    createdAt: '2026-03-22T13:00:00.000Z',
    imageUrl: 'https://picsum.photos/id/1005/900/1350',
  },
  {
    id: 4,
    title: 'Modern Lines',
    location: 'Downtown',
    aspectRatio: 'aspect-[16/9]',
    color: 'monochrome',
    theme: 'details',
    description: 'Where geometry meets emotion',
    createdAt: '2026-03-19T14:00:00.000Z',
    imageUrl: 'https://picsum.photos/id/1035/1400/800',
  },
  {
    id: 5,
    title: 'Forest Path',
    location: 'Muir Woods, CA',
    aspectRatio: 'aspect-[3/5]',
    color: 'green',
    theme: 'scenery',
    description: "Finding peace in nature's cathedral",
    createdAt: '2026-03-15T09:00:00.000Z',
    imageUrl: 'https://picsum.photos/id/1040/900/1500',
  },
  {
    id: 6,
    title: 'Reflections',
    location: 'Urban',
    aspectRatio: 'aspect-square',
    color: 'blue',
    theme: 'street',
    description: 'Reality bent through glass and light',
    createdAt: '2026-03-11T10:30:00.000Z',
    imageUrl: 'https://picsum.photos/id/1060/1200/1200',
  },
  {
    id: 7,
    title: 'Fogline',
    location: 'Twin Peaks, CA',
    aspectRatio: 'aspect-[16/9]',
    color: 'monochrome',
    theme: 'scenery',
    description: 'Morning fog cutting across the ridge.',
    createdAt: '2026-02-28T07:50:00.000Z',
    imageUrl: 'https://picsum.photos/id/1057/1400/900',
  },
  {
    id: 8,
    title: 'Window Seat',
    location: 'Oakland, CA',
    aspectRatio: 'aspect-[3/4]',
    color: 'warm',
    theme: 'person',
    description: 'Soft side light and a slow afternoon.',
    createdAt: '2026-02-21T16:20:00.000Z',
    imageUrl: 'https://picsum.photos/id/1027/1000/1400',
  },
  {
    id: 9,
    title: 'Crosswalk Rhythm',
    location: 'Shibuya, Tokyo',
    aspectRatio: 'aspect-[4/3]',
    color: 'blue',
    theme: 'street',
    description: 'Layered movement at every signal change.',
    createdAt: '2026-01-31T20:05:00.000Z',
    imageUrl: 'https://picsum.photos/id/1043/1200/900',
  },
  {
    id: 10,
    title: 'Paper Lanterns',
    location: 'Kyoto, JP',
    aspectRatio: 'aspect-[2/3]',
    color: 'golden',
    theme: 'details',
    description: 'Quiet glow before the rain started.',
    createdAt: '2025-12-18T19:15:00.000Z',
    imageUrl: 'https://picsum.photos/id/1068/900/1350',
  },
  {
    id: 11,
    title: 'Side Street Rain',
    location: 'Seoul, KR',
    aspectRatio: 'aspect-[3/5]',
    color: 'green',
    theme: 'street',
    description: 'Neon signs reflected in wet asphalt.',
    createdAt: '2025-11-06T22:10:00.000Z',
    imageUrl: 'https://picsum.photos/id/1019/900/1500',
  },
  {
    id: 12,
    title: 'Lakeside Noon',
    location: 'Interlaken, CH',
    aspectRatio: 'aspect-[4/3]',
    color: 'green',
    theme: 'scenery',
    description: 'Bright water and clean mountain air.',
    createdAt: '2025-10-01T12:30:00.000Z',
    imageUrl: 'https://picsum.photos/id/1039/1200/900',
  },
]

const PALETTE_LABELS: Record<string, string> = {
  blue: 'cool blues',
  golden: 'golden tones',
  warm: 'warm neutrals',
  monochrome: 'mono contrast',
  green: 'green tones',
}

const normalizePhoto = (photo: Partial<PhotoItem>, index: number): PhotoItem => ({
  id: photo.id ?? `custom-${index}`,
  title: photo.title?.trim() || 'Untitled Moment',
  location: photo.location?.trim() || 'Unknown location',
  aspectRatio: photo.aspectRatio || 'aspect-[4/3]',
  color: photo.color?.trim() || 'neutral',
  theme: photo.theme?.trim() || 'moments',
  description: photo.description?.trim() || 'A quiet frame from daily life.',
  createdAt: typeof photo.createdAt === 'string' ? photo.createdAt : undefined,
  imageUrl: typeof photo.imageUrl === 'string' ? photo.imageUrl : undefined,
})

const toIdKey = (id: number | string): string => String(id)

const getPhotoImage = (photo: PhotoItem, idKey: string): string => (
  photo.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(`photo-${idKey}`)}/1200/1600`
)

const getPhotoThumb = (photo: PhotoItem, idKey: string): string => {
  const url = getPhotoImage(photo, idKey)
  const match = url.match(/^(.*?)\/(\d+)\/(\d+)(\?.*)?$/)
  if (!match) return url

  const base = match[1]
  const width = Number(match[2])
  const height = Number(match[3])
  const query = match[4] || ''
  const targetW = 640

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= targetW) return url

  const targetH = Math.max(1, Math.round((height * targetW) / width))
  return `${base}/${targetW}/${targetH}${query}`
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
    return photo.location.split(',')[0].trim() || 'Unknown'
  }

  return photo[sortBy]
}

const getClusterLabel = (sortBy: SortBy, value: string): string => {
  if (sortBy === 'date') return getDateBucketLabel(value)
  if (sortBy === 'color') return PALETTE_LABELS[value.toLowerCase()] || value
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

interface FilmReelClusterProps {
  cluster: PhotoCluster
  clusterIndex: number
  onSelectPhoto: (photo: PhotoItem) => void
}

function FilmReelCluster({ cluster, clusterIndex, onSelectPhoto }: FilmReelClusterProps) {
  const sourcePhotos = cluster.photos
  const sourcePhotoCount = sourcePhotos.length
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const hasAutoScrollLane = sourcePhotoCount > 2 && !isMobileViewport
  const reelRef = useRef<HTMLDivElement | null>(null)
  const pauseUntilRef = useRef(0)
  const [isLaneScrollable, setIsLaneScrollable] = useState(sourcePhotoCount > 2)
  const dragStateRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  })
  const suppressClickUntilRef = useRef(0)

  const displayPhotos = useMemo(
    () => (isLaneScrollable ? [...sourcePhotos, ...sourcePhotos] : sourcePhotos),
    [isLaneScrollable, sourcePhotos]
  )
  const laneModeClass = isLaneScrollable ? 'is-looping' : 'is-static'

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncViewportMode = () => {
      setIsMobileViewport(mediaQuery.matches)
    }

    syncViewportMode()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewportMode)
      return () => mediaQuery.removeEventListener('change', syncViewportMode)
    }

    mediaQuery.addListener(syncViewportMode)
    return () => mediaQuery.removeListener(syncViewportMode)
  }, [])

  useEffect(() => {
    if (sourcePhotoCount > 2 && !isMobileViewport) {
      setIsLaneScrollable(true)
      return
    }

    setIsLaneScrollable(false)
  }, [isMobileViewport, sourcePhotoCount])

  useEffect(() => {
    if (!isMobileViewport) return

    const reel = reelRef.current
    if (!reel) return

    const onWheelMobile = (event: WheelEvent) => {
      const maxScrollLeft = reel.scrollWidth - reel.clientWidth
      if (maxScrollLeft <= 1) return

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY
      if (Math.abs(delta) < 0.35) return

      const next = reel.scrollLeft + delta
      const clamped = Math.min(Math.max(next, 0), maxScrollLeft)

      if (Math.abs(clamped - reel.scrollLeft) < 0.2) {
        return
      }

      event.preventDefault()
      reel.scrollLeft = clamped
    }

    reel.addEventListener('wheel', onWheelMobile, { passive: false })
    return () => {
      reel.removeEventListener('wheel', onWheelMobile)
    }
  }, [isMobileViewport, sourcePhotoCount])

  useEffect(() => {
    if (!hasAutoScrollLane) {
      setIsLaneScrollable(false)
      return
    }

    const reel = reelRef.current
    if (!reel) return

    const pauseAuto = (duration = 1400) => {
      pauseUntilRef.current = performance.now() + duration
    }

    const speed = 24
    let laneDirection = clusterIndex % 2 === 0 ? 1 : -1
    let rafId = 0
    let lastTime = performance.now()
    let lastMeasureAt = 0
    let lanePosition = 0
    let singleSetWidth = 0
    let shouldScrollByOverflow = false
    let resizeObserver: ResizeObserver | null = null
    const delayedMeasureTimeouts: number[] = []
    const imageLoadListeners: Array<{ image: HTMLImageElement; handler: () => void }> = []
    let isHoverPaused = false

    const onWheel = () => pauseAuto(550)
    const onTouchStart = () => pauseAuto(550)
    const onPointerEnter = () => {
      isHoverPaused = true
    }
    const onPointerLeave = () => {
      isHoverPaused = false
      pauseAuto(180)
    }
    const onScroll = () => {
      lanePosition = reel.scrollLeft
    }

    const clampLanePosition = (value: number) => {
      if (singleSetWidth <= 0) return 0
      return Math.min(Math.max(value, 0), singleSetWidth)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (!shouldScrollByOverflow) return

      dragStateRef.current.active = true
      dragStateRef.current.moved = false
      dragStateRef.current.pointerId = event.pointerId
      dragStateRef.current.startX = event.clientX
      dragStateRef.current.startScrollLeft = reel.scrollLeft
      lanePosition = reel.scrollLeft

      pauseAuto(3200)
      reel.classList.add('is-user-dragging')
      reel.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.active) return
      if (dragStateRef.current.pointerId !== event.pointerId) return

      const deltaX = event.clientX - dragStateRef.current.startX
      if (Math.abs(deltaX) > 3) {
        dragStateRef.current.moved = true
      }

      const next = dragStateRef.current.startScrollLeft - deltaX
      lanePosition = clampLanePosition(next)
      reel.scrollLeft = lanePosition
    }

    const finishPointer = (event: PointerEvent) => {
      if (!dragStateRef.current.active) return
      if (dragStateRef.current.pointerId !== event.pointerId) return

      const moved = dragStateRef.current.moved
      dragStateRef.current.active = false
      dragStateRef.current.pointerId = -1
      reel.classList.remove('is-user-dragging')

      if (reel.hasPointerCapture(event.pointerId)) {
        reel.releasePointerCapture(event.pointerId)
      }

      if (moved) {
        suppressClickUntilRef.current = performance.now() + 240
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      finishPointer(event)
      pauseAuto(420)
    }

    const onPointerCancel = (event: PointerEvent) => {
      finishPointer(event)
      pauseAuto(380)
    }

    const onClickCapture = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntilRef.current) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const measure = () => {
      const container = reel.firstElementChild
      if (!(container instanceof HTMLElement)) return

      const slides = Array.from(container.querySelectorAll<HTMLElement>('.photo-film-slide'))
      if (slides.length === 0) return

      const baseSlides = slides.slice(0, sourcePhotoCount)
      if (baseSlides.length === 0) return

      const computed = window.getComputedStyle(container)
      const gapRaw = computed.columnGap && computed.columnGap !== 'normal' ? computed.columnGap : computed.gap
      const gap = Number.parseFloat(gapRaw || '0') || 0
      const totalSlidesWidth = baseSlides.reduce((sum, slide) => sum + slide.getBoundingClientRect().width, 0)

      const measuredSingleSetWidth = totalSlidesWidth + (gap * Math.max(sourcePhotoCount - 1, 0))
      const fallbackSingleSetWidth = isLaneScrollable
        ? (reel.scrollWidth / 2)
        : reel.scrollWidth

      singleSetWidth = measuredSingleSetWidth > 0
        ? measuredSingleSetWidth
        : fallbackSingleSetWidth

      const nextScrollable = (singleSetWidth - reel.clientWidth) > 1
      shouldScrollByOverflow = nextScrollable
      setIsLaneScrollable((current) => (current === nextScrollable ? current : nextScrollable))
      lastMeasureAt = performance.now()

      if (!nextScrollable) {
        reel.scrollLeft = 0
        lanePosition = 0
        return
      }

      if (!isLaneScrollable) {
        lanePosition = laneDirection < 0 ? singleSetWidth : 0
        reel.scrollLeft = lanePosition
        return
      }

      if (laneDirection < 0 && reel.scrollLeft < singleSetWidth * 0.5) {
        lanePosition = singleSetWidth
        reel.scrollLeft = lanePosition
        return
      }

      lanePosition = reel.scrollLeft
      while (lanePosition < 0) lanePosition += singleSetWidth
      while (lanePosition > singleSetWidth) lanePosition -= singleSetWidth
      reel.scrollLeft = lanePosition
    }

    const bindImageLoadMeasure = () => {
      const images = Array.from(reel.querySelectorAll('img'))
      images.forEach((image) => {
        if (image.complete) return
        const handler = () => measure()
        image.addEventListener('load', handler)
        imageLoadListeners.push({ image, handler })
      })
    }

    const scheduleMeasureBursts = () => {
      ;[0, 80, 180, 360, 800, 1400].forEach((delay) => {
        const timeoutId = window.setTimeout(() => measure(), delay)
        delayedMeasureTimeouts.push(timeoutId)
      })
    }

    measure()
    scheduleMeasureBursts()
    bindImageLoadMeasure()

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(reel)

      const container = reel.firstElementChild
      if (container instanceof HTMLElement) {
        resizeObserver.observe(container)
      }
    }

    reel.addEventListener('wheel', onWheel, { passive: true })
    reel.addEventListener('touchstart', onTouchStart, { passive: true })
    reel.addEventListener('pointerenter', onPointerEnter)
    reel.addEventListener('pointerleave', onPointerLeave)
    reel.addEventListener('scroll', onScroll, { passive: true })
    reel.addEventListener('pointerdown', onPointerDown, { passive: true })
    reel.addEventListener('pointermove', onPointerMove, { passive: true })
    reel.addEventListener('pointerup', onPointerUp)
    reel.addEventListener('pointercancel', onPointerCancel)
    reel.addEventListener('click', onClickCapture, true)
    window.addEventListener('resize', measure)

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 40)
      lastTime = now
      const hoveredNow = reel.matches(':hover')

      if ((singleSetWidth <= 0 || now - lastMeasureAt > 450) && hasAutoScrollLane) {
        measure()
      }

      if (shouldScrollByOverflow && singleSetWidth > 0) {
        if (dragStateRef.current.active || isHoverPaused || hoveredNow || now < pauseUntilRef.current) {
          lanePosition = reel.scrollLeft
        } else {
          lanePosition += (laneDirection * speed * dt) / 1000

          if (laneDirection > 0 && lanePosition >= singleSetWidth) {
            lanePosition -= singleSetWidth
          } else if (laneDirection < 0 && lanePosition <= 0) {
            lanePosition += singleSetWidth
          }

          reel.scrollLeft = lanePosition
        }
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafId)
      delayedMeasureTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      resizeObserver?.disconnect()
      reel.removeEventListener('wheel', onWheel)
      reel.removeEventListener('touchstart', onTouchStart)
      reel.removeEventListener('pointerenter', onPointerEnter)
      reel.removeEventListener('pointerleave', onPointerLeave)
      reel.removeEventListener('scroll', onScroll)
      reel.removeEventListener('pointerdown', onPointerDown)
      reel.removeEventListener('pointermove', onPointerMove)
      reel.removeEventListener('pointerup', onPointerUp)
      reel.removeEventListener('pointercancel', onPointerCancel)
      reel.removeEventListener('click', onClickCapture, true)
      window.removeEventListener('resize', measure)
      imageLoadListeners.forEach(({ image, handler }) => {
        image.removeEventListener('load', handler)
      })
      reel.classList.remove('is-user-dragging')
    }
  }, [clusterIndex, displayPhotos.length, hasAutoScrollLane, sourcePhotoCount])

  return (
    <section className="photo-vsco-cluster-section">
      <div className="photo-vsco-cluster-section-head">
        <div className="photo-reel-meta" role="group" aria-label={`Photo roll ${cluster.label}`}>
          <span className="photo-reel-title">{cluster.label}</span>
        </div>
      </div>

      <div className={`photo-film-strip-shell ${laneModeClass}`}>
        <div
          ref={reelRef}
          className={`photo-film-embla ${laneModeClass}`}
        >
          <div className={`photo-film-embla-container ${laneModeClass}`}>
            {displayPhotos.map((photo, photoIndex) => {
              const idKey = toIdKey(photo.id)
              const portraitSource = isPortraitAspect(photo.aspectRatio)

              return (
                <div
                  key={`${cluster.key}-${idKey}-${photoIndex}`}
                  className="photo-film-slide"
                >
                  <button
                    type="button"
                    className="photo-film-frame photo-film-frame-landscape"
                    onClick={() => onSelectPhoto(photo)}
                    aria-label={`Preview ${photo.title}`}
                  >
                    <span
                      className={`photo-film-image-shell photo-film-image-shell-landscape ${portraitSource ? 'is-portrait-source' : ''}`}
                    >
                      <img
                        src={getPhotoThumb(photo, idKey)}
                        alt={photo.title}
                        loading="eager"
                        decoding="async"
                        className={portraitSource ? 'photo-film-image-rotated' : ''}
                      />
                    </span>
                    <span className="photo-meta-overlay photo-meta-overlay-compact">
                      <span className="photo-meta-overlay-title">{photo.title}</span>
                      <span className="photo-meta-overlay-line">{photo.location}</span>
                      <span className="photo-meta-overlay-line">{photo.color} | {photo.theme}</span>
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
  const searchParams = useSearchParams()

  const [sortBy, setSortBy] = useState<SortBy | null>(null)
  const [filterTag, setFilterTag] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('newest')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [customPhotos, setCustomPhotos] = useState<PhotoItem[]>([])
  const [isPhotoContentReady, setIsPhotoContentReady] = useState(false)

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
    setSelectedPhoto(null)
  }, [searchParams])

  useEffect(() => {
    if (!selectedPhoto) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPhoto(null)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [selectedPhoto])

  const photos = useMemo(() => [...DEFAULT_PHOTOS, ...customPhotos], [customPhotos])

  const allPhotoSources = useMemo(() => {
    const sourceSet = new Set<string>()
    photos.forEach((photo) => {
      sourceSet.add(getPhotoThumb(photo, toIdKey(photo.id)))
    })
    return Array.from(sourceSet)
  }, [photos])

  useEffect(() => {
    let isCancelled = false
    setIsPhotoContentReady(false)

    if (allPhotoSources.length === 0) {
      setIsPhotoContentReady(true)
      return () => {
        isCancelled = true
      }
    }

    const preloadImages: HTMLImageElement[] = []
    let completedCount = 0

    const markResolved = () => {
      completedCount += 1
      if (completedCount !== allPhotoSources.length || isCancelled) return

      if (!isCancelled) {
        setIsPhotoContentReady(true)
      }
    }

    const maxWaitTimeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        setIsPhotoContentReady(true)
      }
    }, 1400)

    allPhotoSources.forEach((source) => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = markResolved
      image.onerror = markResolved
      image.src = source
      preloadImages.push(image)
    })

    return () => {
      isCancelled = true
      window.clearTimeout(maxWaitTimeoutId)
      preloadImages.forEach((image) => {
        image.onload = null
        image.onerror = null
      })
    }
  }, [allPhotoSources])

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

  const allPhotosSorted = useMemo(() => (
    [...photos].sort((a, b) => {
      const timeA = photoTimestampMap.get(toIdKey(a.id)) || 0
      const timeB = photoTimestampMap.get(toIdKey(b.id)) || 0
      return timeB - timeA
    })
  ), [photoTimestampMap, photos])

  const filteredByTag = useMemo(() => {
    if (!sortBy || !filterTag) return photos

    return photos.filter((photo) => {
      const value = getClusterValue(photo, sortBy, photoTimestampMap)
      return value.toLowerCase() === filterTag.toLowerCase()
    })
  }, [filterTag, photoTimestampMap, photos, sortBy])

  const clusters = useMemo<PhotoCluster[]>(() => {
    if (!sortBy) return []

    const grouped = new Map<string, PhotoCluster>()

    filteredByTag.forEach((photo) => {
      const value = getClusterValue(photo, sortBy, photoTimestampMap)
      const key = `${sortBy}:${value}`.toLowerCase()
      const existing = grouped.get(key)

      if (existing) {
        existing.photos.push(photo)
        return
      }

      grouped.set(key, {
        key,
        value,
        label: getClusterLabel(sortBy, value),
        photos: [photo],
      })
    })

    const values = Array.from(grouped.values())

    const clusterTime = (cluster: PhotoCluster) => cluster.photos.reduce(
      (max, photo) => Math.max(max, photoTimestampMap.get(toIdKey(photo.id)) || 0),
      0
    )

    if (orderBy === 'az') {
      values.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }))
    } else if (orderBy === 'za') {
      values.sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true, sensitivity: 'base' }))
    } else if (orderBy === 'most') {
      values.sort((a, b) => {
        const countDiff = b.photos.length - a.photos.length
        if (countDiff !== 0) return countDiff
        return clusterTime(b) - clusterTime(a)
      })
    } else if (orderBy === 'oldest') {
      values.sort((a, b) => clusterTime(a) - clusterTime(b))
    } else {
      values.sort((a, b) => clusterTime(b) - clusterTime(a))
    }

    values.forEach((cluster) => {
      cluster.photos.sort((a, b) => {
        const timeA = photoTimestampMap.get(toIdKey(a.id)) || 0
        const timeB = photoTimestampMap.get(toIdKey(b.id)) || 0
        return orderBy === 'oldest' ? timeA - timeB : timeB - timeA
      })
    })

    return values
  }, [filteredByTag, orderBy, photoTimestampMap, sortBy])

  return (
    <div className="photos-page-root flex items-start justify-start min-h-screen px-20 py-16 mobile-main-content bg-background">
      <div className="w-full max-w-[1700px] mx-auto">
        <h1 className="sr-only">Photos</h1>

        <div className="photo-mobile-toolbar photo-inline-sorter mb-4 page-load-seq page-load-seq-1">
          <div className="photo-sort-pills">
            <button
              type="button"
              className={`photo-sort-pill ${!sortBy ? 'is-active' : ''}`}
              onClick={() => {
                setSortBy(null)
                setFilterTag('')
                setOrderBy(getDefaultOrder(null))
              }}
            >
              All Photos
            </button>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`photo-sort-pill ${sortBy === option.key ? 'is-active' : ''}`}
                onClick={() => {
                  setSortBy(option.key)
                  setFilterTag('')
                  setOrderBy(getDefaultOrder(option.key))
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {sortBy && (
            <label className="photo-select-shell photo-filter-pill is-active">
              <span className="photo-select-label">Order</span>
              <select
                className="photo-select-input photo-select-input-filter"
                value={orderBy}
                onChange={(event) => {
                  setOrderBy(event.target.value as OrderBy)
                }}
              >
                {getOrderOptions(sortBy).map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!isPhotoContentReady ? (
          <div className="photo-loading-spinner-wrap" aria-live="polite" aria-label="Loading photos">
            <span className="photo-loading-spinner" aria-hidden="true" />
          </div>
        ) : !sortBy ? (
          <div className="photo-vsco-board photo-fade-in">
            <div className="photo-vsco-masonry">
              {allPhotosSorted.map((photo) => {
                const idKey = toIdKey(photo.id)
                return (
                  <button
                    key={idKey}
                    type="button"
                    className="photo-vsco-card"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="photo-vsco-media">
                      <img
                        src={getPhotoThumb(photo, idKey)}
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="photo-meta-overlay">
                        <span className="photo-meta-overlay-title">{photo.title}</span>
                        <span className="photo-meta-overlay-line">{photo.location}</span>
                        <span className="photo-meta-overlay-line">{photo.color} | {photo.theme}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="photo-vsco-cluster-stack photo-fade-in">
            {clusters.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No photos in this filter</div>
                <div className="empty-state-message">Try a different sidebar filter.</div>
              </div>
            ) : (
              clusters.map((cluster, clusterIndex) => (
                <FilmReelCluster
                  key={cluster.key}
                  cluster={cluster}
                  clusterIndex={clusterIndex}
                  onSelectPhoto={setSelectedPhoto}
                />
              ))
            )}
          </div>
        )}

        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative w-fit max-w-[96vw]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 w-10 h-10 bg-black/55 hover:bg-black/75 text-stone-50 rounded-full flex items-center justify-center transition-colors z-20 text-base"
                aria-label="Close photo view"
              >
                ✕
              </button>

              <div className="bg-card rounded-lg overflow-hidden border border-border/80 inline-block">
                <img
                  src={getPhotoImage(selectedPhoto, toIdKey(selectedPhoto.id))}
                  alt={selectedPhoto.title}
                  className="max-h-[84vh] max-w-[96vw] w-auto h-auto block"
                />

                <div className="mt-2 px-2 pb-2">
                  <h2 className="text-sm md:text-base font-serif italic leading-tight">{selectedPhoto.title}</h2>
                  <div className="mt-1 text-[10px] md:text-[11px] text-muted flex flex-wrap items-center gap-1.5">
                    <span>{selectedPhoto.location}</span>
                    <span>|</span>
                    <span>{selectedPhoto.color}</span>
                    <span>|</span>
                    <span>{selectedPhoto.theme}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] md:text-[11px] text-muted leading-relaxed max-w-[56rem]">{selectedPhoto.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PhotographyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PhotographyClient />
    </Suspense>
  )
}
