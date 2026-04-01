'use client'

import { Camera, Disc, FilmStrip, TelevisionSimple, VinylRecord } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Rnd } from 'react-rnd'

interface RecentlyLink {
  url: string
  text: string
}

interface RecentlyItem {
  category: string
  item: string
  emoji: string
  description: string
  date: string
  spotifyEmbed?: string
  podcastEmbed?: string
  image?: string
  images?: string[]
  link?: string
  linkText?: string
  links?: RecentlyLink[]
}

interface FavoriteObject {
  name: string
  image: string
  note: string
  finish: string
  acquired: string
}

type BoardObjectKind = 'record' | 'camera' | 'movie' | 'artifact'

interface BoardObject {
  id: string
  kind: BoardObjectKind
  title: string
  subtitle: string
  description: string
  image?: string
  link?: RecentlyLink
}

interface BoardRect {
  x: number
  y: number
  width: number
  height: number
}

type BoardLayout = Record<string, BoardRect>

const BOARD_LAYOUT_KEY = 'recentlyMiroLayoutV2'

const DEFAULT_LAYOUT: BoardLayout = {
  record: { x: 74, y: 96, width: 340, height: 300 },
  camera: { x: 468, y: 122, width: 300, height: 250 },
  movie: { x: 830, y: 108, width: 350, height: 280 },
  'object-0': { x: 90, y: 468, width: 210, height: 210 },
  'object-1': { x: 336, y: 488, width: 210, height: 210 },
  'object-2': { x: 590, y: 474, width: 210, height: 210 },
  'object-3': { x: 862, y: 486, width: 210, height: 210 },
}

const DEFAULT_FAVORITE_OBJECTS: FavoriteObject[] = [
  {
    name: 'Leica M6',
    image: 'https://picsum.photos/id/1062/900/620',
    note: 'Still my favorite camera body for intentional frames and slower days.',
    finish: 'Mechanical film camera',
    acquired: '2019',
  },
  {
    name: 'Traveler Notebook',
    image: 'https://picsum.photos/id/180/900/620',
    note: 'Daily scratchpad for ideas, places, and lists I keep revisiting.',
    finish: 'Leather + refill inserts',
    acquired: '2021',
  },
  {
    name: 'Porcelain Dripper',
    image: 'https://picsum.photos/id/433/900/620',
    note: 'Makes my morning ritual feel slow and exact in the best way.',
    finish: 'Hand-pour setup',
    acquired: '2022',
  },
  {
    name: 'Studio Headphones',
    image: 'https://picsum.photos/id/903/900/620',
    note: 'My focus cue for deep work and long editing sessions.',
    finish: 'Closed-back monitor pair',
    acquired: '2024',
  },
]

const DEFAULT_RECENTLY_ITEMS: RecentlyItem[] = [
  {
    category: 'Music',
    item: 'Rosalia - MOTOMAMI',
    emoji: '🎵',
    description: 'The production still feels weird and alive every listen.',
    date: 'This week',
    spotifyEmbed: 'https://open.spotify.com/embed/album/5G2f63n7IPVPPjfNIGih7Q',
    link: 'https://open.spotify.com/album/5G2f63n7IPVPPjfNIGih7Q',
    linkText: 'Open in Spotify',
  },
  {
    category: 'Watching',
    item: 'Perfect Days',
    emoji: '🎬',
    description: 'Quiet and detailed. I keep thinking about its pacing and framing.',
    date: 'Last weekend',
    image: 'https://picsum.photos/id/1018/900/620',
    link: 'https://www.imdb.com/title/tt27503384/',
    linkText: 'View on IMDB',
  },
  {
    category: 'Place',
    item: 'Golden Gate Park sunrise loop',
    emoji: '🌅',
    description: 'Cold air, empty paths, and the best start before laptop hours.',
    date: 'This morning',
    images: [
      'https://picsum.photos/id/1036/800/540',
      'https://picsum.photos/id/1037/800/540',
      'https://picsum.photos/id/1038/800/540',
    ],
  },
]

