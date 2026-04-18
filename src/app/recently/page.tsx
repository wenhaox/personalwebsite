'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  audioUrl?: string
  spotifyEmbed?: string
  podcastEmbed?: string
  image?: string
  images?: string[]
  link?: string
  linkText?: string
  links?: RecentlyLink[]
}

type BoardObjectKind = 'record' | 'camera' | 'movie' | 'artifact'

interface BoardObject {
  id: string
  kind: BoardObjectKind
  pixelArt: string
  title: string
  subtitle: string
  description: string
  image?: string
  link?: RecentlyLink
  spotifyEmbed?: string
}

interface BoardRect {
  x: number
  y: number
  width: number
  height: number
}

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'

const SHELF_SLOT_RECTS: BoardRect[] = [
  { x: 0.195, y: 0.166, width: 0.1, height: 0.102 },
  { x: 0.449, y: 0.166, width: 0.1, height: 0.102 },
  { x: 0.703, y: 0.166, width: 0.1, height: 0.102 },
  { x: 0.195, y: 0.318, width: 0.1, height: 0.102 },
  { x: 0.449, y: 0.318, width: 0.1, height: 0.102 },
  { x: 0.703, y: 0.318, width: 0.1, height: 0.102 },
  { x: 0.195, y: 0.47, width: 0.1, height: 0.102 },
  { x: 0.449, y: 0.47, width: 0.1, height: 0.102 },
  { x: 0.703, y: 0.47, width: 0.1, height: 0.102 },
  { x: 0.195, y: 0.622, width: 0.1, height: 0.102 },
  { x: 0.449, y: 0.622, width: 0.1, height: 0.102 },
  { x: 0.703, y: 0.622, width: 0.1, height: 0.102 },
]

