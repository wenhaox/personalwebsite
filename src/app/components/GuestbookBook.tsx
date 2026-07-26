'use client'

import { type ChangeEvent, type CSSProperties, type FormEvent, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { GUESTBOOK_NOTE_COLORS, useGuestbookCompose } from './GuestbookComposeContext'
import GuestbookComposeControls from './GuestbookComposeControls'

interface GuestbookEntry {
  id: number
  name: string
  message: string
  date: string
  approved: boolean
  createdAt?: string
  x?: number
  y?: number
  color?: string
}

interface GuestbookNote extends GuestbookEntry {
  x: number
  y: number
  color: string
}

type DecorationKind = 'emoji' | 'photo'

interface BoardDecoration {
  id: number
  kind: DecorationKind
  value: string
  x: number
  y: number
  size: number
  rotation: number
  approved?: boolean
}

interface GuestbookBookProps {
  compact?: boolean
  fullHeight?: boolean
  showZoomTools?: boolean
  enableBoardZoom?: boolean
}

const NOTE_WIDTH = 148
const NOTE_HEIGHT = 118
const MIN_BOARD_ZOOM = 0.8
const MAX_BOARD_ZOOM = 1.9
const BOARD_ZOOM_STEP = 0.1
const STICKY_COLORS = [...GUESTBOOK_NOTE_COLORS]
const DECORATIONS_KEY = 'guestboardDecorations:v2'
const ENTRIES_KEY = 'guestbookEntries:v2'
const EMOJI_PICKER = ['✨', '🌿', '🫶', '📷', '☕', '🌤️', '🎵', '🧠', '🪩', '💫', '🌼', '🍀']
const GUESTBOOK_API_ENDPOINT = '/api/guestbook'

const clamp = (value: number, min: number, max: number): number => (
  Math.min(Math.max(value, min), max)
)

const randomBetween = (min: number, max: number): number => {
  if (max <= min) return Math.round(min)
  return Math.round(min + (Math.random() * (max - min)))
}

const normalizePhotoInput = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^data:image\//i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`
  }

  return null
}

const toDisplayDate = (entry: Partial<GuestbookEntry>): string => {
  if (entry.date && entry.date.trim()) {
    return entry.date
  }

  const source = entry.createdAt || new Date().toISOString()
  const parsed = new Date(source)

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getLimitsForDimensions = (boardWidth: number, boardHeight: number, width: number, height: number) => {
  const fallbackWidth = Math.max(560, width + 64)
  const fallbackHeight = Math.max(320, height + 64)
  const effectiveWidth = boardWidth >= (width + 24) ? boardWidth : fallbackWidth
  const effectiveHeight = boardHeight >= (height + 24) ? boardHeight : fallbackHeight

  return {
    minX: 0,
    maxX: Math.max(effectiveWidth - width, 0),
    minY: 0,
    maxY: Math.max(effectiveHeight - height, 0),
  }
}

const getLimits = (board: HTMLDivElement | null, width: number, height: number) => {
  if (!board) {
    return getLimitsForDimensions(0, 0, width, height)
  }

  return getLimitsForDimensions(board.clientWidth, board.clientHeight, width, height)
}

const scaleAxisPosition = (value: number, previousMax: number, nextMax: number): number => {
  if (nextMax <= 0) return 0
  if (previousMax <= 0) return clamp(Math.round(value), 0, nextMax)

  const normalized = value / previousMax
  return clamp(Math.round(normalized * nextMax), 0, nextMax)
}

const isLikelyImageUrl = (value: string): boolean => (
  /^https?:\/\//i.test(value) || /^data:image\//i.test(value)
)

const NOTE_LAYOUT_REF = { width: 720, height: 460 }

const getFallbackNotePosition = (
  index: number,
  boardWidth = NOTE_LAYOUT_REF.width,
  boardHeight = NOTE_LAYOUT_REF.height
): { x: number; y: number } => {
  const limits = getLimitsForDimensions(boardWidth, boardHeight, NOTE_WIDTH, NOTE_HEIGHT)
  const cols = Math.max(2, Math.min(5, Math.round(boardWidth / 220)))
  const rows = Math.max(2, Math.ceil((index + 1) / cols))
  const col = index % cols
  const row = Math.floor(index / cols)
  const cellW = limits.maxX / Math.max(cols - 1, 1)
  const cellH = limits.maxY / Math.max(Math.max(rows, 2) - 1, 1)
  const laneOffset = row % 2 === 0 ? 0 : cellW * 0.12
  const waveX = Math.round(Math.sin((index + 1) * 1.27) * Math.min(28, cellW * 0.08))
  const waveY = Math.round(Math.cos((index + 1) * 1.41) * Math.min(22, cellH * 0.08))

  return {
    x: clamp(Math.round(col * cellW + laneOffset + waveX), limits.minX, limits.maxX),
    y: clamp(Math.round(row * cellH + waveY), limits.minY, limits.maxY),
  }
}

const isNormalizedBoardCoord = (x: number, y: number) => (
  x >= 0 && x <= 1 && y >= 0 && y <= 1
)

const mapStoredPositionToBoard = (
  x: number | undefined,
  y: number | undefined,
  index: number,
  boardWidth: number,
  boardHeight: number,
  itemWidth: number,
  itemHeight: number
) => {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return getFallbackNotePosition(index, boardWidth, boardHeight)
  }

  return scaleLegacyPositionToBoard(x, y, boardWidth, boardHeight, itemWidth, itemHeight)
}

const scaleLegacyPositionToBoard = (
  x: number,
  y: number,
  boardWidth: number,
  boardHeight: number,
  itemWidth: number,
  itemHeight: number
) => {
  const next = getLimitsForDimensions(boardWidth, boardHeight, itemWidth, itemHeight)
  // Values in 0..1 are treated as normalized board fractions (remote save format).
  if (isNormalizedBoardCoord(x, y)) {
    return {
      x: clamp(Math.round(x * next.maxX), next.minX, next.maxX),
      y: clamp(Math.round(y * next.maxY), next.minY, next.maxY),
    }
  }

  const prev = getLimitsForDimensions(NOTE_LAYOUT_REF.width, NOTE_LAYOUT_REF.height, itemWidth, itemHeight)
  return {
    x: scaleAxisPosition(x, prev.maxX, next.maxX),
    y: scaleAxisPosition(y, prev.maxY, next.maxY),
  }
}

