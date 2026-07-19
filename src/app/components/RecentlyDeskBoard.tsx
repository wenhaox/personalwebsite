'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import RecentlyIsometricDesk, {
  RecentlyDeskObjectAnchor,
  useDeskInteraction,
  type DeskSurfaceSlot,
} from './RecentlyIsometricDesk'
import VinylTurntableIcon from './VinylTurntableIcon'
import {
  buildDefaultLayout,
  clampLayoutSlot,
  loadDeskLayout,
  resolveSlotCollisions,
  saveDeskLayout,
} from '@/lib/recently-desk-layout'

export interface DeskBoardObject {
  id: string
  kind: string
  pixelArt: string
  title: string
  subtitle: string
  description: string
  image?: string
  link?: { url: string; text: string }
  spotifyEmbed?: string
}

interface ObjectPresentation {
  motionClass: string
  pixelExtraClass: string
  spriteExtraClass: string
  showCoffeeSteam: boolean
  showCassetteReels: boolean
  isSmoothArt: boolean
}

interface RecentlyDeskBoardProps {
  objects: DeskBoardObject[]
  fallbackSlots: DeskSurfaceSlot[]
  layoutSeed: number
  isReady: boolean
  isShuffling: boolean
  getPresentation: (pixelArt: string, kind: string) => ObjectPresentation
}

type TooltipPlacement = {
  left: number
  top: number
  placeAbove: boolean
  align: 'center' | 'left' | 'right'
}

export default function RecentlyDeskBoard(props: RecentlyDeskBoardProps) {
  const [portalTooltip, setPortalTooltip] = useState<ReactNode>(null)

  return (
    <>
      <RecentlyIsometricDesk>
        <DeskObjectsLayer {...props} setPortalTooltip={setPortalTooltip} />
      </RecentlyIsometricDesk>
      {portalTooltip}
    </>
  )
}

