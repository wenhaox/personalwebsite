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
  { x: 0.252, z: 0.754, scale: 0.82 },
  { x: 0.783, z: 0.564, scale: 0.82 },
  { x: 0.605, z: 0.9, scale: 0.82 },
  { x: 0.96, z: 0.318, scale: 0.82 },
  { x: 0.488, z: 0.281, scale: 0.82 },
  { x: 0.96, z: 0.96, scale: 0.82 },
  { x: 0.266, z: 0.223, scale: 0.82 },
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
    case '/pixel-objects/headphones.svg':
      return { ...base, motionClass: 'is-headphones-bob' }
    case '/pixel-objects/gamepad.svg':
      return { ...base, motionClass: 'is-gamepad-tap' }
    case '/pixel-objects/postcard.svg':
      return { ...base, motionClass: 'is-postcard-flutter' }
    case '/pixel-objects/book-stack.svg':
      return { ...base, motionClass: 'is-book-breathe' }
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
    const byCategory = (category: string) => (
      recentlyItems.find((item) => item.category.toLowerCase() === category.toLowerCase()) || null
    )

    const pick = (...categories: string[]) => {
      for (const category of categories) {
        const hit = byCategory(category)
        if (hit) return hit
      }
      return null
    }

    const deskIcons: Array<{
      id: string
      kind: BoardObjectKind
      pixelArt: string
      fallbackTitle: string
      fallbackSubtitle: string
      fallbackDescription: string
      item: RecentlyItem | null
    }> = [
      {
        id: 'record',
        kind: 'record',
        pixelArt: '/pixel-objects/vinyl-player.svg',
        fallbackTitle: 'Now spinning',
        fallbackSubtitle: 'This week',
        fallbackDescription: 'Music in rotation right now.',
        item: musicItem || pick('Music', 'Audio'),
      },
      {
        id: 'camera',
        kind: 'camera',
        pixelArt: '/pixel-objects/fujifilm-camera.svg',
        fallbackTitle: 'Current photo obsession',
        fallbackSubtitle: 'This week',
        fallbackDescription: 'Captured recently and still replaying in my head.',
        item: photoItem || pick('Place', 'Archive'),
      },
      {
        id: 'movie',
        kind: 'movie',
        pixelArt: '/pixel-objects/film-frame.svg',
        fallbackTitle: 'Current watch',
        fallbackSubtitle: 'Recent',
        fallbackDescription: 'A movie scene I keep thinking about.',
        item: movieItem || pick('Watching'),
      },
      {
        id: 'headphones',
        kind: 'artifact',
        pixelArt: '/pixel-objects/headphones.svg',
        fallbackTitle: 'Late-night cassette mix',
        fallbackSubtitle: 'Yesterday',
        fallbackDescription: 'A mellow tape loop for long editing sessions.',
        item: pick('Audio', 'Music'),
      },
      {
        id: 'coffee',
        kind: 'artifact',
        pixelArt: '/pixel-objects/coffee-mug.svg',
        fallbackTitle: 'Kenya AB pour-over dial-in',
        fallbackSubtitle: 'Today',
        fallbackDescription: 'Brighter cup at a finer grind and slightly cooler water.',
        item: pick('Coffee'),
      },
      {
        id: 'gamepad',
        kind: 'artifact',
        pixelArt: '/pixel-objects/gamepad.svg',
        fallbackTitle: 'Retro co-op night',
        fallbackSubtitle: 'Friday',
        fallbackDescription: 'Quick arcade rounds after work.',
        item: pick('Play'),
      },
      {
        id: 'book',
        kind: 'artifact',
        pixelArt: '/pixel-objects/book-stack.svg',
        fallbackTitle: 'The Creative Act',
        fallbackSubtitle: 'This week',
        fallbackDescription: 'Short sections, slow pace, and surprisingly useful prompts.',
        item: pick('Reading'),
      },
    ]

    return deskIcons.map((icon) => ({
      id: icon.id,
      kind: icon.kind,
      pixelArt: icon.pixelArt,
      title: icon.item?.item || icon.fallbackTitle,
      subtitle: icon.item?.date || icon.fallbackSubtitle,
      description: icon.item?.description || icon.fallbackDescription,
      image: getPrimaryImage(icon.item),
      spotifyEmbed: icon.kind === 'record' ? icon.item?.spotifyEmbed : undefined,
      link: getPrimaryLink(icon.item),
    }))
  }, [movieItem, musicItem, photoItem, recentlyItems])

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

        <div className="recently-popup-dock" aria-hidden="true" />

        <RecentlyFunControls className="recently-mobile-fun-bar" layout="row" />
      </section>
    </div>
  )
}