const toNormalizedBoardCoord = (value: number, max: number) => {
  if (max <= 0) return 0
  return clamp(Number((value / max).toFixed(4)), 0, 1)
}

const buildPersistableGuestbookPayload = (
  entries: GuestbookEntry[],
  decorations: BoardDecoration[],
  board: HTMLDivElement | null
) => {
  const noteLimits = getLimits(board, NOTE_WIDTH, NOTE_HEIGHT)
  return {
    entries: entries.map((entry) => ({
      ...entry,
      x: typeof entry.x === 'number' ? toNormalizedBoardCoord(entry.x, noteLimits.maxX) : entry.x,
      y: typeof entry.y === 'number' ? toNormalizedBoardCoord(entry.y, noteLimits.maxY) : entry.y,
    })),
    decorations: decorations.map((item) => {
      const limits = getLimits(board, item.size, item.size)
      return {
        ...item,
        x: toNormalizedBoardCoord(item.x, limits.maxX),
        y: toNormalizedBoardCoord(item.y, limits.maxY),
      }
    }),
  }
}

const normalizeNotesFromSource = (
  value: unknown,
  boardWidth = NOTE_LAYOUT_REF.width,
  boardHeight = NOTE_LAYOUT_REF.height
): GuestbookNote[] => {
  if (!Array.isArray(value)) return []

  const normalized = value
    .filter((entry: Partial<GuestbookEntry>) => entry.approved !== false)
    .map((entry: Partial<GuestbookEntry>, index: number) => {
      const mapped = mapStoredPositionToBoard(
        typeof entry.x === 'number' ? entry.x : undefined,
        typeof entry.y === 'number' ? entry.y : undefined,
        index,
        boardWidth,
        boardHeight,
        NOTE_WIDTH,
        NOTE_HEIGHT
      )

      return {
        id: typeof entry.id === 'number' ? entry.id : Date.now() + index,
        name: 'Anonymous',
        message: (entry.message || '').trim() || 'A quiet note left on the board.',
        date: toDisplayDate(entry),
        approved: true,
        createdAt: entry.createdAt,
        x: mapped.x,
        y: mapped.y,
        color: typeof entry.color === 'string' ? entry.color : STICKY_COLORS[index % STICKY_COLORS.length],
      }
    })

  return normalized
}

const normalizePendingEntriesFromSource = (
  value: unknown,
  boardWidth = NOTE_LAYOUT_REF.width,
  boardHeight = NOTE_LAYOUT_REF.height
): GuestbookEntry[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry: Partial<GuestbookEntry>) => entry.approved === false)
    .map((entry: Partial<GuestbookEntry>, index: number) => {
      const mapped = mapStoredPositionToBoard(
        typeof entry.x === 'number' ? entry.x : undefined,
        typeof entry.y === 'number' ? entry.y : undefined,
        index,
        boardWidth,
        boardHeight,
        NOTE_WIDTH,
        NOTE_HEIGHT
      )

      return {
        id: typeof entry.id === 'number' ? entry.id : Date.now() + index,
        name: 'Anonymous',
        message: (entry.message || '').trim() || 'Pending note.',
        date: toDisplayDate(entry),
        approved: false,
        createdAt: entry.createdAt,
        x: mapped.x,
        y: mapped.y,
        color: typeof entry.color === 'string' ? entry.color : STICKY_COLORS[index % STICKY_COLORS.length],
      }
    })
}

const normalizeDecorationsFromSource = (
  value: unknown,
  boardWidth = NOTE_LAYOUT_REF.width,
  boardHeight = NOTE_LAYOUT_REF.height
): BoardDecoration[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((item: Partial<BoardDecoration>) => typeof item.value === 'string' && item.value.trim())
    .map((item: Partial<BoardDecoration>, index: number): BoardDecoration => {
      const kind: DecorationKind = item.kind === 'photo' ? 'photo' : 'emoji'
      // Emoji always approved; missing approved on photos is treated as approved (legacy).
      const approved = kind === 'emoji' ? true : item.approved !== false
      const size = typeof item.size === 'number' ? clamp(item.size, 72, 152) : 90
      const mapped = mapStoredPositionToBoard(
        typeof item.x === 'number' ? item.x : undefined,
        typeof item.y === 'number' ? item.y : undefined,
        index,
        boardWidth,
        boardHeight,
        size,
        size
      )

      return {
        id: typeof item.id === 'number' ? item.id : Date.now() + index,
        kind,
        value: (item.value || '').trim(),
        x: mapped.x,
        y: mapped.y,
        size,
        rotation: typeof item.rotation === 'number' ? clamp(item.rotation, -10, 10) : ((index % 5) - 2) * 1.8,
        approved,
      }
    })
}

const saveGuestbookRemote = async (payload: { entries: GuestbookEntry[]; decorations: BoardDecoration[] }) => {
  try {
    const response = await fetch(GUESTBOOK_API_ENDPOINT, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({})) as {
      durable?: boolean
      storage?: string
      hint?: string
      error?: string
    }

    if (!response.ok) {
      return { ok: false, durable: false, hint: data.error || data.hint || 'Could not save guestbook.' }
    }

    return {
      ok: true,
      durable: Boolean(data.durable),
      hint: typeof data.hint === 'string' ? data.hint : undefined,
      storage: typeof data.storage === 'string' ? data.storage : undefined,
    }
  } catch {
    return { ok: false, durable: false, hint: 'Network error while saving guestbook.' }
  }
}

