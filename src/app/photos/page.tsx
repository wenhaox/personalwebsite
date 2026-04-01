'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FilmStrip } from '@phosphor-icons/react'
import AutoScroll from 'embla-carousel-auto-scroll'
import useEmblaCarousel from 'embla-carousel-react'

type SortBy = 'theme' | 'color' | 'location' | 'date'
type FilmOrientation = 'portrait' | 'landscape' | 'square'

interface FilterOption {
  value: string
  label: string
}

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
    month: 'short',
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

const getClusterCountLabel = (count: number): string => {
  if (count === 1) return 'solo frame'
  return `${count} frames`
}

const getPhotoOrientation = (aspectRatio: string): FilmOrientation => {
  if (aspectRatio === 'aspect-square') return 'square'

  const ratioMatch = aspectRatio.match(/(\d+)\s*\/\s*(\d+)/)
  if (ratioMatch) {
    const width = Number(ratioMatch[1])
    const height = Number(ratioMatch[2])

    if (width === height) return 'square'
    return width > height ? 'landscape' : 'portrait'
  }

  if (aspectRatio.includes('16/9') || aspectRatio.includes('4/3') || aspectRatio.includes('3/2')) {
    return 'landscape'
  }

  return 'portrait'
}

interface FilmReelClusterProps {
  cluster: PhotoCluster
  clusterIndex: number
  onSelectPhoto: (photo: PhotoItem) => void
}

