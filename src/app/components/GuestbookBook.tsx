'use client'

import { type ChangeEvent, type CSSProperties, type FormEvent, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'

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
const STICKY_COLORS = ['#f7f8fb', '#eef3ff', '#eef8f1', '#f5f0ff', '#fff6f0']
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

const getFallbackNotePosition = (index: number): { x: number; y: number } => {
  const column = index % 4
  const row = Math.floor(index / 4)
  const laneOffset = row % 2 === 0 ? 0 : 28
  const waveX = Math.round(Math.sin((index + 1) * 1.27) * 22)
  const waveY = Math.round(Math.cos((index + 1) * 1.41) * 18)

  return {
    x: Math.max(0, 22 + (column * 205) + laneOffset + waveX),
    y: Math.max(0, 18 + (row * 165) + waveY),
  }
}

const normalizeNotesFromSource = (value: unknown): GuestbookNote[] => {
  if (!Array.isArray(value)) return []

  const normalized = value
    .filter((entry: Partial<GuestbookEntry>) => entry.approved !== false)
    .map((entry: Partial<GuestbookEntry>, index: number) => {
      const fallback = getFallbackNotePosition(index)

      return {
        id: typeof entry.id === 'number' ? entry.id : Date.now() + index,
        name: 'Anonymous',
        message: (entry.message || '').trim() || 'A quiet note left on the board.',
        date: toDisplayDate(entry),
        approved: true,
        createdAt: entry.createdAt,
        x: typeof entry.x === 'number' ? entry.x : fallback.x,
        y: typeof entry.y === 'number' ? entry.y : fallback.y,
        color: typeof entry.color === 'string' ? entry.color : STICKY_COLORS[index % STICKY_COLORS.length],
      }
    })

  return normalized
}

const normalizePendingEntriesFromSource = (value: unknown): GuestbookEntry[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry: Partial<GuestbookEntry>) => entry.approved === false)
    .map((entry: Partial<GuestbookEntry>, index: number) => {
      const fallback = getFallbackNotePosition(index)

      return {
        id: typeof entry.id === 'number' ? entry.id : Date.now() + index,
        name: 'Anonymous',
        message: (entry.message || '').trim() || 'Pending note.',
        date: toDisplayDate(entry),
        approved: false,
        createdAt: entry.createdAt,
        x: typeof entry.x === 'number' ? entry.x : fallback.x,
        y: typeof entry.y === 'number' ? entry.y : fallback.y,
        color: typeof entry.color === 'string' ? entry.color : STICKY_COLORS[index % STICKY_COLORS.length],
      }
    })
}