export default function GuestbookBook({
  compact = false,
  fullHeight = false,
  showZoomTools = true,
  enableBoardZoom = true,
}: GuestbookBookProps) {
  const boardViewportRef = useRef<HTMLDivElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoUrlToggleRef = useRef<HTMLButtonElement | null>(null)
  const photoUrlPopoverRef = useRef<HTMLDivElement | null>(null)
  const remoteSyncTimerRef = useRef<number | null>(null)
  const boardSizeRef = useRef<{ width: number; height: number } | null>(null)
  const notesLayoutSizeRef = useRef<{ width: number; height: number } | null>(null)
  const noteDragStartRef = useRef<Record<string, { x: number; y: number }>>({})
  const {
    noteColor,
    setBoardReady: setComposeBoardReady,
    registerPinHandler,
  } = useGuestbookCompose()
  const [notes, setNotes] = useState<GuestbookNote[]>([])
  const [pendingEntries, setPendingEntries] = useState<GuestbookEntry[]>([])
  const [decorations, setDecorations] = useState<BoardDecoration[]>([])
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [customEmoji, setCustomEmoji] = useState('')
  const [isUrlPopoverOpen, setIsUrlPopoverOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFeedback, setPhotoFeedback] = useState('')
  const [submissionFeedback, setSubmissionFeedback] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [boardZoom, setBoardZoom] = useState(1)
  const [hasMutatedEntries, setHasMutatedEntries] = useState(false)
  const [hasMutatedDecorations, setHasMutatedDecorations] = useState(false)
  const [boardReady, setBoardReady] = useState(false)

  const zoomLabel = useMemo(() => `${Math.round(boardZoom * 100)}%`, [boardZoom])
  const inverseBoardZoom = useMemo(() => 1 / boardZoom, [boardZoom])
  const boardCanvasWidthPercent = useMemo(
    () => (enableBoardZoom ? Math.max(boardZoom * 100, 100) : 100),
    [boardZoom, enableBoardZoom]
  )
  const boardCanvasHeightPercent = useMemo(
    () => (enableBoardZoom ? Math.max(boardZoom * 100, 100) : (fullHeight ? 124 : 100)),
    [boardZoom, enableBoardZoom, fullHeight]
  )
  const entriesPayload = useMemo<GuestbookEntry[]>(() => {
    const approvedNotes: GuestbookEntry[] = notes.map((note) => ({
      ...note,
      name: 'Anonymous',
      approved: true,
    }))

    const pending: GuestbookEntry[] = pendingEntries.map((entry) => ({
      ...entry,
      name: 'Anonymous',
      approved: false,
    }))

    return [...approvedNotes, ...pending]
  }, [notes, pendingEntries])

  useEffect(() => {
    setComposeBoardReady(true)
    registerPinHandler(() => {
      formRef.current?.requestSubmit()
    })
    return () => {
      setComposeBoardReady(false)
      registerPinHandler(null)
    }
  }, [registerPinHandler, setComposeBoardReady])

  useEffect(() => {
    const syncComposeAlign = () => {
      const form = formRef.current
      if (!form || typeof window === 'undefined') return
      if (!window.matchMedia('(min-width: 1025px)').matches) {
        document.documentElement.style.removeProperty('--guestbook-compose-align-top')
        return
      }
      const noteField = form.querySelector('.guestbook-note-input-wrap') as HTMLElement | null
      const rect = (noteField || form).getBoundingClientRect()
      // Align sidebar palette/pin row with the top of the note field.
      document.documentElement.style.setProperty(
        '--guestbook-compose-align-top',
        `${Math.round(rect.top)}px`
      )
    }

    syncComposeAlign()
    const frame = window.requestAnimationFrame(syncComposeAlign)
    const timer = window.setTimeout(syncComposeAlign, 120)
    const late = window.setTimeout(syncComposeAlign, 480)
    window.addEventListener('resize', syncComposeAlign)
    window.addEventListener('scroll', syncComposeAlign, true)

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => syncComposeAlign())
      : null
    if (resizeObserver && formRef.current) {
      resizeObserver.observe(formRef.current)
      const noteField = formRef.current.querySelector('.guestbook-note-input-wrap')
      if (noteField) resizeObserver.observe(noteField)
    }

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.clearTimeout(late)
      window.removeEventListener('resize', syncComposeAlign)
      window.removeEventListener('scroll', syncComposeAlign, true)
      resizeObserver?.disconnect()
      document.documentElement.style.removeProperty('--guestbook-compose-align-top')
    }
  }, [boardReady])

  useEffect(() => {
    let isCancelled = false

    const loadBoard = async () => {
      // Let the cork board measure once so spawn/load positions aren't stuck on the tiny ref size.
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve())
        })
      })
      if (isCancelled) return

      const layoutSize = () => {
        const live = boardRef.current
        if (live && live.clientWidth > 40 && live.clientHeight > 40) {
          return { width: live.clientWidth, height: live.clientHeight }
        }
        if (boardSizeRef.current && boardSizeRef.current.width > 40 && boardSizeRef.current.height > 40) {
          return boardSizeRef.current
        }
        return NOTE_LAYOUT_REF
      }

      const applyMappedBoard = (
        nextNotes: GuestbookNote[],
        nextPending: GuestbookEntry[],
        nextDecorations: BoardDecoration[],
        size: { width: number; height: number }
      ) => {
        notesLayoutSizeRef.current = size
        setNotes(nextNotes)
        setPendingEntries(nextPending)
        setDecorations(nextDecorations)
      }

      const applyLocalFallback = () => {
        try {
          const size = layoutSize()
          const localEntries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || 'null')
          const localNotes = normalizeNotesFromSource(localEntries, size.width, size.height)
          const localPendingEntries = normalizePendingEntriesFromSource(localEntries, size.width, size.height)
          const localDecorations = normalizeDecorationsFromSource(
            JSON.parse(localStorage.getItem(DECORATIONS_KEY) || 'null'),
            size.width,
            size.height
          )
          if (isCancelled) return
          applyMappedBoard(localNotes, localPendingEntries, localDecorations, size)
        } catch {
          // Keep empty board.
        }
      }

      try {
        const response = await fetch(GUESTBOOK_API_ENDPOINT, { cache: 'no-store' })
        if (!response.ok) {
          applyLocalFallback()
          return
        }

        const payload = await response.json()
        if (isCancelled || !payload || typeof payload !== 'object') return

        const size = layoutSize()
        const remoteNotes = normalizeNotesFromSource(
          (payload as { entries?: unknown[] }).entries,
          size.width,
          size.height
        )
        const remotePendingEntries = normalizePendingEntriesFromSource(
          (payload as { entries?: unknown[] }).entries,
          size.width,
          size.height
        )
        const remoteDecorations = normalizeDecorationsFromSource(
          (payload as { decorations?: unknown[] }).decorations,
          size.width,
          size.height
        )

        applyMappedBoard(remoteNotes, remotePendingEntries, remoteDecorations, size)

        const persistable = buildPersistableGuestbookPayload(
          [
            ...remoteNotes.map((note) => ({ ...note, name: 'Anonymous', approved: true })),
            ...remotePendingEntries.map((entry) => ({ ...entry, name: 'Anonymous', approved: false })),
          ],
          remoteDecorations,
          boardRef.current
        )
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(persistable.entries))
        localStorage.setItem(DECORATIONS_KEY, JSON.stringify(persistable.decorations))
        // Drop legacy caches that caused the old-notes flash.
        localStorage.removeItem('guestbookEntries')
        localStorage.removeItem('guestboardDecorations')
      } catch {
        applyLocalFallback()
      } finally {
        if (!isCancelled) setBoardReady(true)
      }
    }

    void loadBoard()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasMutatedEntries) return

    const payload = buildPersistableGuestbookPayload(entriesPayload, decorations, boardRef.current)
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(payload.entries))
  }, [decorations, entriesPayload, hasMutatedEntries])

  useEffect(() => {
    if (!hasMutatedDecorations) return

    const payload = buildPersistableGuestbookPayload(entriesPayload, decorations, boardRef.current)
    localStorage.setItem(DECORATIONS_KEY, JSON.stringify(payload.decorations))
  }, [decorations, entriesPayload, hasMutatedDecorations])

  useEffect(() => {
    if (!hasMutatedEntries && !hasMutatedDecorations) return

    if (remoteSyncTimerRef.current) {
      window.clearTimeout(remoteSyncTimerRef.current)
    }

    remoteSyncTimerRef.current = window.setTimeout(() => {
      void saveGuestbookRemote(
        buildPersistableGuestbookPayload(entriesPayload, decorations, boardRef.current)
      ).then((result) => {
        if (!result.ok || !result.durable) {
          setSubmissionFeedback(result.hint || 'Could not save to the shared guestbook yet.')
          window.setTimeout(() => setSubmissionFeedback(''), 4200)
        }
      })
    }, 420)

    return () => {
      if (remoteSyncTimerRef.current) {
        window.clearTimeout(remoteSyncTimerRef.current)
      }
    }
  }, [decorations, entriesPayload, hasMutatedDecorations, hasMutatedEntries])

  useEffect(() => {
    if (!isUrlPopoverOpen) return

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (photoUrlPopoverRef.current?.contains(target)) return
      if (photoUrlToggleRef.current?.contains(target)) return

      setIsUrlPopoverOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDownOutside)
    return () => window.removeEventListener('pointerdown', handlePointerDownOutside)
  }, [isUrlPopoverOpen])

  useEffect(() => {
    let animationFrameId = 0

    const reflowItemsToBoard = () => {
      const board = boardRef.current
      if (!board) return

      const previousBoardSize = boardSizeRef.current
      const measuredWidth = board.clientWidth
      const measuredHeight = board.clientHeight
      const currentBoardSize = {
        width: measuredWidth > 0
          ? measuredWidth
          : (previousBoardSize?.width ?? Math.max(560, NOTE_WIDTH + 64)),
        height: measuredHeight > 0
          ? measuredHeight
          : (previousBoardSize?.height ?? Math.max(320, NOTE_HEIGHT + 64)),
      }
      const sizeChanged = Boolean(
        previousBoardSize &&
        (
          Math.abs(previousBoardSize.width - currentBoardSize.width) > 1 ||
          Math.abs(previousBoardSize.height - currentBoardSize.height) > 1
        )
      )
      const isFirstMeasure = !previousBoardSize

      let hasNoteAdjustment = false
      let hasDecorationAdjustment = false

      setNotes((prev) => {
        if (prev.length === 0) return prev

        const nextLimits = getLimitsForDimensions(currentBoardSize.width, currentBoardSize.height, NOTE_WIDTH, NOTE_HEIGHT)
        const previousLimits = previousBoardSize
          ? getLimitsForDimensions(previousBoardSize.width, previousBoardSize.height, NOTE_WIDTH, NOTE_HEIGHT)
          : getLimitsForDimensions(NOTE_LAYOUT_REF.width, NOTE_LAYOUT_REF.height, NOTE_WIDTH, NOTE_HEIGHT)

        const nextNotes = prev.map((note) => {
          let nextX = note.x
          let nextY = note.y

          if (isFirstMeasure || isNormalizedBoardCoord(note.x, note.y)) {
            const mapped = scaleLegacyPositionToBoard(
              note.x,
              note.y,
              currentBoardSize.width,
              currentBoardSize.height,
              NOTE_WIDTH,
              NOTE_HEIGHT
            )
            nextX = mapped.x
            nextY = mapped.y
          } else if (sizeChanged && previousLimits) {
            nextX = scaleAxisPosition(note.x, previousLimits.maxX, nextLimits.maxX)
            nextY = scaleAxisPosition(note.y, previousLimits.maxY, nextLimits.maxY)
          }

          nextX = clamp(Math.round(nextX), nextLimits.minX, nextLimits.maxX)
          nextY = clamp(Math.round(nextY), nextLimits.minY, nextLimits.maxY)
          if (nextX === note.x && nextY === note.y) return note
          hasNoteAdjustment = true
          return {
            ...note,
            x: nextX,
            y: nextY,
          }
        })

        return hasNoteAdjustment ? nextNotes : prev
      })

      setDecorations((prev) => {
        if (prev.length === 0) return prev

        const nextDecorations = prev.map((item) => {
          const nextLimits = getLimitsForDimensions(currentBoardSize.width, currentBoardSize.height, item.size, item.size)
          const previousLimits = previousBoardSize
            ? getLimitsForDimensions(previousBoardSize.width, previousBoardSize.height, item.size, item.size)
            : getLimitsForDimensions(NOTE_LAYOUT_REF.width, NOTE_LAYOUT_REF.height, item.size, item.size)

          let nextX = item.x
          let nextY = item.y

          if (isFirstMeasure || isNormalizedBoardCoord(item.x, item.y)) {
            const mapped = scaleLegacyPositionToBoard(
              item.x,
              item.y,
              currentBoardSize.width,
              currentBoardSize.height,
              item.size,
              item.size
            )
            nextX = mapped.x
            nextY = mapped.y
          } else if (sizeChanged && previousLimits) {
            nextX = scaleAxisPosition(item.x, previousLimits.maxX, nextLimits.maxX)
            nextY = scaleAxisPosition(item.y, previousLimits.maxY, nextLimits.maxY)
          }

          nextX = clamp(Math.round(nextX), nextLimits.minX, nextLimits.maxX)
          nextY = clamp(Math.round(nextY), nextLimits.minY, nextLimits.maxY)
          if (nextX === item.x && nextY === item.y) return item
          hasDecorationAdjustment = true
          return {
            ...item,
            x: nextX,
            y: nextY,
          }
        })

        return hasDecorationAdjustment ? nextDecorations : prev
      })

      boardSizeRef.current = currentBoardSize
    }

    const queueReflowItemsToBoard = () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = window.requestAnimationFrame(() => {
        reflowItemsToBoard()
      })
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
        queueReflowItemsToBoard()
      })
      : null

    if (resizeObserver && boardRef.current) {
      resizeObserver.observe(boardRef.current)
    }

    if (resizeObserver && boardViewportRef.current) {
      resizeObserver.observe(boardViewportRef.current)
    }

    queueReflowItemsToBoard()
    const settleTimeoutId = window.setTimeout(() => {
      queueReflowItemsToBoard()
    }, 200)

    window.addEventListener('resize', queueReflowItemsToBoard)
    window.addEventListener('orientationchange', queueReflowItemsToBoard)

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.clearTimeout(settleTimeoutId)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', queueReflowItemsToBoard)
      window.removeEventListener('orientationchange', queueReflowItemsToBoard)
    }
  }, [])

  useEffect(() => {
    const board = boardRef.current
    const boardWidth = board?.clientWidth || boardSizeRef.current?.width || 0
    const boardHeight = board?.clientHeight || boardSizeRef.current?.height || 0
    if (boardWidth <= 0 || boardHeight <= 0) return

    const previousLayout = notesLayoutSizeRef.current
    const layoutDrift = Boolean(
      previousLayout
      && (
        Math.abs(previousLayout.width - boardWidth) > 12
        || Math.abs(previousLayout.height - boardHeight) > 12
      )
    )

    if (notes.length > 0) {
      const limits = getLimitsForDimensions(boardWidth, boardHeight, NOTE_WIDTH, NOTE_HEIGHT)
      const previousLimits = previousLayout
        ? getLimitsForDimensions(previousLayout.width, previousLayout.height, NOTE_WIDTH, NOTE_HEIGHT)
        : null
      let hasNoteAdjustment = false
      const clampedNotes = notes.map((note, index) => {
        let nextX = note.x
        let nextY = note.y

        if (isNormalizedBoardCoord(note.x, note.y) || note.x > limits.maxX || note.y > limits.maxY) {
          const mapped = mapStoredPositionToBoard(
            note.x,
            note.y,
            index,
            boardWidth,
            boardHeight,
            NOTE_WIDTH,
            NOTE_HEIGHT
          )
          nextX = mapped.x
          nextY = mapped.y
        } else if (layoutDrift && previousLimits) {
          nextX = scaleAxisPosition(note.x, previousLimits.maxX, limits.maxX)
          nextY = scaleAxisPosition(note.y, previousLimits.maxY, limits.maxY)
        }

        nextX = clamp(Math.round(nextX), limits.minX, limits.maxX)
        nextY = clamp(Math.round(nextY), limits.minY, limits.maxY)
        if (nextX === note.x && nextY === note.y) return note
        hasNoteAdjustment = true
        return {
          ...note,
          x: nextX,
          y: nextY,
        }
      })

      if (hasNoteAdjustment) {
        setNotes(clampedNotes)
      }
    }

    if (decorations.length > 0) {
      let hasDecorationAdjustment = false
      const clampedDecorations = decorations.map((item, index) => {
        const limits = getLimitsForDimensions(boardWidth, boardHeight, item.size, item.size)
        const previousLimits = previousLayout
          ? getLimitsForDimensions(previousLayout.width, previousLayout.height, item.size, item.size)
          : null
        let nextX = item.x
        let nextY = item.y

        if (isNormalizedBoardCoord(item.x, item.y) || item.x > limits.maxX || item.y > limits.maxY) {
          const mapped = mapStoredPositionToBoard(
            item.x,
            item.y,
            index,
            boardWidth,
            boardHeight,
            item.size,
            item.size
          )
          nextX = mapped.x
          nextY = mapped.y
        } else if (layoutDrift && previousLimits) {
          nextX = scaleAxisPosition(item.x, previousLimits.maxX, limits.maxX)
          nextY = scaleAxisPosition(item.y, previousLimits.maxY, limits.maxY)
        }

        nextX = clamp(Math.round(nextX), limits.minX, limits.maxX)
        nextY = clamp(Math.round(nextY), limits.minY, limits.maxY)
        if (nextX === item.x && nextY === item.y) return item
        hasDecorationAdjustment = true
        return {
          ...item,
          x: nextX,
          y: nextY,
        }
      })

      if (hasDecorationAdjustment) {
        setDecorations(clampedDecorations)
      }
    }

    notesLayoutSizeRef.current = { width: boardWidth, height: boardHeight }
  }, [boardReady, decorations, notes])

  const getRandomPosition = (width: number, height: number) => {
    const board = boardRef.current
    const limits = getLimits(board, width, height)
    const minX = Math.max(limits.minX, 0)
    const minY = Math.max(limits.minY, 0)
    const maxX = Math.max(limits.maxX, minX)
    const maxY = Math.max(limits.maxY, minY)
    const boardW = board?.clientWidth || boardSizeRef.current?.width || NOTE_LAYOUT_REF.width
    const boardH = board?.clientHeight || boardSizeRef.current?.height || NOTE_LAYOUT_REF.height
    const occupiedCount = notes.length + pendingEntries.length
    // Spread across the full cork board — not just the current viewport corner.
    const insetX = Math.max(16, Math.round(boardW * 0.04))
    const insetY = Math.max(16, Math.round(boardH * 0.04))
    let rangeMinX = clamp(minX + insetX, minX, maxX)
    let rangeMinY = clamp(minY + insetY, minY, maxY)
    let rangeMaxX = clamp(maxX - insetX, minX, maxX)
    let rangeMaxY = clamp(maxY - insetY, minY, maxY)

    if (rangeMaxX <= rangeMinX || rangeMaxY <= rangeMinY) {
      rangeMinX = minX
      rangeMinY = minY
      rangeMaxX = maxX
      rangeMaxY = maxY
    }

    const minSeparation = Math.round(Math.min(NOTE_WIDTH, NOTE_HEIGHT) * 0.95)
    const occupied = [
      ...notes.map((note) => ({ x: note.x, y: note.y, w: NOTE_WIDTH, h: NOTE_HEIGHT })),
      ...pendingEntries.map((entry) => ({
        x: typeof entry.x === 'number' ? entry.x : 0,
        y: typeof entry.y === 'number' ? entry.y : 0,
        w: NOTE_WIDTH,
        h: NOTE_HEIGHT,
      })),
    ]

    let best = {
      x: randomBetween(rangeMinX, Math.max(rangeMinX, rangeMaxX)),
      y: randomBetween(rangeMinY, Math.max(rangeMinY, rangeMaxY)),
      score: -1,
    }

    for (let attempt = 0; attempt < 36; attempt += 1) {
      const candidate = {
        x: randomBetween(rangeMinX, Math.max(rangeMinX, rangeMaxX)),
        y: randomBetween(rangeMinY, Math.max(rangeMinY, rangeMaxY)),
      }
      let nearest = Number.POSITIVE_INFINITY
      for (const item of occupied) {
        const dx = (candidate.x + width * 0.5) - (item.x + item.w * 0.5)
        const dy = (candidate.y + height * 0.5) - (item.y + item.h * 0.5)
        nearest = Math.min(nearest, Math.hypot(dx, dy))
      }
      const score = Number.isFinite(nearest) ? nearest : minSeparation * 2
      if (score > best.score) {
        best = { ...candidate, score }
      }
      if (score >= minSeparation) {
        return { x: best.x, y: best.y }
      }
    }

    // Deterministic spread if random keeps colliding.
    const fallback = getFallbackNotePosition(occupiedCount, boardW, boardH)
    const jitterX = randomBetween(-24, 24)
    const jitterY = randomBetween(-18, 18)
    return {
      x: clamp(fallback.x + jitterX, minX, maxX),
      y: clamp(fallback.y + jitterY, minY, maxY),
    }
  }

  const updateNotePosition = (id: number, x: number, y: number) => {
    const limits = getLimits(boardRef.current, NOTE_WIDTH, NOTE_HEIGHT)
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== id) return note
        return {
          ...note,
          x: clamp(Math.round(x), limits.minX, limits.maxX),
          y: clamp(Math.round(y), limits.minY, limits.maxY),
        }
      })
    )
    setHasMutatedEntries(true)
  }

  const updateDecorationPosition = (id: number, x: number, y: number, size: number) => {
    const limits = getLimits(boardRef.current, size, size)
    setDecorations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          x: clamp(Math.round(x), limits.minX, limits.maxX),
          y: clamp(Math.round(y), limits.minY, limits.maxY),
        }
      })
    )
    setHasMutatedDecorations(true)
  }

  const removeDecoration = (id: number) => {
    setDecorations((prev) => prev.filter((item) => item.id !== id))
    setHasMutatedDecorations(true)
  }

  const removeNote = (id: number) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
    setHasMutatedEntries(true)
    setSelectedNoteId((current) => (current === id ? null : current))
  }

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.key !== 'Backspace' && event.key !== 'Delete') || selectedNoteId === null) {
        return
      }

      const target = event.target as HTMLElement | null
      if (
        target &&
        (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )
      ) {
        return
      }

      event.preventDefault()
      setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId))
      setHasMutatedEntries(true)
      setSelectedNoteId(null)
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [selectedNoteId])

  const updateBoardZoom = (nextZoom: number) => {
    const clamped = clamp(Number(nextZoom.toFixed(2)), MIN_BOARD_ZOOM, MAX_BOARD_ZOOM)
    setBoardZoom(clamped)
  }

  const handleBoardWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!enableBoardZoom) return

    const viewport = boardViewportRef.current
    if (!viewport) return

    const direction = event.deltaY > 0 ? -1 : 1
    const targetZoom = boardZoom + (direction * BOARD_ZOOM_STEP)
    const nextZoom = clamp(Number(targetZoom.toFixed(2)), MIN_BOARD_ZOOM, MAX_BOARD_ZOOM)
    if (nextZoom === boardZoom) {
      return
    }

    event.preventDefault()

    const viewportRect = viewport.getBoundingClientRect()
    const pointerViewportX = event.clientX - viewportRect.left
    const pointerViewportY = event.clientY - viewportRect.top
    const boardPointerX = viewport.scrollLeft + pointerViewportX
    const boardPointerY = viewport.scrollTop + pointerViewportY
    const ratio = nextZoom / boardZoom

    updateBoardZoom(nextZoom)

    requestAnimationFrame(() => {
      viewport.scrollLeft = (boardPointerX * ratio) - pointerViewportX
      viewport.scrollTop = (boardPointerY * ratio) - pointerViewportY
    })
  }

  const addDecoration = (kind: DecorationKind, value: string, size: number) => {
    const placement = getRandomPosition(size, size)
    const next: BoardDecoration = {
      id: Date.now(),
      kind,
      value,
      size,
      rotation: ((Date.now() % 7) - 3) * 1.4,
      approved: kind === 'emoji',
      ...placement,
    }

    setDecorations((prev) => [...prev, next])
    setHasMutatedDecorations(true)
  }

  const addEmoji = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    addDecoration('emoji', trimmed, 84)
    setCustomEmoji('')
    setIsEmojiPickerOpen(false)
  }

  const addPhotoDecoration = (): boolean => {
    const normalized = normalizePhotoInput(photoUrl)
    if (!normalized || !isLikelyImageUrl(normalized)) {
      setPhotoFeedback('Use a full image / GIF URL or upload a file.')
      return false
    }

    const value = normalized.startsWith('data:image/') ? normalized : encodeURI(normalized)
    addDecoration('photo', value, compact ? 112 : 126)
    setPhotoFeedback('Sent for approval.')
    setPhotoUrl('')
    return true
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoFeedback('Please choose an image or GIF file.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result.startsWith('data:image/')) {
        setPhotoFeedback('Could not read that image.')
        return
      }

      addDecoration('photo', result, compact ? 112 : 126)
      setPhotoFeedback('Sent for approval.')
    }

    reader.onerror = () => {
      setPhotoFeedback('Could not read that image.')
    }

    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      setMessageError('Write a note before pinning it.')
      return
    }

    if (messageError) {
      setMessageError('')
    }

    const now = new Date()
    const placement = getRandomPosition(NOTE_WIDTH, NOTE_HEIGHT)

    const newEntry: GuestbookEntry = {
      id: Date.now(),
      name: 'Anonymous',
      message: trimmedMessage,
      date: toDisplayDate({ createdAt: now.toISOString() }),
      approved: false,
      createdAt: now.toISOString(),
      color: noteColor,
      ...placement,
    }

    setPendingEntries((prev) => [...prev, newEntry])
    setHasMutatedEntries(true)
    setSubmissionFeedback('Sending…')
    setMessage('')

    window.setTimeout(() => {
      void saveGuestbookRemote(
        buildPersistableGuestbookPayload([...entriesPayload, newEntry], decorations, boardRef.current)
      ).then((result) => {
        if (result.ok && result.durable) {
          setSubmissionFeedback('Sent for approval.')
        } else {
          setSubmissionFeedback(result.hint || 'Could not save note on the server.')
        }
        window.setTimeout(() => setSubmissionFeedback(''), 4200)
      })
    }, 0)
  }

  return (
    <div className={`guestbook-cork-shell ${compact ? 'guestbook-cork-shell-compact' : ''} ${fullHeight ? 'guestbook-cork-shell-full' : ''}`}>
      <div className="guestbook-cork-meta">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted">Guest board</span>
      </div>

      <div className="guestboard-tools">
        <div className="guestboard-emoji-picker-wrap">
          <button
            type="button"
            className="guestboard-tool-btn"
            onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
          >
            + Emoji
          </button>

          {isEmojiPickerOpen && (
            <div className="guestboard-emoji-picker-popover">
              <div className="guestboard-emoji-picker-grid">
                {EMOJI_PICKER.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="guestboard-emoji-picker-item"
                    onClick={() => addEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="guestboard-emoji-custom">
                <input
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    addEmoji(customEmoji)
                  }}
                  className="guestboard-emoji-custom-input"
                  placeholder="paste any emoji"
                  aria-label="Custom emoji"
                />
                <button
                  type="button"
                  className="guestboard-tool-btn"
                  onClick={() => addEmoji(customEmoji)}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="guestboard-photo-tools">
          <button
            ref={photoUrlToggleRef}
            type="button"
            className="guestboard-tool-btn"
            onClick={() => {
              setIsUrlPopoverOpen((prev) => !prev)
              if (photoFeedback) setPhotoFeedback('')
            }}
          >
            + Image / GIF URL
          </button>
          <button type="button" className="guestboard-tool-btn" onClick={() => fileInputRef.current?.click()}>
            + Image / GIF
          </button>

          {isUrlPopoverOpen && (
            <div
              ref={photoUrlPopoverRef}
              className="guestboard-url-popover"
              role="dialog"
              aria-label="Add image or GIF URL"
              onMouseLeave={() => setIsUrlPopoverOpen(false)}
            >
              <input
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value)
                  if (photoFeedback) setPhotoFeedback('')
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const didAdd = addPhotoDecoration()
                  if (didAdd) setIsUrlPopoverOpen(false)
                }}
                className="guestboard-photo-input"
                placeholder="https://… (giphy/tenor gif links ok)"
                aria-label="Image or GIF URL"
              />
              <div className="guestboard-url-actions">
                <button
                  type="button"
                  className="guestboard-tool-btn"
                  onClick={() => setIsUrlPopoverOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="guestboard-tool-btn"
                  onClick={() => {
                    const didAdd = addPhotoDecoration()
                    if (didAdd) setIsUrlPopoverOpen(false)
                  }}
                >
                  Add image
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.gif,image/gif"
            className="sr-only"
            onChange={handleFileUpload}
          />
        </div>

        {showZoomTools && (
          <div className="guestboard-zoom-tools">
            <button
              type="button"
              className="guestboard-tool-btn"
              onClick={() => updateBoardZoom(boardZoom - BOARD_ZOOM_STEP)}
              aria-label="Zoom out board"
            >
              -
            </button>
            <button
              type="button"
              className="guestboard-tool-btn guestboard-tool-btn-zoom-label"
              onClick={() => updateBoardZoom(1)}
              aria-label="Reset board zoom"
              title="Reset zoom"
            >
              {zoomLabel}
            </button>
            <button
              type="button"
              className="guestboard-tool-btn"
              onClick={() => updateBoardZoom(boardZoom + BOARD_ZOOM_STEP)}
              aria-label="Zoom in board"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="guestbook-delete-hint">
        Click a note then press Backspace/Delete.{enableBoardZoom ? ' Scroll to zoom.' : ''}
      </div>
      {photoFeedback && <div className="guestbook-photo-feedback">{photoFeedback}</div>}
      {submissionFeedback && <div className="guestbook-photo-feedback guestbook-submit-feedback">{submissionFeedback}</div>}

      <div className="guestbook-cork-board-wrap">
        <div
          ref={boardViewportRef}
          className="guestbook-cork-board guestboard-modern-board guestboard-zoom-viewport"
          onWheel={handleBoardWheel}
          onMouseDown={(event) => {
            const target = event.target as HTMLElement
            if (!target.closest('.guestbook-sticky-note')) {
              setSelectedNoteId(null)
            }
          }}
        >
          <div
            className="guestboard-zoom-scroller"
            style={{
              width: `${boardCanvasWidthPercent}%`,
              height: `${boardCanvasHeightPercent}%`,
            }}
          >
            <div
              ref={boardRef}
              className="guestboard-zoom-world"
              style={{
                width: `${inverseBoardZoom * 100}%`,
                height: `${inverseBoardZoom * 100}%`,
                minWidth: '100%',
                minHeight: '100%',
                transform: `scale(${boardZoom})`,
                transformOrigin: 'top left',
                opacity: boardReady ? 1 : 0,
                transition: 'opacity 0.18s ease',
              }}
            >
              {decorations.map((item, index) => {
              const itemId = `decor-${item.id}`

              return (
                <Rnd
                  key={itemId}
                  bounds="parent"
                  enableResizing={false}
                  dragHandleClassName="guestboard-item-drag-handle"
                  size={{ width: item.size, height: item.size }}
                  position={{ x: item.x, y: item.y }}
                  scale={boardZoom}
                  onDragStart={() => setActiveItemId(itemId)}
                  onDragStop={(_e, data) => {
                    updateDecorationPosition(item.id, data.x, data.y, item.size)
                    setActiveItemId(null)
                  }}
                  style={{ zIndex: activeItemId === itemId ? 220 : 160 + index }}
                >
                  <div
                    className={`guestboard-decoration guestboard-decoration-${item.kind} guestboard-item-drag-handle ${item.approved === false ? 'guestboard-decoration-pending' : ''}`}
                    style={{
                      '--guestboard-rotation': `${item.rotation}deg`,
                    } as CSSProperties}
                  >
                    {item.kind === 'photo' ? (
                      <img
                        src={item.value}
                        alt=""
                        className="guestboard-decoration-photo"
                        draggable={false}
                      />
                    ) : (
                      <span className="guestboard-decoration-symbol">{item.value}</span>
                    )}
                    {item.approved === false && (
                      <span className="guestboard-decoration-pending-badge" aria-hidden="true">Pending</span>
                    )}
                  </div>
                </Rnd>
              )
            })}

              {notes.map((note, index) => {
              const itemId = `note-${note.id}`

              return (
                <Rnd
                  key={itemId}
                  bounds="parent"
                  enableResizing={false}
                  dragHandleClassName="guestboard-item-drag-handle"
                  size={{ width: NOTE_WIDTH, height: NOTE_HEIGHT }}
                  position={{ x: note.x, y: note.y }}
                  scale={boardZoom}
                  onDragStart={() => {
                    setActiveItemId(itemId)
                    setSelectedNoteId(note.id)
                    noteDragStartRef.current[itemId] = { x: note.x, y: note.y }
                  }}
                  onDragStop={(_e, data) => {
                    const dragStart = noteDragStartRef.current[itemId]
                    const movedDistance = dragStart
                      ? Math.hypot(data.x - dragStart.x, data.y - dragStart.y)
                      : Number.POSITIVE_INFINITY

                    if (movedDistance > 2) {
                      updateNotePosition(note.id, data.x, data.y)
                    }

                    setActiveItemId(null)
                    delete noteDragStartRef.current[itemId]
                  }}
                  style={{ zIndex: activeItemId === itemId ? 120 : 60 + index }}
                >
                  <article
                    className={`guestbook-sticky-note guestboard-item-drag-handle ${activeItemId === itemId ? 'guestbook-sticky-note-dragging' : ''} ${selectedNoteId === note.id ? 'guestbook-sticky-note-selected' : ''}`}
                    style={{
                      '--note-paper': note.color,
                    } as CSSProperties}
                    onMouseDown={() => setSelectedNoteId(note.id)}
                  >
                    <div className="guestbook-sticky-date">{note.date}</div>
                    <p className="guestbook-sticky-text">{note.message}</p>
                  </article>
                </Rnd>
              )
              })}
            </div>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="guestbook-cork-form" noValidate>
        <div className="guestbook-compose-row">
          <GuestbookComposeControls layout="sidebar" className="guestbook-compose-with-field" />
          <div className={`guestbook-note-input-wrap ${messageError ? 'is-invalid' : ''}`}>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (messageError && e.target.value.trim()) {
                  setMessageError('')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              rows={compact ? 2 : 3}
              className="guestbook-note-input"
              placeholder="Leave an anonymous note..."
              maxLength={320}
              aria-invalid={messageError ? 'true' : 'false'}
            />
            {messageError && <div className="guestbook-note-error">{messageError}</div>}
            <span className="guestbook-note-counter">{message.length}/320</span>
          </div>
        </div>
      </form>
    </div>
  )
}
