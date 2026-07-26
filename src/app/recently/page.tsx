'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RecentlyFunControls from '../components/RecentlyFunControls'
import { spreadSlotsForViewport } from '@/lib/recently-desk-layout'

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
  emoji?: string
  description: string
  date: string
  audioUrl?: string
  spotifyEmbed?: string
  spotifyEmbeds?: string[]
  spotifyBackdrop?: string
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
  emoji?: string
  image?: string
  link?: RecentlyLink
  links?: RecentlyLink[]
  spotifyEmbed?: string
  spotifyEmbeds?: string[]
  spotifyBackdrop?: string
}

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'

// Fixed 7-slot grid — spread across the desk so dice spawns feel roomy.
const DESK_SLOT_RECTS: Array<{ x: number; z: number; scale: number }> = [
  { x: 0.14, z: 0.80, scale: 0.82 },
  { x: 0.50, z: 0.92, scale: 0.82 },
  { x: 0.86, z: 0.80, scale: 0.82 },
  { x: 0.18, z: 0.44, scale: 0.82 },
  { x: 0.82, z: 0.44, scale: 0.82 },
  { x: 0.36, z: 0.22, scale: 0.82 },
  { x: 0.66, z: 0.26, scale: 0.82 },
]

const DEFAULT_RECENTLY_ITEMS: RecentlyItem[] = [
  {
    category: 'Music',
    item: 'NIKI - Every Summertime',
    description: 'Had this on repeat all week',
    date: 'this week',
    spotifyEmbed: 'https://open.spotify.com/embed/track/68HocO7fx9z0MgDU0ZPHro?utm_source=generator&theme=0',
    links: [
      { url: 'https://open.spotify.com/track/68HocO7fx9z0MgDU0ZPHro', text: 'Open on Spotify' },
    ],
  },
  {
    category: 'Watching',
    item: 'Severance',
    description: 'Wild plot. Still thinking about it',
    date: 'this week',
    image: '/recently/tv-severance.jpg',
    link: 'https://www.imdb.com/title/tt11280740/',
    linkText: 'View on IMDb',
  },
  {
    category: 'Photo',
    item: 'Favourite photo I took lately',
    description: 'Oregon coast at dusk',
    date: 'this week',
    image: '/photos/076-DSCF1105.jpg',
    link: '/photos',
    linkText: 'Open Photos',
  },
  {
    category: 'Reading',
    item: 'Same as Ever - Morgan Housel',
    description: 'Short chapters, weirdly useful',
    date: 'this week',
    image: '/recently/book-same-as-ever.jpg',
    link: 'https://www.penguinrandomhouse.com/books/672339/same-as-ever-by-morgan-housel/',
    linkText: 'Book page',
  },
  {
    category: 'Coffee',
    item: 'Granada + Endorffeine',
    description: 'Home cafe vibes + crazy good pour-over, solo by choice',
    date: 'this week',
    image: '/recently/coffee-pour-over.jpg',
    links: [
      {
        url: 'https://maps.google.com/?q=1451+Carroll+Ave,+Los+Angeles,+CA+90026',
        text: 'Granada on Maps',
      },
      {
        url: 'https://maps.google.com/?q=Endorffeine+727+N+Broadway+%23127,+Los+Angeles,+CA+90012',
        text: 'Endorffeine on Maps',
      },
    ],
  },
  {
    category: 'Podcast',
    item: 'Deep 3 + David Senra',
    description: 'Deep 3 on LeBron, then Senra talking to the Groq founder',
    date: 'this week',
    image: '/recently/podcast-deep3-senra.jpg',
    links: [
      {
        url: 'https://podcasts.apple.com/us/podcast/lebron-james-is-leaving-the-lakers-emergency-pod/id1657940794?i=1000774883125',
        text: 'Deep 3 - LeBron emergency pod',
      },
      {
        url: 'https://podcasts.apple.com/us/podcast/jonathan-ross-founder-of-groq/id1836497887?i=1000775505304',
        text: 'David Senra - Jonathan Ross / Groq',
      },
    ],
  },
  {
    category: 'Meme',
    item: 'I will be there no matter what',
    description: '',
    date: 'this week',
    image: '/recently/meme-mbappe-no-matter-what.png',
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
    case '/pixel-objects/microphone.svg':
      return { ...base, motionClass: 'is-mic-pulse' }
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

  if (Array.isArray(item.links) && item.links[0]?.url) {
    return item.links[0]
  }

  if (typeof item.link === 'string' && item.link.trim()) {
    return {
      url: item.link,
      text: item.linkText?.trim() || 'Open link',
    }
  }

  return undefined
}

const getItemLinks = (item: RecentlyItem | null): RecentlyLink[] => {
  if (!item) return []
  if (Array.isArray(item.links) && item.links.length > 0) {
    return item.links.filter((link) => Boolean(link?.url))
  }
  const primary = getPrimaryLink(item)
  return primary ? [primary] : []
}

export default function Recently() {
  const shuffleTimeoutRef = useRef<number | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [rollSeed, setRollSeed] = useState(1)
  const [isReady, setIsReady] = useState(true)
  const [items, setItems] = useState<RecentlyItem[]>([])
  const [viewportWidth, setViewportWidth] = useState(1280)

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  useEffect(() => {
    // Prefer shipped desk content. Drop stale local overrides from older drafts.
    try {
      const customRecently = parseArray<RecentlyItem>(localStorage.getItem('recentlyItems'))
      const meme = customRecently.find((item) => item.category?.toLowerCase() === 'meme')
      const looksCurrent = Boolean(
        meme
        && meme.image === '/recently/meme-mbappe-no-matter-what.png'
        && meme.item === 'I will be there no matter what'
        && !meme.description
        && !(meme.links?.length || meme.link)
      )
      if (customRecently.length > 0 && looksCurrent) {
        setItems(customRecently)
      } else if (customRecently.length > 0) {
        localStorage.removeItem('recentlyItems')
      }
    } catch {
      // ignore corrupt storage
    }
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
      const category = item.category?.toLowerCase() || ''
      if (category === 'music' || category === 'audio') return true
      const source = `${item.category} ${item.item}`.toLowerCase()
      return Boolean(item.spotifyEmbed || item.spotifyEmbeds?.length) || /music|song|album|listen/.test(source)
    }) || null
  ), [recentlyItems])

  const movieItem = useMemo(() => (
    recentlyItems.find((item) => {
      const category = item.category?.toLowerCase() || ''
      if (category === 'watching' || category === 'movie' || category === 'tv') return true
      const source = `${item.category} ${item.item}`.toLowerCase()
      return /movie|watch|film|tv|severance/.test(source)
    }) || null
  ), [recentlyItems])

  const photoItem = useMemo(() => (
    recentlyItems.find((item) => {
      const category = item.category?.toLowerCase() || ''
      // Prefer explicit photo slots — many other items also carry cover images.
      if (category === 'photo' || category === 'place' || category === 'archive') return true
      const source = `${item.category} ${item.item}`.toLowerCase()
      return /photo|camera/.test(source)
    }) || null
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
      spotifyEmbed?: string
    }> = [
      {
        id: 'record',
        kind: 'record',
        pixelArt: '/pixel-objects/vinyl-player.svg',
        fallbackTitle: 'Now spinning',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'What I’ve been listening to',
        item: musicItem || pick('Music', 'Audio'),
      },
      {
        id: 'camera',
        kind: 'camera',
        pixelArt: '/pixel-objects/fujifilm-camera.svg',
        fallbackTitle: 'Favourite photo I took lately',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'Oregon coast at dusk',
        item: photoItem || pick('Photo', 'Place', 'Archive'),
      },
      {
        id: 'movie',
        kind: 'movie',
        pixelArt: '/pixel-objects/film-frame.svg',
        fallbackTitle: 'Severance',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'Wild plot. Still thinking about it',
        item: movieItem || pick('Watching'),
      },
      {
        id: 'podcast',
        kind: 'artifact',
        pixelArt: '/pixel-objects/microphone.svg',
        fallbackTitle: 'Deep 3 + David Senra',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'What I’ve been listening to',
        item: pick('Podcast', 'Audio'),
      },
      {
        id: 'coffee',
        kind: 'artifact',
        pixelArt: '/pixel-objects/coffee-mug.svg',
        fallbackTitle: 'Granada + Endorffeine',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'Home cafe vibes + crazy good pour-over, solo by choice',
        item: pick('Coffee'),
      },
      {
        id: 'book',
        kind: 'artifact',
        pixelArt: '/pixel-objects/book-stack.svg',
        fallbackTitle: 'Same as Ever - Morgan Housel',
        fallbackSubtitle: 'this week',
        fallbackDescription: 'Short chapters, weirdly useful',
        item: pick('Reading'),
      },
      {
        id: 'meme',
        kind: 'artifact',
        pixelArt: '/pixel-objects/postcard.svg',
        fallbackTitle: 'I will be there no matter what',
        fallbackSubtitle: 'this week',
        fallbackDescription: '',
        item: pick('Meme'),
      },
    ]

    return deskIcons.map((icon) => {
      const links = getItemLinks(icon.item)
      const embeds = icon.item?.spotifyEmbeds?.length
        ? icon.item.spotifyEmbeds
        : icon.item?.spotifyEmbed
          ? [icon.item.spotifyEmbed]
          : undefined
      return {
        id: icon.id,
        kind: icon.kind,
        pixelArt: icon.pixelArt,
        title: icon.item?.item || icon.fallbackTitle,
        subtitle: icon.item?.date || icon.fallbackSubtitle,
        description: icon.item?.description ?? icon.fallbackDescription,
        emoji: icon.item?.emoji?.trim() || undefined,
        image: getPrimaryImage(icon.item),
        spotifyEmbed: embeds?.[0],
        spotifyEmbeds: embeds,
        link: links[0],
        links,
      }
    })
  }, [movieItem, musicItem, photoItem, recentlyItems])

  const shuffledSlots = useMemo(
    () => shuffleWithSeed(spreadSlotsForViewport(DESK_SLOT_RECTS, viewportWidth), rollSeed),
    [rollSeed, viewportWidth]
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
