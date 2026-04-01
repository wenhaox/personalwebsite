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
}

const NOTE_WIDTH = 210
const NOTE_HEIGHT = 170
const OFFSCREEN_ALLOWANCE = 48
const MIN_BOARD_ZOOM = 0.8
const MAX_BOARD_ZOOM = 1.9
const BOARD_ZOOM_STEP = 0.1
const STICKY_COLORS = ['#fff48b', '#d8ecff', '#d7f8d9', '#f4dcff', '#ffe2c4']
const DECORATIONS_KEY = 'guestboardDecorations'
const EMOJI_PICKER = ['✨', '🌿', '🫶', '📷', '☕', '🌤️', '🎵', '🧠', '🪩', '💫', '🌼', '🍀']

const SAMPLE_NOTES: GuestbookNote[] = [
  {
    id: 91001,
    name: 'Anonymous',
    message: 'Love the visual direction here. Feels calm and intentional.',
    date: 'Mar 24, 2026',
    approved: true,
    createdAt: '2026-03-24T15:10:00.000Z',
    x: 26,
    y: 22,
    color: '#fff9d7',
  },
  {
    id: 91002,
    name: 'Anonymous',
    message: 'The photo board interaction is fun. Drag plus reorder feels natural.',
    date: 'Mar 26, 2026',
    approved: true,
    createdAt: '2026-03-26T11:25:00.000Z',
    x: 254,
    y: 44,
    color: '#e7f4ff',
  },
  {
    id: 91003,
    name: 'Anonymous',
    message: 'Really liked reading your notes and seeing the updates evolve.',
    date: 'Mar 29, 2026',
    approved: true,
    createdAt: '2026-03-29T09:40:00.000Z',
    x: 486,
    y: 30,
    color: '#e9fbe8',
  },
]

const clamp = (value: number, min: number, max: number): number => (
  Math.min(Math.max(value, min), max)
)

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

const getLimits = (board: HTMLDivElement | null, width: number, height: number) => {
  if (!board) {
    return {
      minX: -OFFSCREEN_ALLOWANCE,
      maxX: 560 + OFFSCREEN_ALLOWANCE,
      minY: -OFFSCREEN_ALLOWANCE,
      maxY: 320 + OFFSCREEN_ALLOWANCE,
    }
  }

  return {
    minX: -OFFSCREEN_ALLOWANCE,
    maxX: Math.max(board.clientWidth - width + OFFSCREEN_ALLOWANCE, -OFFSCREEN_ALLOWANCE),
    minY: -OFFSCREEN_ALLOWANCE,
    maxY: Math.max(board.clientHeight - height + OFFSCREEN_ALLOWANCE, -OFFSCREEN_ALLOWANCE),
  }
}

const isLikelyImageUrl = (value: string): boolean => (
  /^https?:\/\//i.test(value) || /^data:image\//i.test(value)
)