const normalizeDecorationsFromSource = (value: unknown): BoardDecoration[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((item: Partial<BoardDecoration>) => typeof item.value === 'string' && item.value.trim())
    .map((item: Partial<BoardDecoration>, index: number): BoardDecoration => ({
      id: typeof item.id === 'number' ? item.id : Date.now() + index,
      kind: item.kind === 'photo' ? 'photo' : 'emoji',
      value: (item.value || '').trim(),
      x: typeof item.x === 'number' ? item.x : 52 + (index % 4) * 104,
      y: typeof item.y === 'number' ? item.y : 42 + Math.floor(index / 4) * 98,
      size: typeof item.size === 'number' ? clamp(item.size, 72, 152) : 90,
      rotation: typeof item.rotation === 'number' ? clamp(item.rotation, -10, 10) : ((index % 5) - 2) * 1.8,
    }))
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

    return response.ok
  } catch {
    return false
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
  const trashTargetRef = useRef<HTMLButtonElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoUrlToggleRef = useRef<HTMLButtonElement | null>(null)
  const photoUrlPopoverRef = useRef<HTMLDivElement | null>(null)
  const remoteSyncTimerRef = useRef<number | null>(null)
  const boardSizeRef = useRef<{ width: number; height: number } | null>(null)
  const lastPointerRef = useRef<Record<string, { offsetX: number; offsetY: number }>>({})
  const noteDragStartRef = useRef<Record<string, { x: number; y: number }>>({})
  const [notes, setNotes] = useState<GuestbookNote[]>([])
  const [pendingEntries, setPendingEntries] = useState<GuestbookEntry[]>([])
  const [decorations, setDecorations] = useState<BoardDecoration[]>([])
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isUrlPopoverOpen, setIsUrlPopoverOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFeedback, setPhotoFeedback] = useState('')
  const [submissionFeedback, setSubmissionFeedback] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [isTrashAnimating, setIsTrashAnimating] = useState(false)
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
    let isCancelled = false

    const loadBoard = async () => {
      const applyLocalFallback = () => {
        try {
          const localEntries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || 'null')
          const localNotes = normalizeNotesFromSource(localEntries)
          const localPendingEntries = normalizePendingEntriesFromSource(localEntries)
          const localDecorations = normalizeDecorationsFromSource(
            JSON.parse(localStorage.getItem(DECORATIONS_KEY) || 'null')
          )
          if (isCancelled) return
          setNotes(localNotes)
          setPendingEntries(localPendingEntries)
          setDecorations(localDecorations)
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

        const remoteNotes = normalizeNotesFromSource((payload as { entries?: unknown[] }).entries)
        const remotePendingEntries = normalizePendingEntriesFromSource((payload as { entries?: unknown[] }).entries)
        const remoteDecorations = normalizeDecorationsFromSource((payload as { decorations?: unknown[] }).decorations)

        setNotes(remoteNotes)
        setPendingEntries(remotePendingEntries)
        setDecorations(remoteDecorations)

        const remotePayload = [
          ...remoteNotes.map((note) => ({ ...note, name: 'Anonymous', approved: true })),
          ...remotePendingEntries.map((entry) => ({ ...entry, name: 'Anonymous', approved: false })),
        ]
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(remotePayload))
        localStorage.setItem(DECORATIONS_KEY, JSON.stringify(remoteDecorations))
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

    localStorage.setItem(
      ENTRIES_KEY,
      JSON.stringify(entriesPayload)
    )
  }, [entriesPayload, hasMutatedEntries])

  useEffect(() => {
    if (!hasMutatedDecorations) return

    localStorage.setItem(DECORATIONS_KEY, JSON.stringify(decorations))
  }, [decorations, hasMutatedDecorations])

  useEffect(() => {
    if (!hasMutatedEntries && !hasMutatedDecorations) return

    if (remoteSyncTimerRef.current) {
      window.clearTimeout(remoteSyncTimerRef.current)
    }

    remoteSyncTimerRef.current = window.setTimeout(() => {
      void saveGuestbookRemote({
        entries: entriesPayload,
        decorations,
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
      const shouldScalePosition = Boolean(
        previousBoardSize &&
        (
          Math.abs(previousBoardSize.width - currentBoardSize.width) > 1 ||
          Math.abs(previousBoardSize.height - currentBoardSize.height) > 1
        )
      )

      let hasNoteAdjustment = false
      let hasDecorationAdjustment = false

      setNotes((prev) => {
        if (prev.length === 0) return prev

        const nextLimits = getLimitsForDimensions(currentBoardSize.width, currentBoardSize.height, NOTE_WIDTH, NOTE_HEIGHT)
        const previousLimits = previousBoardSize
          ? getLimitsForDimensions(previousBoardSize.width, previousBoardSize.height, NOTE_WIDTH, NOTE_HEIGHT)
          : null

        const nextNotes = prev.map((note) => {
          const scaledX = (shouldScalePosition && previousLimits)
            ? scaleAxisPosition(note.x, previousLimits.maxX, nextLimits.maxX)
            : note.x
          const scaledY = (shouldScalePosition && previousLimits)
            ? scaleAxisPosition(note.y, previousLimits.maxY, nextLimits.maxY)
            : note.y
          const nextX = clamp(Math.round(scaledX), nextLimits.minX, nextLimits.maxX)
          const nextY = clamp(Math.round(scaledY), nextLimits.minY, nextLimits.maxY)
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
            : null
          const scaledX = (shouldScalePosition && previousLimits)
            ? scaleAxisPosition(item.x, previousLimits.maxX, nextLimits.maxX)
            : item.x
          const scaledY = (shouldScalePosition && previousLimits)
            ? scaleAxisPosition(item.y, previousLimits.maxY, nextLimits.maxY)
            : item.y
          const nextX = clamp(Math.round(scaledX), nextLimits.minX, nextLimits.maxX)
          const nextY = clamp(Math.round(scaledY), nextLimits.minY, nextLimits.maxY)
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

      if (hasNoteAdjustment) {
        setHasMutatedEntries(true)
      }

      if (hasDecorationAdjustment) {
        setHasMutatedDecorations(true)
      }

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
    if (!board) return

    if (notes.length > 0) {
      const limits = getLimits(board, NOTE_WIDTH, NOTE_HEIGHT)
      let hasNoteAdjustment = false
      const clampedNotes = notes.map((note) => {
        const nextX = clamp(Math.round(note.x), limits.minX, limits.maxX)
        const nextY = clamp(Math.round(note.y), limits.minY, limits.maxY)
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
        setHasMutatedEntries(true)
      }
    }

    if (decorations.length > 0) {
      let hasDecorationAdjustment = false
      const clampedDecorations = decorations.map((item) => {
        const limits = getLimits(board, item.size, item.size)
        const nextX = clamp(Math.round(item.x), limits.minX, limits.maxX)
        const nextY = clamp(Math.round(item.y), limits.minY, limits.maxY)
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
        setHasMutatedDecorations(true)
      }
    }
  }, [decorations, notes])

  const getPointerFromEvent = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }

    if ('changedTouches' in event && event.changedTouches.length > 0) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
    }

    if ('clientX' in event) {
      return { x: event.clientX, y: event.clientY }
    }

    return null
  }

  const trackLastPointer = (
    itemId: string,
    event: MouseEvent | TouchEvent,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const pointer = getPointerFromEvent(event)
    const board = boardRef.current
    if (!pointer || !board) return

    const boardRect = board.getBoundingClientRect()
    const pointX = (pointer.x - boardRect.left) / boardZoom
    const pointY = (pointer.y - boardRect.top) / boardZoom

    lastPointerRef.current[itemId] = {
      offsetX: clamp(pointX - x, 0, width),
      offsetY: clamp(pointY - y, 0, height),
    }
  }

  const getTrashDropVector = (itemId: string, x: number, y: number, width: number, height: number) => {
    const board = boardRef.current
    const trashTarget = trashTargetRef.current
    if (!board || !trashTarget) {
      return { shouldTrash: false, vector: { x: 0, y: 0 } }
    }

    const boardRect = board.getBoundingClientRect()
    const trashRect = trashTarget.getBoundingClientRect()
    const pointerOffset = lastPointerRef.current[itemId]
    const pointX = pointerOffset ? x + pointerOffset.offsetX : x + width / 2
    const pointY = pointerOffset ? y + pointerOffset.offsetY : y + height / 2
    const dropCenterX = boardRect.left + (pointX * boardZoom)
    const dropCenterY = boardRect.top + (pointY * boardZoom)

    const hitPadding = 14
    const isInsideTrash = (
      dropCenterX >= trashRect.left - hitPadding &&
      dropCenterX <= trashRect.right + hitPadding &&
      dropCenterY >= trashRect.top - hitPadding &&
      dropCenterY <= trashRect.bottom + hitPadding
    )

    if (!isInsideTrash) {
      return { shouldTrash: false, vector: { x: 0, y: 0 } }
    }

    const trashCenterX = ((trashRect.left - boardRect.left) / boardZoom) + (trashRect.width / 2) / boardZoom
    const trashCenterY = ((trashRect.top - boardRect.top) / boardZoom) + (trashRect.height / 2) / boardZoom

    return {
      shouldTrash: true,
      vector: {
        x: Math.round(trashCenterX - pointX),
        y: Math.round(trashCenterY - pointY),
      },
    }
  }

  const startTrashAnimation = (onDone: () => void) => {
    setIsTrashAnimating(true)
    onDone()
    window.setTimeout(() => {
      setIsTrashAnimating(false)
    }, 280)
  }

  const getRandomPosition = (width: number, height: number) => {
    const board = boardRef.current
    const viewport = boardViewportRef.current
    const limits = getLimits(board, width, height)
    const minX = Math.max(limits.minX, 0)
    const minY = Math.max(limits.minY, 0)
    const maxX = Math.max(limits.maxX, minX)
    const maxY = Math.max(limits.maxY, minY)

    if (board && viewport) {
      const visibleWidth = Math.max(viewport.clientWidth / boardZoom, width)
      const visibleHeight = Math.max(viewport.clientHeight / boardZoom, height)
      const viewportStartX = viewport.scrollLeft / boardZoom
      const viewportStartY = viewport.scrollTop / boardZoom
      const insetX = Math.max(12, Math.min(40, visibleWidth * 0.08))
      const insetY = Math.max(10, Math.min(30, visibleHeight * 0.08))
      const visibleMinX = clamp(Math.round(viewportStartX + insetX), minX, maxX)
      const visibleMinY = clamp(Math.round(viewportStartY + insetY), minY, maxY)
      const visibleMaxX = clamp(Math.round(viewportStartX + visibleWidth - width - insetX), minX, maxX)
      const visibleMaxY = clamp(Math.round(viewportStartY + visibleHeight - height - insetY), minY, maxY)

      return {
        x: randomBetween(visibleMinX, Math.max(visibleMinX, visibleMaxX)),
        y: randomBetween(visibleMinY, Math.max(visibleMinY, visibleMaxY)),
      }
    }

    return {
      x: randomBetween(minX, maxX),
      y: randomBetween(minY, maxY),
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
      ...placement,
    }

    setDecorations((prev) => [...prev, next])
    setHasMutatedDecorations(true)
  }

  const addEmoji = (value: string) => {
    addDecoration('emoji', value, 84)
    setIsEmojiPickerOpen(false)
  }

  const addPhotoDecoration = (): boolean => {
    const normalized = normalizePhotoInput(photoUrl)
    if (!normalized || !isLikelyImageUrl(normalized)) {
      setPhotoFeedback('Use a full image URL or upload a file.')
      return false
    }

    const value = normalized.startsWith('data:image/') ? normalized : encodeURI(normalized)
    addDecoration('photo', value, compact ? 112 : 126)
    setPhotoFeedback('Photo added.')
    setPhotoUrl('')
    return true
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoFeedback('Please choose an image file.')
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
      setPhotoFeedback('Photo added.')
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
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      ...placement,
    }

    setPendingEntries((prev) => [...prev, newEntry])
    setHasMutatedEntries(true)
    setSubmissionFeedback('Sent for approval.')
    setMessage('')

    window.setTimeout(() => setSubmissionFeedback(''), 2800)
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
            + Image URL
          </button>
          <button type="button" className="guestboard-tool-btn" onClick={() => fileInputRef.current?.click()}>
            + Image File
          </button>

          {isUrlPopoverOpen && (
            <div
              ref={photoUrlPopoverRef}
              className="guestboard-url-popover"
              role="dialog"
              aria-label="Add image URL"
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
                placeholder="https://..."
                aria-label="Photo URL"
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
            accept="image/*"
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
        Drag to 🗑️ to delete. Click a note then press Backspace/Delete.{enableBoardZoom ? ' Scroll to zoom.' : ''}
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
                  onDrag={(event, data) => {
                    trackLastPointer(itemId, event as MouseEvent | TouchEvent, data.x, data.y, item.size, item.size)
                  }}
                  onDragStop={(_e, data) => {
                    const trashResult = getTrashDropVector(itemId, data.x, data.y, item.size, item.size)
                    if (trashResult.shouldTrash) {
                      setActiveItemId(null)
                      startTrashAnimation(() => removeDecoration(item.id))
                      delete lastPointerRef.current[itemId]
                      return
                    }

                    updateDecorationPosition(item.id, data.x, data.y, item.size)
                    setActiveItemId(null)
                    delete lastPointerRef.current[itemId]
                  }}
                  style={{ zIndex: activeItemId === itemId ? 220 : 160 + index }}
                >
                  <div
                    className={`guestboard-decoration guestboard-decoration-${item.kind} guestboard-item-drag-handle`}
                    style={{
                      '--guestboard-rotation': `${item.rotation}deg`,
                    } as CSSProperties}
                  >
                    {item.kind === 'photo' ? (
                      <div className="guestboard-decoration-photo" style={{ backgroundImage: `url(${item.value})` }}></div>
                    ) : (
                      <span className="guestboard-decoration-symbol">{item.value}</span>
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
                  onDrag={(event, data) => {
                    trackLastPointer(itemId, event as MouseEvent | TouchEvent, data.x, data.y, NOTE_WIDTH, NOTE_HEIGHT)
                  }}
                  onDragStop={(_e, data) => {
                    const trashResult = getTrashDropVector(itemId, data.x, data.y, NOTE_WIDTH, NOTE_HEIGHT)
                    if (trashResult.shouldTrash) {
                      setActiveItemId(null)
                      startTrashAnimation(() => removeNote(note.id))
                      delete lastPointerRef.current[itemId]
                      return
                    }

                    const dragStart = noteDragStartRef.current[itemId]
                    const movedDistance = dragStart
                      ? Math.hypot(data.x - dragStart.x, data.y - dragStart.y)
                      : Number.POSITIVE_INFINITY

                    if (movedDistance > 2) {
                      updateNotePosition(note.id, data.x, data.y)
                    }

                    setActiveItemId(null)
                    delete lastPointerRef.current[itemId]
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

        <button
          ref={trashTargetRef}
          type="button"
          className={`guestbook-trash-target ${activeItemId ? 'guestbook-trash-target-armed' : ''} ${isTrashAnimating ? 'guestbook-trash-target-active' : ''}`}
          aria-label="Trash target"
          title="Drop here to delete"
          tabIndex={-1}
        >
          🗑️
        </button>
      </div>

      <form onSubmit={handleSubmit} className="guestbook-cork-form" noValidate>
        <div className="guestbook-note-input-wrap">
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
            className={`guestbook-note-input ${messageError ? 'guestbook-note-input-invalid' : ''}`}
            placeholder="Leave an anonymous note..."
            maxLength={320}
            aria-invalid={messageError ? 'true' : 'false'}
          />
          {messageError && <div className="guestbook-note-error">{messageError}</div>}
          <span className="guestbook-note-counter">{message.length}/320</span>
          <button
            type="submit"
            className="guestbook-pin-button guestbook-pin-button-inside"
            aria-label="Send note"
            title="Send note"
          >
            📌
          </button>
        </div>
      </form>
    </div>
  )
}