const DEFAULT_RECENTLY_ITEMS: RecentlyItem[] = [
  {
    category: 'Music',
    item: 'Rosalia - MOTOMAMI',
    emoji: '🎧',
    description: 'The production still feels weird and alive every listen.',
    date: 'This week',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
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
  {
    category: 'Reading',
    item: 'The Creative Act',
    emoji: '📚',
    description: 'Short sections, slow pace, and surprisingly useful prompts.',
    date: 'This week',
    link: 'https://www.penguinrandomhouse.com/books/717356/the-creative-act-by-rick-rubin/',
    linkText: 'Book page',
  },
  {
    category: 'Coffee',
    item: 'Kenya AB pour-over dial-in',
    emoji: '☕',
    description: 'Brighter cup at a finer grind and slightly cooler water.',
    date: 'Today',
  },
  {
    category: 'Field notes',
    item: 'Seacliff tidepool sketch set',
    emoji: '🧭',
    description: 'Small notebook studies from a windy late-afternoon walk.',
    date: 'Last weekend',
  },
  {
    category: 'Build',
    item: 'Photo reel interaction cleanup',
    emoji: '🛠️',
    description: 'Reducing jitter and making filtered rolls feel more stable.',
    date: 'Tonight',
  },
  {
    category: 'Audio',
    item: 'Late-night cassette mix',
    emoji: '📼',
    description: 'A mellow tape loop for long editing sessions.',
    date: 'Yesterday',
  },
  {
    category: 'Archive',
    item: 'Postcard scan batch',
    emoji: '✉️',
    description: 'Digitizing old travel cards and notes.',
    date: 'This week',
  },
  {
    category: 'Play',
    item: 'Retro co-op night',
    emoji: '🎮',
    description: 'Quick arcade rounds after work.',
    date: 'Friday',
  },
  {
    category: 'Desk',
    item: 'Hourglass focus sprint',
    emoji: '⏳',
    description: 'Short timed blocks helped with writing.',
    date: 'Today',
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

const shuffleWithSeed = <T,>(list: T[], seed: number): T[] => {
  const next = [...list]
  let state = (seed >>> 0) || 1

  for (let index = next.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
    const temp = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = temp
  }

  return next
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

export default function Recently() {
  const shuffleTimeoutRef = useRef<number | null>(null)
  const tooltipCloseTimerRef = useRef<number | null>(null)
  const tooltipRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [rollSeed, setRollSeed] = useState(1)
  const [isReady, setIsReady] = useState(false)
  const [items, setItems] = useState<RecentlyItem[]>([])
  const [tooltipEdgeMap, setTooltipEdgeMap] = useState<Record<string, { left: boolean; right: boolean; top: boolean }>>({})

  useEffect(() => {
    const customRecently = parseArray<RecentlyItem>(localStorage.getItem('recentlyItems'))
    setItems(customRecently)
    setIsReady(true)
  }, [])

  useEffect(() => (
    () => {
      if (shuffleTimeoutRef.current) {
        window.clearTimeout(shuffleTimeoutRef.current)
      }

      if (tooltipCloseTimerRef.current) {
        window.clearTimeout(tooltipCloseTimerRef.current)
      }
    }
  ), [])

  const cancelTooltipClose = useCallback(() => {
    if (!tooltipCloseTimerRef.current) return
    window.clearTimeout(tooltipCloseTimerRef.current)
    tooltipCloseTimerRef.current = null
  }, [])

  const queueTooltipClose = useCallback((id: string) => {
    cancelTooltipClose()
    tooltipCloseTimerRef.current = window.setTimeout(() => {
      setHoveredId((current) => (current === id ? null : current))
    }, 150)
  }, [cancelTooltipClose])

  const updateTooltipEdgeMap = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      const tooltip = tooltipRefs.current[id]
      if (!tooltip) return

      const rect = tooltip.getBoundingClientRect()
      const margin = 10
      const nextEdgeState = {
        left: rect.left < margin,
        right: rect.right > (window.innerWidth - margin),
        top: rect.top < margin,
      }

      setTooltipEdgeMap((current) => {
        const existing = current[id]
        if (
          existing &&
          existing.left === nextEdgeState.left &&
          existing.right === nextEdgeState.right &&
          existing.top === nextEdgeState.top
        ) {
          return current
        }

        return {
          ...current,
          [id]: nextEdgeState,
        }
      })
    })
  }, [])

  useEffect(() => {
    if (!hoveredId) return

    const syncHoveredTooltip = () => {
      updateTooltipEdgeMap(hoveredId)
    }

    syncHoveredTooltip()
    window.addEventListener('resize', syncHoveredTooltip)
    window.addEventListener('scroll', syncHoveredTooltip, { passive: true })

    return () => {
      window.removeEventListener('resize', syncHoveredTooltip)
      window.removeEventListener('scroll', syncHoveredTooltip)
    }
  }, [hoveredId, updateTooltipEdgeMap])

  const recentlyItems = items.length > 0 ? items : DEFAULT_RECENTLY_ITEMS

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
    const extraPixelArt = [
      '/pixel-objects/cassette.svg',
      '/pixel-objects/headphones.svg',
      '/pixel-objects/arcade-token.svg',
      '/pixel-objects/hourglass.svg',
      '/pixel-objects/postcard.svg',
      '/pixel-objects/gamepad.svg',
      '/pixel-objects/compass.svg',
      '/pixel-objects/coffee-mug.svg',
      '/pixel-objects/backpack.svg',
      '/pixel-objects/book-stack.svg',
      '/pixel-objects/radio.svg',
      '/pixel-objects/desk-lamp.svg',
      '/pixel-objects/dice-cube.svg',
    ]

    const fallbackItem: RecentlyItem = {
      category: 'Notes',
      item: 'Desk fragment',
      emoji: '✨',
      description: 'A tiny piece from the week that still stuck around.',
      date: 'recent',
    }

    const list: BoardObject[] = [
      {
        id: 'record',
        kind: 'record',
        pixelArt: '/pixel-objects/vinyl-record.svg',
        title: musicItem?.item || 'Now spinning',
        subtitle: musicItem?.date || 'This week',
        description: musicItem?.description || 'Music in rotation right now.',
        spotifyEmbed: musicItem?.spotifyEmbed,
        link: getPrimaryLink(musicItem),
      },
      {
        id: 'camera',
        kind: 'camera',
        pixelArt: '/pixel-objects/fujifilm-camera.svg',
        title: photoItem?.item || 'Current photo obsession',
        subtitle: photoItem?.date || 'This week',
        description: photoItem?.description || 'Captured recently and still replaying in my head.',
        image: getPrimaryImage(photoItem),
        link: getPrimaryLink(photoItem),
      },
      {
        id: 'movie',
        kind: 'movie',
        pixelArt: '/pixel-objects/film-frame.svg',
        title: movieItem?.item || 'Current watch',
        subtitle: movieItem?.date || 'Recent',
        description: movieItem?.description || 'A movie scene I keep thinking about.',
        image: getPrimaryImage(movieItem),
        link: getPrimaryLink(movieItem),
      },
    ]

    const secondaryItems = shuffleWithSeed(recentlyItems.filter((item) => (
      item !== musicItem && item !== photoItem && item !== movieItem
    )), rollSeed)

    const targetCount = 12
    const artifactCount = Math.max(targetCount - list.length, 0)
    const artifactPool = secondaryItems.length > 0 ? secondaryItems : [fallbackItem]

    Array.from({ length: artifactCount }, (_, index) => artifactPool[index % artifactPool.length]).forEach((item, index) => {
      list.push({
        id: `object-${index}`,
        kind: 'artifact',
        pixelArt: extraPixelArt[index % extraPixelArt.length],
        title: item.item,
        subtitle: item.date || 'recent',
        description: item.description || 'A smaller moment from the recent stack.',
        image: getPrimaryImage(item),
        link: getPrimaryLink(item),
      })
    })

    return list
  }, [movieItem, musicItem, photoItem, recentlyItems, rollSeed])

  const slotLayout = useMemo(() => {
    const shuffledSlots = shuffleWithSeed(SHELF_SLOT_RECTS, rollSeed)
    const nextLayout: Record<string, BoardRect> = {}

    boardObjects.forEach((object, index) => {
      nextLayout[object.id] = shuffledSlots[index % shuffledSlots.length]
    })

    return nextLayout
  }, [boardObjects, rollSeed])

  const handleRollShelf = useCallback(() => {
    if (!isReady) return

    cancelTooltipClose()
    setHoveredId(null)
    setIsShuffling(true)
    setRollSeed((current) => current + 1)

    if (shuffleTimeoutRef.current) {
      window.clearTimeout(shuffleTimeoutRef.current)
    }

    shuffleTimeoutRef.current = window.setTimeout(() => {
      setIsShuffling(false)
    }, 720)
  }, [cancelTooltipClose, isReady])

  useEffect(() => {
    const handleSidebarShuffle = () => {
      handleRollShelf()
    }

    window.addEventListener(RECENTLY_SHUFFLE_EVENT, handleSidebarShuffle)
    return () => window.removeEventListener(RECENTLY_SHUFFLE_EVENT, handleSidebarShuffle)
  }, [handleRollShelf])

  return (
    <div className={`recently-page-root bg-background ${isShuffling ? 'is-shuffling' : ''}`}>
      <h1 className="sr-only">Recently</h1>

      <section className="recently-board-shell page-load-seq page-load-seq-1">
        <div className="recently-board-stage">
          <div className="recently-board-canvas">
            <div className="recently-pixel-shelf-layer" aria-hidden="true">
              <span className="recently-pixel-shelf-post recently-pixel-shelf-post-left" />
              <span className="recently-pixel-shelf-post recently-pixel-shelf-post-right" />
              <span className="recently-pixel-shelf recently-pixel-shelf-top" />
              <span className="recently-pixel-shelf recently-pixel-shelf-upper" />
              <span className="recently-pixel-shelf recently-pixel-shelf-mid" />
              <span className="recently-pixel-shelf recently-pixel-shelf-bottom" />
            </div>

            {boardObjects.map((object, index) => {
              const rect = slotLayout[object.id] || SHELF_SLOT_RECTS[index % SHELF_SLOT_RECTS.length]
              const isRecord = object.kind === 'record'
              const artPath = object.pixelArt
              const isGamepad = artPath.endsWith('/gamepad.svg')
              const isMovie = object.kind === 'movie' || artPath.endsWith('/film-frame.svg')
              const isCamera = object.kind === 'camera' || artPath.endsWith('/fujifilm-camera.svg')
              const isAudioThing = /cassette\.svg$|headphones\.svg$|radio\.svg$/.test(artPath)
              const isArcadeOrDice = /arcade-token\.svg$|dice-cube\.svg$/.test(artPath)
              const isTravelThing = /compass\.svg$|backpack\.svg$|postcard\.svg$/.test(artPath)
              const isHovered = hoveredId === object.id
              const tooltipEdgeState = tooltipEdgeMap[object.id]
              const isTopEdge = rect.y < 0.24 || Boolean(tooltipEdgeState?.top)
              const isLeftEdge = rect.x < 0.16 || Boolean(tooltipEdgeState?.left)
              const isRightEdge = rect.x + rect.width > 0.84 || Boolean(tooltipEdgeState?.right)
              const motionClass = isRecord
                ? 'is-record-spin is-record-disc'
                : isGamepad
                  ? 'is-rocking'
                  : isMovie
                    ? 'is-glide'
                    : isCamera
                      ? 'is-idle-wobble'
                      : isAudioThing
                        ? 'is-glide'
                        : isArcadeOrDice || isTravelThing
                          ? 'is-rocking'
                          : 'is-idle-float'
              const tooltipClassName = [
                'recently-node-tooltip',
                isHovered ? 'is-visible' : '',
                isTopEdge ? 'is-top-edge' : '',
                isLeftEdge ? 'is-left-edge' : '',
                isRightEdge ? 'is-right-edge' : '',
              ].filter(Boolean).join(' ')

              return (
                <article
                  key={object.id}
                  className={`recently-object-slot ${isShuffling ? 'is-shuffling' : ''} ${isReady ? 'is-ready' : ''}`}
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.width * 100}%`,
                    height: `${rect.height * 100}%`,
                    zIndex: isHovered ? 260 : 80 + index,
                  }}
                >
                  <div
                    className="recently-node-shell"
                    onMouseEnter={() => {
                      cancelTooltipClose()
                      setHoveredId(object.id)
                      updateTooltipEdgeMap(object.id)
                    }}
                    onMouseLeave={() => {
                      queueTooltipClose(object.id)
                    }}
                    onTouchStart={() => {
                      cancelTooltipClose()
                      setHoveredId(object.id)
                      updateTooltipEdgeMap(object.id)
                    }}
                  >
                    <div
                      className={`recently-node recently-node-${object.kind} ${isHovered ? 'is-hovered' : ''} ${isRecord ? 'is-record-playing' : ''}`}
                      aria-label={object.title}
                      role="img"
                    >
                      <span className={`recently-node-pixel recently-node-pixel-${object.kind}`}>
                        <span className="recently-node-pixel-sprite">
                          <img
                            src={object.pixelArt}
                            alt=""
                            aria-hidden="true"
                            className={`recently-node-pixel-image ${motionClass}`}
                          />
                        </span>
                      </span>
                    </div>

                    <div
                      ref={(node) => {
                        tooltipRefs.current[object.id] = node
                      }}
                      className={tooltipClassName}
                      onMouseEnter={() => {
                        cancelTooltipClose()
                        setHoveredId(object.id)
                        updateTooltipEdgeMap(object.id)
                      }}
                      onMouseLeave={() => {
                        queueTooltipClose(object.id)
                      }}
                      onTouchStart={() => {
                        cancelTooltipClose()
                        setHoveredId(object.id)
                        updateTooltipEdgeMap(object.id)
                      }}
                    >
                      <p className="recently-node-tooltip-title">{object.title}</p>
                      <p className="recently-node-tooltip-subtitle">{object.subtitle}</p>
                      <p className="recently-node-tooltip-copy">{object.description}</p>

                      {object.spotifyEmbed && (
                        <iframe
                          src={object.spotifyEmbed}
                          className="recently-node-tooltip-spotify"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          title={`${object.title} Spotify player`}
                        />
                      )}

                      {!object.spotifyEmbed && object.image && (
                        <img src={object.image} alt={object.title} className="recently-node-tooltip-media" />
                      )}

                      {object.link && (
                        <a
                          href={object.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="recently-node-tooltip-link"
                        >
                          {object.link.text} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