export default function GuestbookBook({ compact = false, fullHeight = false }: GuestbookBookProps) {
  const boardViewportRef = useRef<HTMLDivElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const trashTargetRef = useRef<HTMLButtonElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastPointerRef = useRef<Record<string, { offsetX: number; offsetY: number }>>({})
  const noteDragStartRef = useRef<Record<string, { x: number; y: number }>>({})
  const [notes, setNotes] = useState<GuestbookNote[]>([])
  const [decorations, setDecorations] = useState<BoardDecoration[]>([])
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFeedback, setPhotoFeedback] = useState('')
  const [pinningId, setPinningId] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [isTrashAnimating, setIsTrashAnimating] = useState(false)
  const [boardZoom, setBoardZoom] = useState(1)
  const [hasMutatedNotes, setHasMutatedNotes] = useState(false)
  const [hasMutatedDecorations, setHasMutatedDecorations] = useState(false)

  const zoomLabel = useMemo(() => `${Math.round(boardZoom * 100)}%`, [boardZoom])
  const inverseBoardZoom = useMemo(() => 1 / boardZoom, [boardZoom])

  useEffect(() => {
    const stored = localStorage.getItem('guestbookEntries')
    if (!stored) {
      setNotes(SAMPLE_NOTES)
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        setNotes(SAMPLE_NOTES)
        return
      }

      const normalized = parsed
        .filter((entry: Partial<GuestbookEntry>) => entry.approved !== false)
        .map((entry: Partial<GuestbookEntry>, index: number) => ({
          id: typeof entry.id === 'number' ? entry.id : Date.now() + index,
          name: 'Anonymous',
          message: (entry.message || '').trim() || 'A quiet note left on the board.',
          date: toDisplayDate(entry),
          approved: true,
          createdAt: entry.createdAt,
          x: typeof entry.x === 'number' ? entry.x : 26 + (index % 3) * 228,
          y: typeof entry.y === 'number' ? entry.y : 22 + Math.floor(index / 3) * 186,
          color: typeof entry.color === 'string' ? entry.color : STICKY_COLORS[index % STICKY_COLORS.length],
        }))

      setNotes(normalized.length > 0 ? normalized : SAMPLE_NOTES)
    } catch {
      setNotes(SAMPLE_NOTES)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(DECORATIONS_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return

      const normalized = parsed
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

      setDecorations(normalized)
    } catch {
      setDecorations([])
    }
  }, [])

  useEffect(() => {
    if (!hasMutatedNotes) return

    localStorage.setItem(
      'guestbookEntries',
      JSON.stringify(
        notes.map((note) => ({
          ...note,
          name: 'Anonymous',
          approved: true,
        }))
      )
    )
  }, [hasMutatedNotes, notes])

  useEffect(() => {
    if (!hasMutatedDecorations) return

    localStorage.setItem(DECORATIONS_KEY, JSON.stringify(decorations))
  }, [decorations, hasMutatedDecorations])

  const noteCountLabel = useMemo(() => {
    if (notes.length === 1) return '1 note'
    return `${notes.length} notes`
  }, [notes.length])

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
    const limits = getLimits(boardRef.current, width, height)
    const visibleMaxX = Math.max(limits.maxX - OFFSCREEN_ALLOWANCE, 0)
    const visibleMaxY = Math.max(limits.maxY - OFFSCREEN_ALLOWANCE, 0)

    return {
      x: clamp(38 + Math.round(Math.random() * 260), 0, visibleMaxX),
      y: clamp(22 + Math.round(Math.random() * 150), 0, visibleMaxY),
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
    setHasMutatedNotes(true)
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
    setHasMutatedNotes(true)
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
      setHasMutatedNotes(true)
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

  const addPhotoDecoration = () => {
    const normalized = normalizePhotoInput(photoUrl)
    if (!normalized || !isLikelyImageUrl(normalized)) {
      setPhotoFeedback('Paste a full image URL or upload an image file.')
      return
    }

    const value = normalized.startsWith('data:image/') ? normalized : encodeURI(normalized)
    addDecoration('photo', value, compact ? 112 : 126)
    setPhotoFeedback('Photo added.')
    setPhotoUrl('')
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

    const newEntry: GuestbookNote = {
      id: Date.now(),
      name: 'Anonymous',
      message: trimmedMessage,
      date: toDisplayDate({ createdAt: now.toISOString() }),
      approved: true,
      createdAt: now.toISOString(),
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      ...placement,
    }

    setNotes((prev) => [...prev, newEntry])
    setHasMutatedNotes(true)
    setPinningId(newEntry.id)
    setMessage('')

    window.setTimeout(() => setPinningId(null), 760)
  }

  return (
    <div className={`guestbook-cork-shell ${compact ? 'guestbook-cork-shell-compact' : ''} ${fullHeight ? 'guestbook-cork-shell-full' : ''}`}>
      <div className="guestbook-cork-meta">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted">Anonymous guestboard</span>
        <span className="text-[11px] text-muted/85">{noteCountLabel}</span>
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
          <input
            value={photoUrl}
            onChange={(e) => {
              setPhotoUrl(e.target.value)
              if (photoFeedback) setPhotoFeedback('')
            }}
            className="guestboard-photo-input"
            placeholder="Paste image URL"
            aria-label="Photo URL"
          />
          <button type="button" className="guestboard-tool-btn" onClick={() => fileInputRef.current?.click()}>
            Upload
          </button>
          <button type="button" className="guestboard-tool-btn" onClick={addPhotoDecoration}>
            + Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileUpload}
          />
        </div>

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
      </div>

      <div className="guestbook-delete-hint">Drag to 🗑️ to delete. Click a note then press Backspace/Delete. Scroll to zoom.</div>
      {photoFeedback && <div className="guestbook-photo-feedback">{photoFeedback}</div>}

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
            width: `${Math.max(boardZoom * 100, 100)}%`,
            height: `${Math.max(boardZoom * 100, 100)}%`,
          }}
        >
          <div
            ref={boardRef}
            className="guestboard-zoom-world"
            style={{
              width: `${inverseBoardZoom * 100}%`,
              height: `${inverseBoardZoom * 100}%`,
              transform: `scale(${boardZoom})`,
              transformOrigin: 'top left',
            }}
          >
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

            {decorations.map((item, index) => {
              const itemId = `decor-${item.id}`

              return (
                <Rnd
                  key={itemId}
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
                    className={`guestbook-sticky-note guestboard-item-drag-handle ${pinningId === note.id ? 'guestbook-sticky-note-pinning' : ''} ${activeItemId === itemId ? 'guestbook-sticky-note-dragging' : ''} ${selectedNoteId === note.id ? 'guestbook-sticky-note-selected' : ''}`}
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
            aria-label="Pin note"
            title="Pin note"
          >
            📌
          </button>
        </div>
      </form>
    </div>
  )
}