function DeskObjectsLayer({
  objects,
  fallbackSlots,
  layoutSeed,
  isReady,
  isShuffling,
  getPresentation,
  setPortalTooltip,
}: RecentlyDeskBoardProps & {
  setPortalTooltip: (node: ReactNode) => void
}) {
  const desk = useDeskInteraction()
  const objectIds = useMemo(() => objects.map((object) => object.id), [objects])
  const defaultLayout = useMemo(
    () => buildDefaultLayout(objectIds, fallbackSlots),
    [fallbackSlots, objectIds]
  )

  const [slotLayout, setSlotLayout] = useState<Record<string, DeskSurfaceSlot>>(() => (
    typeof window === 'undefined'
      ? defaultLayout
      : loadDeskLayout(objectIds, defaultLayout)
  ))
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement | null>(null)
  const shellRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const tooltipCloseTimeoutRef = useRef<number | null>(null)
  const dragMovedRef = useRef(false)
  const skipClickRef = useRef(false)
  const dragOriginRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const dragOffsetRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
  const layoutRef = useRef(slotLayout)
  const seedAppliedRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    layoutRef.current = slotLayout
  }, [slotLayout])

  useEffect(() => {
    if (!hydratedRef.current) {
      const saved = loadDeskLayout(objectIds, defaultLayout)
      setSlotLayout(saved)
      seedAppliedRef.current = layoutSeed
      hydratedRef.current = true
      return
    }

    if (seedAppliedRef.current !== layoutSeed) {
      let next = defaultLayout
      for (const id of objectIds) {
        next = resolveSlotCollisions(next, id)
      }
      setSlotLayout(next)
      saveDeskLayout(next)
      seedAppliedRef.current = layoutSeed
    }
  }, [defaultLayout, layoutSeed, objectIds])

  const cancelTooltipClose = useCallback(() => {
    if (tooltipCloseTimeoutRef.current) {
      window.clearTimeout(tooltipCloseTimeoutRef.current)
      tooltipCloseTimeoutRef.current = null
    }
  }, [])

  const queueTooltipClose = useCallback((objectId: string) => {
    cancelTooltipClose()
    tooltipCloseTimeoutRef.current = window.setTimeout(() => {
      setHoveredId((current) => (current === objectId ? null : current))
    }, 160)
  }, [cancelTooltipClose])

  const updateTooltipPlacement = useCallback((objectId: string) => {
    const shell = shellRefs.current[objectId]
    if (!shell) return

    const rect = shell.getBoundingClientRect()
    const gap = 10
    const estimatedHeight = Math.min(window.innerHeight * 0.44, 340)
    const placeAbove = rect.top > estimatedHeight + gap + 16
    const centerX = rect.left + rect.width / 2
    const maxWidth = Math.min(288, window.innerWidth - 16)
    let left = centerX
    let align: TooltipPlacement['align'] = 'center'

    if (centerX - maxWidth / 2 < 8) {
      left = 8
      align = 'left'
    } else if (centerX + maxWidth / 2 > window.innerWidth - 8) {
      left = window.innerWidth - 8
      align = 'right'
    }

    setTooltipPlacement({
      left,
      top: placeAbove ? rect.top - gap : rect.bottom + gap,
      placeAbove,
      align,
    })
  }, [])

  useEffect(() => () => {
    if (tooltipCloseTimeoutRef.current) {
      window.clearTimeout(tooltipCloseTimeoutRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (!hoveredId || draggingId) {
      setTooltipPlacement(null)
      return
    }

    updateTooltipPlacement(hoveredId)
    const onReposition = () => updateTooltipPlacement(hoveredId)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    const frame = window.setInterval(onReposition, 120)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
      window.clearInterval(frame)
    }
  }, [hoveredId, draggingId, updateTooltipPlacement, slotLayout])

  useEffect(() => {
    if (!hoveredId || draggingId) return

    const closeTooltipIfOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.recently-node-tooltip')) return
      // Close before a drag starts on any desk icon.
      if (target.closest('.recently-node-shell')) {
        setHoveredId(null)
        return
      }
      setHoveredId(null)
    }

    const closeTooltipOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoveredId(null)
    }

    window.addEventListener('pointerdown', closeTooltipIfOutside)
    window.addEventListener('keydown', closeTooltipOnEscape)
    return () => {
      window.removeEventListener('pointerdown', closeTooltipIfOutside)
      window.removeEventListener('keydown', closeTooltipOnEscape)
    }
  }, [hoveredId, draggingId])

  useEffect(() => {
    if (!draggingId || !desk) return

    const onMove = (event: PointerEvent) => {
      const origin = dragOriginRef.current
      if (!origin || origin.id !== draggingId) return

      const dist = Math.hypot(event.clientX - origin.x, event.clientY - origin.y)
      if (!dragMovedRef.current && dist < 3) return
      dragMovedRef.current = true
      setHoveredId(null)

      const scale = layoutRef.current[draggingId]?.scale ?? 1
      const projected = desk.projectPointerToSlot(event.clientX, event.clientY, scale)
      if (!projected) return

      const draft = {
        ...layoutRef.current,
        [draggingId]: {
          x: projected.x + dragOffsetRef.current.x,
          z: projected.z + dragOffsetRef.current.z,
          scale,
        },
      }
      setSlotLayout(clampLayoutSlot(draft, draggingId))
    }

    const onUp = () => {
      const didMove = dragMovedRef.current
      const settled = didMove
        ? resolveSlotCollisions(layoutRef.current, draggingId)
        : layoutRef.current
      if (didMove) {
        setSlotLayout(settled)
        layoutRef.current = settled
      }
      saveDeskLayout(settled)
      setDraggingId(null)
      dragOriginRef.current = null
      dragOffsetRef.current = { x: 0, z: 0 }
      if (didMove) {
        skipClickRef.current = true
        setHoveredId(null)
        window.setTimeout(() => {
          skipClickRef.current = false
        }, 220)
      }
      dragMovedRef.current = false
      document.body.classList.remove('is-desk-dragging')
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [desk, draggingId])

  const startDrag = useCallback((objectId: string, event: React.PointerEvent) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement | null
    if (target?.closest('.recently-node-tooltip')) return

    event.preventDefault()
    dragMovedRef.current = false
    dragOriginRef.current = { id: objectId, x: event.clientX, y: event.clientY }

    const currentSlot = layoutRef.current[objectId]
    const scale = currentSlot?.scale ?? 1
    const projected = desk?.projectPointerToSlot(event.clientX, event.clientY, scale)
    if (currentSlot && projected) {
      dragOffsetRef.current = {
        x: currentSlot.x - projected.x,
        z: currentSlot.z - projected.z,
      }
    } else {
      dragOffsetRef.current = { x: 0, z: 0 }
    }

    cancelTooltipClose()
    setHoveredId(null)
    setTooltipPlacement(null)
    setDraggingId(objectId)
    document.body.classList.add('is-desk-dragging')
  }, [cancelTooltipClose, desk])

  const hoveredObject = hoveredId
    ? objects.find((object) => object.id === hoveredId) ?? null
    : null

  useEffect(() => {
    if (!hoveredObject || !tooltipPlacement || typeof document === 'undefined') {
      setPortalTooltip(null)
      return
    }

    setPortalTooltip(
      createPortal(
        <div
          className={[
            'recently-node-tooltip recently-node-tooltip-portal is-visible',
            tooltipPlacement.placeAbove ? 'is-portal-above' : 'is-portal-below',
            tooltipPlacement.align === 'left' ? 'is-portal-left' : '',
            tooltipPlacement.align === 'right' ? 'is-portal-right' : '',
          ].filter(Boolean).join(' ')}
          style={{
            left: tooltipPlacement.left,
            top: tooltipPlacement.top,
          }}
          onMouseEnter={() => {
            if (draggingId) return
            cancelTooltipClose()
            setHoveredId(hoveredObject.id)
          }}
          onMouseLeave={() => {
            if (draggingId) return
            queueTooltipClose(hoveredObject.id)
          }}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement | null
            // Let links / close / embeds work; otherwise close so desk stays draggable.
            if (target?.closest('a, button, iframe, input, textarea')) {
              event.stopPropagation()
              return
            }
            setHoveredId(null)
          }}
        >
          <button
            type="button"
            className="recently-node-tooltip-close"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setHoveredId(null)
            }}
            aria-label={`Close details for ${hoveredObject.title}`}
          >
            ✕
          </button>

          {hoveredObject.spotifyEmbed && (
            <iframe
              src={hoveredObject.spotifyEmbed}
              className="recently-node-tooltip-spotify"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`${hoveredObject.title} Spotify player`}
            />
          )}

          {!hoveredObject.spotifyEmbed && hoveredObject.image && (
            <img src={hoveredObject.image} alt={hoveredObject.title} className="recently-node-tooltip-media" />
          )}

          <div className="recently-node-tooltip-body">
            <p className="recently-node-tooltip-title">{hoveredObject.title}</p>
            <p className="recently-node-tooltip-subtitle">{hoveredObject.subtitle}</p>
            <p className="recently-node-tooltip-copy">{hoveredObject.description}</p>

            {hoveredObject.link && (
              <a
                href={hoveredObject.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="recently-node-tooltip-link"
              >
                {hoveredObject.link.text} ↗
              </a>
            )}
          </div>
        </div>,
        document.body
      )
    )

    return () => setPortalTooltip(null)
  }, [
    cancelTooltipClose,
    draggingId,
    hoveredObject,
    queueTooltipClose,
    setPortalTooltip,
    tooltipPlacement,
  ])

  return (
    <>
      {objects.map((object, index) => {
        const slot = slotLayout[object.id] || fallbackSlots[index % fallbackSlots.length]
        const presentation = getPresentation(object.pixelArt, object.kind)
        const isDragging = draggingId === object.id
        const isHovered = hoveredId === object.id && !draggingId

        return (
          <RecentlyDeskObjectAnchor
            key={object.id}
            slot={slot}
            stackKey={object.id}
            elevate={isHovered || isDragging}
            snap={!isShuffling && !isDragging}
            follow={isDragging}
            zIndex={isDragging ? 200000 : isHovered ? 180000 : 80 + index}
          >
            <article
              className={`recently-object-slot recently-iso-object ${isReady ? 'is-ready' : ''} ${isHovered ? 'is-tooltip-open' : ''} ${isDragging ? 'is-dragging' : ''} ${isShuffling ? 'is-shuffling' : ''}`.trim()}
            >
              <div
                ref={(node) => {
                  shellRefs.current[object.id] = node
                }}
                className="recently-node-shell"
                onPointerDown={(event) => startDrag(object.id, event)}
                onClick={() => {
                  if (skipClickRef.current || draggingId || dragMovedRef.current) return
                  cancelTooltipClose()
                  setHoveredId((current) => (current === object.id ? null : object.id))
                }}
              >
                <div
                  className={`recently-node recently-node-${object.kind} ${isHovered ? 'is-hovered' : ''}`.trim()}
                  aria-label={`${object.title} (drag to move, click for details)`}
                  role="img"
                >
                  <span className={`recently-node-pixel recently-node-pixel-${object.kind} ${presentation.pixelExtraClass}`.trim()}>
                    {presentation.showCoffeeSteam && (
                      <>
                        <span className="recently-coffee-steam recently-coffee-steam-1" aria-hidden="true" />
                        <span className="recently-coffee-steam recently-coffee-steam-2" aria-hidden="true" />
                      </>
                    )}
                    {presentation.showCassetteReels && (
                      <>
                        <span className="recently-cassette-reel recently-cassette-reel-left" aria-hidden="true" />
                        <span className="recently-cassette-reel recently-cassette-reel-right" aria-hidden="true" />
                      </>
                    )}
                    <span className={`recently-node-pixel-sprite ${presentation.spriteExtraClass}`.trim()}>
                      {presentation.pixelExtraClass.includes('has-turntable') ? (
                        <VinylTurntableIcon />
                      ) : presentation.pixelExtraClass.includes('has-vinyl-spin') ? (
                        <span className="recently-vinyl-spinner" aria-hidden="true">
                          <img
                            src={object.pixelArt}
                            alt=""
                            className={`recently-node-pixel-image ${presentation.isSmoothArt ? 'is-smooth-art' : ''} ${presentation.motionClass}`.trim()}
                            draggable={false}
                          />
                        </span>
                      ) : (
                        <img
                          src={object.pixelArt}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          className={`recently-node-pixel-image ${presentation.isSmoothArt ? 'is-smooth-art' : ''} ${presentation.motionClass}`.trim()}
                        />
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </article>
          </RecentlyDeskObjectAnchor>
        )
      })}
    </>
  )
}