function FilmReelCluster({ cluster, clusterIndex, onSelectPhoto }: FilmReelClusterProps) {
  const autoScrollPlugin = useMemo(() => (
    AutoScroll({
      direction: clusterIndex % 2 === 0 ? 'forward' : 'backward',
      speed: 0.7,
      startDelay: 650,
      playOnInit: true,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  ), [clusterIndex])

  const [emblaRef] = useEmblaCarousel(
    {
      loop: cluster.photos.length > 4,
      align: 'start',
      dragFree: true,
      containScroll: 'trimSnaps',
      watchDrag: true,
    },
    [autoScrollPlugin]
  )

  return (
    <section className="photo-vsco-cluster-section">
      <div className="photo-vsco-cluster-section-head">
        <div className="photo-film-roll-pack" role="group" aria-label={`Film roll ${cluster.label}`}>
          <span className="photo-film-roll-cap">
            <FilmStrip className="photo-film-roll-cap-icon" weight="duotone" />
            <span className="photo-film-roll-cap-label">FILM REEL</span>
          </span>
          <span className="photo-film-roll-title">{cluster.label}</span>
          <span className="photo-film-roll-sub">{getClusterCountLabel(cluster.photos.length)}</span>
        </div>
        <span className="photo-film-roll-status">Auto roll · drag to scrub</span>
      </div>

      <div className="photo-film-strip-shell">
        <div className="photo-film-embla" ref={emblaRef}>
          <div className="photo-film-embla-container">
            {cluster.photos.map((photo) => {
              const idKey = toIdKey(photo.id)
              const orientation = getPhotoOrientation(photo.aspectRatio)

              return (
                <div key={`${cluster.key}-${idKey}`} className="photo-film-slide">
                  <button
                    type="button"
                    className={`photo-film-frame photo-film-frame-${orientation}`}
                    onClick={() => onSelectPhoto(photo)}
                    aria-label={`Preview ${photo.title}`}
                  >
                    <span className={`photo-film-image-shell photo-film-image-shell-${orientation}`}>
                      <img
                        src={getPhotoImage(photo, idKey)}
                        alt={photo.title}
                        loading="lazy"
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
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [customPhotos, setCustomPhotos] = useState<PhotoItem[]>([])

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
    const validSort = SORT_OPTIONS.some((option) => option.key === sortParam)

    setSortBy(validSort ? (sortParam as SortBy) : null)
    setFilterTag(validSort && tagParam ? tagParam.trim() : '')
    setSelectedPhoto(null)
  }, [searchParams])

  const photos = useMemo(() => [...DEFAULT_PHOTOS, ...customPhotos], [customPhotos])

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

  const filterOptions = useMemo<FilterOption[]>(() => {
    if (!sortBy) return []

    const optionMap = new Map<string, string>()
    photos.forEach((photo) => {
      const value = getClusterValue(photo, sortBy, photoTimestampMap)
      optionMap.set(value, getClusterLabel(sortBy, value))
    })

    const entries = Array.from(optionMap.entries()).map(([value, label]) => ({ value, label }))

    if (sortBy === 'date') {
      return entries.sort((a, b) => b.value.localeCompare(a.value))
    }

    return entries.sort((a, b) => a.label.localeCompare(b.label))
  }, [photoTimestampMap, photos, sortBy])

  const filterLabelMap = useMemo(
    () => new Map(filterOptions.map((option) => [option.value.toLowerCase(), option.label])),
    [filterOptions]
  )

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

    if (sortBy === 'date') {
      values.sort((a, b) => b.value.localeCompare(a.value))
    } else {
      values.sort((a, b) => a.label.localeCompare(b.label))
    }

    values.forEach((cluster) => {
      cluster.photos.sort((a, b) => {
        const timeA = photoTimestampMap.get(toIdKey(a.id)) || 0
        const timeB = photoTimestampMap.get(toIdKey(b.id)) || 0
        return timeB - timeA
      })
    })

    return values
  }, [filteredByTag, photoTimestampMap, sortBy])

  const activeSort = SORT_OPTIONS.find((option) => option.key === sortBy)
  const activeFilterLabel = filterTag ? (filterLabelMap.get(filterTag.toLowerCase()) || filterTag) : ''

  return (
    <div className="flex items-start justify-start min-h-screen px-20 py-16 mobile-main-content bg-background">
      <div className="w-full max-w-[1700px] mx-auto">
        <h1 className="sr-only">Photos</h1>

        <div className="photo-vsco-toolbar photo-mobile-toolbar mb-4 page-load-seq page-load-seq-1">
          <div className="photo-controls-row">
            <button
              type="button"
              className={`photo-sort-button px-3 py-1.5 rounded-full border text-xs transition-all ${
                !sortBy
                  ? 'bg-accent text-stone-100 border-accent filter-pill-active'
                  : 'bg-background text-muted border-border hover:border-accent/40 hover:text-accent'
              }`}
              onClick={() => {
                setSortBy(null)
                setFilterTag('')
              }}
            >
              <span className="photo-sort-button-icon photo-sort-button-icon-all">◍</span>
              <span className="photo-sort-button-label">All Photos</span>
            </button>

            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`photo-sort-button px-3 py-1.5 rounded-full border text-xs transition-all ${
                  sortBy === option.key
                    ? 'bg-accent text-stone-100 border-accent filter-pill-active'
                    : 'bg-background text-muted border-border hover:border-accent/40 hover:text-accent'
                }`}
                onClick={() => {
                  setSortBy(option.key)
                  setFilterTag('')
                }}
              >
                <span className={`photo-sort-button-icon photo-sort-button-icon-${option.key}`}>{option.icon}</span>
                <span className="photo-sort-button-label">{option.label}</span>
              </button>
            ))}
          </div>

          {sortBy && filterOptions.length > 0 && (
            <div className="photo-controls-row photo-filter-row">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                  !filterTag
                    ? 'bg-accent text-stone-100 border-accent filter-pill-active'
                    : 'bg-background text-muted border-border hover:border-accent/40 hover:text-accent'
                }`}
                onClick={() => setFilterTag('')}
              >
                All {activeSort?.label}
              </button>

              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-2.5 py-1 rounded-full border text-[11px] transition-all ${
                    filterTag.toLowerCase() === option.value.toLowerCase()
                      ? 'bg-accent text-stone-100 border-accent filter-pill-active'
                      : 'bg-background text-muted border-border hover:border-accent/40 hover:text-accent'
                  }`}
                  onClick={() => setFilterTag(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 text-xs text-muted page-load-seq page-load-seq-2">
          <span className="truncate">
            {!sortBy ? 'All Photos' : `${activeSort?.icon || ''} ${activeSort?.label || ''}`}
            {activeFilterLabel ? ` · ${activeFilterLabel}` : ''}
          </span>
        </div>

        {!sortBy ? (
          <div className="photo-vsco-board page-load-seq page-load-seq-3">
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
                        src={getPhotoImage(photo, idKey)}
                        alt={photo.title}
                        loading="lazy"
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
          <div className="photo-vsco-cluster-stack page-load-seq page-load-seq-3">
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
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-2 right-2 md:-top-10 md:right-0 w-7 h-7 md:w-6 md:h-6 bg-accent/50 hover:bg-accent/80 text-stone-50 rounded-lg md:rounded-full flex items-center justify-center transition-all z-10 text-xs font-light"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 bg-card rounded-lg overflow-hidden shadow-2xl">
                <div className="relative min-h-[300px] md:min-h-[460px] bg-muted/10">
                  <img
                    src={getPhotoImage(selectedPhoto, toIdKey(selectedPhoto.id))}
                    alt={selectedPhoto.title}
                    className="w-full h-full object-contain bg-black/70"
                  />
                </div>

                <div className="flex items-center justify-center p-6 md:p-8">
                  <div className="text-center space-y-3 w-full">
                    <h2 className="text-lg md:text-xl font-serif italic">{selectedPhoto.title}</h2>
                    <div className="text-xs md:text-sm text-muted flex flex-wrap items-center justify-center gap-2">
                      <span>{selectedPhoto.location}</span>
                      <span>|</span>
                      <span>{selectedPhoto.color}</span>
                      <span>|</span>
                      <span>{selectedPhoto.theme}</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted leading-relaxed">{selectedPhoto.description}</p>
                  </div>
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