const parseArray = <T,>(value: string | null): T[] => {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readLocalStorageObject = (value: string | null): Record<string, unknown> => {
  if (!value) return {}

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const getPrimaryImage = (item: RecentlyItem | null): string | undefined => {
  if (!item) return undefined
  if (typeof item.image === 'string' && item.image.trim()) return item.image
  if (Array.isArray(item.images) && item.images[0]) return item.images[0]
  return undefined
}

const getPrimaryLink = (item: RecentlyItem | null): RecentlyLink | undefined => {
  if (!item) return undefined

  if (typeof item.link === 'string' && item.link.trim()) {
    return {
      url: item.link,
      text: item.linkText?.trim() || 'Open link',
    }
  }

  if (Array.isArray(item.links) && item.links[0]?.url) {
    return item.links[0]
  }

  return undefined
}

const getDefaultRect = (object: BoardObject, index: number): BoardRect => {
  const known = DEFAULT_LAYOUT[object.id]
  if (known) return known

  return {
    x: 120 + (index % 4) * 250,
    y: 720 + Math.floor(index / 4) * 240,
    width: 210,
    height: 210,
  }
}

const parseLayout = (value: string | null): BoardLayout => {
  const parsed = readLocalStorageObject(value)
  const layout: BoardLayout = {}

  Object.entries(parsed).forEach(([key, rect]) => {
    if (!rect || typeof rect !== 'object') return

    const candidate = rect as Record<string, unknown>
    const x = Number(candidate.x)
    const y = Number(candidate.y)
    const width = Number(candidate.width)
    const height = Number(candidate.height)

    if (![x, y, width, height].every((n) => Number.isFinite(n))) return
    if (width <= 80 || height <= 80) return

    layout[key] = { x, y, width, height }
  })

  return layout
}

function renderObjectVisual(object: BoardObject, onOpenImage: (url: string) => void) {
  if (object.kind === 'record') {
    return (
      <div className="miro-record-object" aria-hidden="true">
        <VinylRecord className="miro-record-vinyl" weight="duotone" />
        <Disc className="miro-record-center" weight="fill" />
        <span className="miro-record-arm" />
        <span className="miro-record-arm-head" />
      </div>
    )
  }

  if (object.kind === 'camera') {
    return (
      <div className="miro-camera-object">
        <Camera className="miro-camera-icon" weight="duotone" />
        {object.image && (
          <button
            type="button"
            className="miro-camera-preview"
            onClick={(event) => {
              event.stopPropagation()
              onOpenImage(object.image!)
            }}
            aria-label={`Open ${object.title}`}
          >
            <img src={object.image} alt={object.title} className="miro-camera-preview-image" />
          </button>
        )}
      </div>
    )
  }

  if (object.kind === 'movie') {
    return (
      <div className="miro-tv-object">
        <TelevisionSimple className="miro-tv-icon" weight="duotone" />
        {object.image && (
          <button
            type="button"
            className="miro-tv-poster"
            onClick={(event) => {
              event.stopPropagation()
              onOpenImage(object.image!)
            }}
            aria-label={`Open ${object.title}`}
          >
            <img src={object.image} alt={object.title} className="miro-tv-poster-image" />
            <span className="miro-tv-scanline" />
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="miro-artifact-object"
      onClick={(event) => {
        event.stopPropagation()
        if (object.image) onOpenImage(object.image)
      }}
      aria-label={`Open ${object.title}`}
    >
      {object.image ? (
        <img src={object.image} alt={object.title} className="miro-artifact-image" />
      ) : (
        <FilmStrip className="miro-artifact-fallback" weight="duotone" />
      )}
    </button>
  )
}

export default function Recently() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [items, setItems] = useState<RecentlyItem[]>([])
  const [favoriteObjects, setFavoriteObjects] = useState<FavoriteObject[]>([])
  const [boardLayout, setBoardLayout] = useState<BoardLayout>({})

  useEffect(() => {
    const customRecently = parseArray<RecentlyItem>(localStorage.getItem('recentlyItems'))
    const customObjects = parseArray<FavoriteObject>(localStorage.getItem('favoriteObjects'))

    setItems(customRecently)
    setFavoriteObjects(customObjects)
    setBoardLayout(parseLayout(localStorage.getItem(BOARD_LAYOUT_KEY)))
  }, [])

  const recentlyItems = items.length > 0 ? items : DEFAULT_RECENTLY_ITEMS
  const objectShelf = favoriteObjects.length > 0 ? favoriteObjects : DEFAULT_FAVORITE_OBJECTS

  const musicItem = useMemo(() => (
    recentlyItems.find((item) => {
      const source = `${item.category} ${item.item}`.toLowerCase()
      return Boolean(item.spotifyEmbed) || /music|song|album|listen/.test(source)
    }) || null
  ), [recentlyItems])

  const movieItem = useMemo(() => (
    recentlyItems.find((item) => {
      const source = `${item.category} ${item.item}`.toLowerCase()
      return /movie|watch|film|tv/.test(source)
    }) || null
  ), [recentlyItems])

  const photoItem = useMemo(() => (
    recentlyItems.find((item) => Boolean(item.image) || (Array.isArray(item.images) && item.images.length > 0)) || null
  ), [recentlyItems])

  const boardObjects = useMemo<BoardObject[]>(() => {
    const list: BoardObject[] = [
      {
        id: 'record',
        kind: 'record',
        title: musicItem?.item || 'Now spinning',
        subtitle: musicItem?.date || 'This week',
        description: musicItem?.description || 'Music in rotation right now.',
        link: getPrimaryLink(musicItem),
      },
      {
        id: 'camera',
        kind: 'camera',
        title: photoItem?.item || 'Current photo obsession',
        subtitle: photoItem?.date || 'This week',
        description: photoItem?.description || 'Captured recently and still replaying in my head.',
        image: getPrimaryImage(photoItem),
        link: getPrimaryLink(photoItem),
      },
      {
        id: 'movie',
        kind: 'movie',
        title: movieItem?.item || 'Current watch',
        subtitle: movieItem?.date || 'Recent',
        description: movieItem?.description || 'A movie scene I keep thinking about.',
        image: getPrimaryImage(movieItem),
        link: getPrimaryLink(movieItem),
      },
    ]

    objectShelf.slice(0, 4).forEach((object, index) => {
      list.push({
        id: `object-${index}`,
        kind: 'artifact',
        title: object.name,
        subtitle: `Since ${object.acquired}`,
        description: object.note,
        image: object.image,
      })
    })

    return list
  }, [movieItem, musicItem, objectShelf, photoItem])

  const updateBoardRect = (object: BoardObject, index: number, partial: Partial<BoardRect>) => {
    setBoardLayout((current) => {
      const base = current[object.id] || getDefaultRect(object, index)
      const next = {
        ...current,
        [object.id]: {
          ...base,
          ...partial,
        },
      }

      try {
        localStorage.setItem(BOARD_LAYOUT_KEY, JSON.stringify(next))
      } catch {
        // Ignore write failures and keep in-memory dragging behavior.
      }

      return next
    })
  }

  return (
    <div className="flex items-start justify-start min-h-screen px-20 py-12 mobile-main-content bg-background">
      <div className="w-full max-w-[1700px] mx-auto">
        <h1 className="sr-only">Recently</h1>

        <section className="miro-board-shell page-load-seq page-load-seq-1">
          <div className="miro-board-stage">
            <div className="miro-board-canvas">
              {boardObjects.map((object, index) => {
                const rect = boardLayout[object.id] || getDefaultRect(object, index)

                return (
                  <Rnd
                    key={object.id}
                    bounds="parent"
                    disableDragging={false}
                    enableResizing={false}
                    dragHandleClassName="miro-object-handle"
                    size={{ width: rect.width, height: rect.height }}
                    position={{ x: rect.x, y: rect.y }}
                    className="miro-node-wrap"
                    onDragStop={(_, data) => {
                      updateBoardRect(object, index, { x: data.x, y: data.y })
                    }}
                  >
                    <div className="miro-object-handle">
                      <motion.div
                        className={`miro-object miro-object-${object.kind}`}
                        whileHover={{ y: -4, rotate: [0, -1.6, 1.6, 0] }}
                        transition={{ duration: 0.36, ease: 'easeOut' }}
                        onHoverStart={() => setHoveredId(object.id)}
                        onHoverEnd={() => setHoveredId((current) => (current === object.id ? null : current))}
                      >
                        {renderObjectVisual(object, setSelectedImage)}
                      </motion.div>
                    </div>

                    <div className={`miro-object-tooltip ${hoveredId === object.id ? 'is-visible' : ''}`}>
                      <p className="miro-tooltip-title">{object.title}</p>
                      <p className="miro-tooltip-copy">{object.description}</p>
                      {object.link && (
                        <a
                          href={object.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="miro-tooltip-link"
                        >
                          {object.link.text} ↗
                        </a>
                      )}
                    </div>
                  </Rnd>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-accent/80 text-white rounded-full flex items-center justify-center transition-all z-10"
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-[90%] max-h-[90%] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
