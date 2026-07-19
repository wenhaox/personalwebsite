'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RecentlyFunControls from '../components/RecentlyFunControls'

const RecentlyDeskBoard = dynamic(() => import('../components/RecentlyDeskBoard'), {
  ssr: false,
  loading: () => <div className="recently-iso-canvas recently-iso-canvas-loading" />,
})

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

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'

// Fixed 7-slot grid with hard gaps so icons never sit on top of each other.
const DESK_SLOT_RECTS: Array<{ x: number; z: number; scale: number }> = [
  { x: 0.311, z: 0.507, scale: 0.82 },
  { x: 0.723, z: 0.443, scale: 0.82 },
  { x: 0.541, z: 1, scale: 0.82 },
  { x: 0.92, z: 0.2, scale: 0.82 },
  { x: 0.528, z: 0.352, scale: 0.82 },
  { x: 1, z: 0.673, scale: 0.82 },
  { x: 0.202, z: 0.154, scale: 0.82 },
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

interface ObjectPresentation {
  motionClass: string
  pixelExtraClass: string
  spriteExtraClass: string
  showCoffeeSteam: boolean
  showCassetteReels: boolean
  isSmoothArt: boolean
}

const STATIC_MOTION = 'is-static-item'

const getObjectPresentation = (pixelArt: string, kind: string): ObjectPresentation => {
  const base: ObjectPresentation = {
    motionClass: STATIC_MOTION,
    pixelExtraClass: '',
    spriteExtraClass: '',
    showCoffeeSteam: false,
    showCassetteReels: false,
    isSmoothArt: pixelArt.endsWith('/dice-cube.svg'),
  }

  switch (pixelArt) {
    case '/pixel-objects/vinyl-player.svg':
    case '/pixel-objects/vinyl-record.svg':
      return { ...base, motionClass: 'is-turntable', pixelExtraClass: 'has-turntable', spriteExtraClass: 'is-turntable-stage', isSmoothArt: false }
    case '/pixel-objects/film-frame.svg':
      return { ...base, motionClass: 'is-film-flicker' }
    case '/pixel-objects/fujifilm-camera.svg':
      return { ...base, motionClass: 'is-camera-shutter' }
    case '/pixel-objects/cassette.svg':
      return { ...base, pixelExtraClass: 'has-cassette-reels', showCassetteReels: true }
    case '/pixel-objects/arcade-token.svg':
      return { ...base, motionClass: 'is-token-flip', spriteExtraClass: 'is-token-stage' }
    case '/pixel-objects/hourglass.svg':
      return { ...base, motionClass: 'is-hourglass-flip' }
    case '/pixel-objects/compass.svg':
      return { ...base, motionClass: 'is-compass-sway' }
    case '/pixel-objects/coffee-mug.svg':
      return { ...base, pixelExtraClass: 'has-coffee-steam', showCoffeeSteam: true }
    case '/pixel-objects/radio.svg':
      return { ...base, motionClass: 'is-radio-wiggle' }
    case '/pixel-objects/desk-lamp.svg':
      return { ...base, motionClass: 'is-lamp-glow' }
    case '/pixel-objects/headphones.svg':
      return { ...base, motionClass: 'is-headphones-bob' }
    case '/pixel-objects/gamepad.svg':
      return { ...base, motionClass: 'is-gamepad-tap' }
    case '/pixel-objects/postcard.svg':
      return { ...base, motionClass: 'is-postcard-flutter' }
    case '/pixel-objects/book-stack.svg':
      return { ...base, motionClass: 'is-book-breathe' }
    case '/pixel-objects/backpack.svg':
      return { ...base, motionClass: 'is-backpack-sway' }
    case '/pixel-objects/potted-plant.svg':
      return { ...base, motionClass: 'is-plant-sway' }
    case '/pixel-objects/dice-cube.svg':
      return { ...base, motionClass: 'is-dice-idle', isSmoothArt: true }
    default:
      if (kind === 'movie') {
        return { ...base, motionClass: 'is-film-flicker' }
      }
      if (kind === 'camera') {
        return { ...base, motionClass: 'is-camera-shutter' }
      }
      return base
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

export default function Recently() {
  const shuffleTimeoutRef = useRef<number | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [rollSeed, setRollSeed] = useState(1)
  const [isReady, setIsReady] = useState(true)
  const [items, setItems] = useState<RecentlyItem[]>([])

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
    }
  ), [])

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
      '/pixel-objects/headphones.svg',
      '/pixel-objects/coffee-mug.svg',
      '/pixel-objects/gamepad.svg',
      '/pixel-objects/book-stack.svg',
      '/pixel-objects/compass.svg',
      '/pixel-objects/cassette.svg',
      '/pixel-objects/postcard.svg',
      '/pixel-objects/radio.svg',
      '/pixel-objects/hourglass.svg',
      '/pixel-objects/arcade-token.svg',
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
        pixelArt: '/pixel-objects/vinyl-player.svg',
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

    const targetCount = 7
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

  const shuffledSlots = useMemo(
    () => shuffleWithSeed(DESK_SLOT_RECTS, rollSeed),
    [rollSeed]
  )

  const handleRollShelf = useCallback(() => {
    if (!isReady || isShuffling) return

    setIsShuffling(true)
    setRollSeed((current) => current + 1)

    if (shuffleTimeoutRef.current) {
      window.clearTimeout(shuffleTimeoutRef.current)
    }

    shuffleTimeoutRef.current = window.setTimeout(() => {
      setIsShuffling(false)
    }, 700)
  }, [isReady, isShuffling])

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
            <RecentlyDeskBoard
              objects={boardObjects}
              fallbackSlots={shuffledSlots}
              layoutSeed={rollSeed}
              isReady={isReady}
              isShuffling={isShuffling}
              getPresentation={getObjectPresentation}
            />
          </div>
        </div>

        <RecentlyFunControls className="recently-mobile-fun-bar" layout="row" />
      </section>
    </div>
  )
}
