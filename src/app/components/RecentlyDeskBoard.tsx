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

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'
const RECENTLY_LAMP_EVENT = 'recently:toggle-lamp'
const RECENTLY_WATER_EVENT = 'recently:water-plant'

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
  variant: 'desktop' | 'mobile'
  left: number
  top: number
  bottom?: number
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
  const [pressEpoch, setPressEpoch] = useState(0)
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement | null>(null)
  const [tooltipPinned, setTooltipPinned] = useState(false)
  const shellRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dragMovedRef = useRef(false)
  const pressIdRef = useRef<string | null>(null)
  const dragOriginRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const dragOffsetRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
  const layoutRef = useRef(slotLayout)
  const seedAppliedRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)
  const hoveredIdRef = useRef<string | null>(null)
  const tooltipPinnedRef = useRef(false)
  const shufflingRef = useRef(false)
  const openTimeoutRef = useRef<number | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const exitTimeoutRef = useRef<number | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const HOVER_CLOSE_MS = 140
  const EXIT_ANIM_MS = 110

  useEffect(() => {
    layoutRef.current = slotLayout
  }, [slotLayout])

  useEffect(() => {
    hoveredIdRef.current = hoveredId
  }, [hoveredId])

  useEffect(() => {
    tooltipPinnedRef.current = tooltipPinned
  }, [tooltipPinned])

  useEffect(() => {
    shufflingRef.current = isShuffling
  }, [isShuffling])

  const clearOpenTimeout = useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }
  }, [])

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const clearExitTimeout = useCallback(() => {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }
  }, [])

  const showTooltip = useCallback((objectId: string) => {
    if (shufflingRef.current) return
    clearOpenTimeout()
    clearCloseTimeout()
    clearExitTimeout()
    setHoveredId(objectId)
    setTooltipPinned(true)
    window.requestAnimationFrame(() => setTooltipVisible(true))
  }, [clearCloseTimeout, clearExitTimeout, clearOpenTimeout])

  const hideTooltipFast = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    clearExitTimeout()
    setTooltipVisible(false)
    setTooltipPinned(false)
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredId(null)
      exitTimeoutRef.current = null
    }, EXIT_ANIM_MS)
  }, [EXIT_ANIM_MS, clearCloseTimeout, clearExitTimeout, clearOpenTimeout])

  const hideTooltipImmediate = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    clearExitTimeout()
    setTooltipVisible(false)
    setTooltipPinned(false)
    setHoveredId(null)
    setTooltipPlacement(null)
  }, [clearCloseTimeout, clearExitTimeout, clearOpenTimeout])

  // Dice / lamp / water should always dismiss the details card.
  useEffect(() => {
    const clear = () => hideTooltipImmediate()
    window.addEventListener(RECENTLY_SHUFFLE_EVENT, clear)
    window.addEventListener(RECENTLY_LAMP_EVENT, clear)
    window.addEventListener(RECENTLY_WATER_EVENT, clear)
    return () => {
      window.removeEventListener(RECENTLY_SHUFFLE_EVENT, clear)
      window.removeEventListener(RECENTLY_LAMP_EVENT, clear)
      window.removeEventListener(RECENTLY_WATER_EVENT, clear)
    }
  }, [hideTooltipImmediate])

  // Dice shuffle remounts layout — kill the card instantly so it can't flicker/rebuild.
  useEffect(() => {
    if (!isShuffling) return
    hideTooltipImmediate()
  }, [hideTooltipImmediate, isShuffling])

  const queueTooltipClose = useCallback(() => {
    // Open cards stay until click / Esc / close — no hover-dismiss race.
    if (tooltipPinnedRef.current) return
    clearOpenTimeout()
    clearCloseTimeout()
    closeTimeoutRef.current = window.setTimeout(() => {
      hideTooltipFast()
      closeTimeoutRef.current = null
    }, HOVER_CLOSE_MS)
  }, [HOVER_CLOSE_MS, clearCloseTimeout, clearOpenTimeout, hideTooltipFast])

  const cancelTooltipClose = useCallback(() => {
    clearCloseTimeout()
    clearExitTimeout()
    if (hoveredIdRef.current) setTooltipVisible(true)
  }, [clearCloseTimeout, clearExitTimeout])

  const isPointerOverOpenUi = useCallback((clientX: number, clientY: number, objectId: string) => {
    const shell = shellRefs.current[objectId]
    if (shell) {
      const rect = shell.getBoundingClientRect()
      if (
        clientX >= rect.left
        && clientX <= rect.right
        && clientY >= rect.top
        && clientY <= rect.bottom
      ) {
        return true
      }
    }

    const tooltip = document.querySelector('.recently-node-tooltip-portal') as HTMLElement | null
    if (tooltip) {
      const rect = tooltip.getBoundingClientRect()
      if (
        clientX >= rect.left
        && clientX <= rect.right
        && clientY >= rect.top
        && clientY <= rect.bottom
      ) {
        return true
      }
    }

    return false
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) {
      const saved = loadDeskLayout(objectIds, defaultLayout)
      setSlotLayout(saved)
      seedAppliedRef.current = layoutSeed
      hydratedRef.current = true
      return
    }

    if (seedAppliedRef.current !== layoutSeed) {
      // Dice shuffle uses the shuffled slot list, not the named default map.
      let next: Record<string, DeskSurfaceSlot> = {}
      objectIds.forEach((id, index) => {
        next[id] = { ...fallbackSlots[index % fallbackSlots.length] }
      })
      for (const id of objectIds) {
        next = resolveSlotCollisions(next, id)
      }
      setSlotLayout(next)
      saveDeskLayout(next)
      seedAppliedRef.current = layoutSeed
    }
  }, [defaultLayout, fallbackSlots, layoutSeed, objectIds])

  const updateTooltipPlacement = useCallback((objectId?: string) => {
    const mobile = window.matchMedia('(max-width: 1024px)').matches

    if (!mobile) {
      document.documentElement.style.removeProperty('--recently-mobile-popup-max-h')
      setTooltipPlacement({
        variant: 'desktop',
        left: 0,
        top: 0,
      })
      return
    }

    const dock = document.querySelector('.recently-popup-dock') as HTMLElement | null
    const funBar = document.querySelector('.recently-mobile-fun-bar') as HTMLElement | null
    const stage = document.querySelector('.recently-board-stage') as HTMLElement | null
    const gap = 12

    const placeAboveFunBar = (funTop: number, ceiling: number) => {
      const bottom = Math.max(gap, window.innerHeight - funTop + gap)
      // Tall overlay over the desk; fun bar stays visible underneath.
      const maxHeight = Math.max(200, Math.min(560, funTop - ceiling - gap * 2))
      document.documentElement.style.setProperty('--recently-mobile-popup-max-h', `${maxHeight}px`)
      setTooltipPlacement({
        variant: 'mobile',
        left: window.innerWidth / 2,
        top: 0,
        bottom,
      })
    }

    if (funBar) {
      const funTop = funBar.getBoundingClientRect().top
      const stageTop = stage?.getBoundingClientRect().top
      const dockTop = dock && dock.offsetParent !== null
        ? dock.getBoundingClientRect().top
        : null
      const ceiling = dockTop
        ?? (typeof stageTop === 'number' ? stageTop + 10 : Math.max(56, funTop - 340))
      placeAboveFunBar(funTop, ceiling)
      return
    }

    document.documentElement.style.setProperty('--recently-mobile-popup-max-h', '22rem')
    setTooltipPlacement({
      variant: 'mobile',
      left: window.innerWidth / 2,
      top: 0,
      bottom: 9.5 * 16,
    })
  }, [])

  useLayoutEffect(() => {
    if (!hoveredId || draggingId || isShuffling) {
      setTooltipPlacement(null)
      return
    }

    updateTooltipPlacement(hoveredId)
    const onReposition = () => updateTooltipPlacement(hoveredId)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [hoveredId, draggingId, isShuffling, updateTooltipPlacement])

  useEffect(() => {
    if (!hoveredId || draggingId || isShuffling) {
      clearCloseTimeout()
      return
    }

    const onPointerMove = (event: PointerEvent) => {
      // Click-opened cards stay put — moving across icons shouldn't dismiss them.
      if (tooltipPinnedRef.current) return
      if (event.pointerType && event.pointerType !== 'mouse') return
      const openId = hoveredIdRef.current
      if (!openId) return
      if (isPointerOverOpenUi(event.clientX, event.clientY, openId)) {
        cancelTooltipClose()
        return
      }
      queueTooltipClose()
    }

    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.recently-node-tooltip')) return
      if (target.closest('.recently-node-shell')) return
      // Fun controls (and anything else outside the icon) clear the card.
      hideTooltipImmediate()
    }

    const closeTooltipOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideTooltipFast()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDownOutside)
    window.addEventListener('keydown', closeTooltipOnEscape)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDownOutside)
      window.removeEventListener('keydown', closeTooltipOnEscape)
    }
  }, [
    cancelTooltipClose,
    clearCloseTimeout,
    draggingId,
    hideTooltipFast,
    hideTooltipImmediate,
    hoveredId,
    isPointerOverOpenUi,
    isShuffling,
    queueTooltipClose,
  ])

  useEffect(() => () => {
    clearOpenTimeout()
    clearCloseTimeout()
    clearExitTimeout()
  }, [clearCloseTimeout, clearExitTimeout, clearOpenTimeout])

  useEffect(() => {
    if (!pressEpoch) return
    const activeId = pressIdRef.current
    if (!activeId) return

    const onMove = (event: PointerEvent) => {
      const origin = dragOriginRef.current
      if (!origin || origin.id !== activeId) return

      const dist = Math.hypot(event.clientX - origin.x, event.clientY - origin.y)
      if (!dragMovedRef.current && dist < 5) return

      if (!dragMovedRef.current) {
        dragMovedRef.current = true
        clearOpenTimeout()
        hideTooltipFast()
        setTooltipPlacement(null)
        setDraggingId(activeId)
        document.body.classList.add('is-desk-dragging')
      }

      const scale = layoutRef.current[activeId]?.scale ?? 1
      const projected = desk?.projectPointerToSlot(event.clientX, event.clientY, scale)
      if (!projected) return

      const draft = {
        ...layoutRef.current,
        [activeId]: {
          x: projected.x + dragOffsetRef.current.x,
          z: projected.z + dragOffsetRef.current.z,
          scale,
        },
      }
      setSlotLayout(clampLayoutSlot(draft, activeId))
    }

    const onUp = (event: PointerEvent) => {
      const id = activeId
      const didMove = dragMovedRef.current

      if (didMove) {
        const settled = resolveSlotCollisions(layoutRef.current, id)
        setSlotLayout(settled)
        layoutRef.current = settled
        saveDeskLayout(settled)
        hideTooltipFast()
      } else if (event.pointerType && event.pointerType !== 'mouse') {
        // Touch: tap opens details.
        if (hoveredIdRef.current === id && tooltipPinnedRef.current) {
          hideTooltipFast()
        } else {
          showTooltip(id)
        }
      } else {
        // Desktop: click opens (no hover popup — keeps icon hopping free).
        if (hoveredIdRef.current === id && tooltipPinnedRef.current) {
          hideTooltipFast()
        } else {
          showTooltip(id)
        }
      }

      pressIdRef.current = null
      dragOriginRef.current = null
      dragOffsetRef.current = { x: 0, z: 0 }
      dragMovedRef.current = false
      setDraggingId(null)
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
  }, [clearOpenTimeout, desk, hideTooltipFast, pressEpoch, showTooltip])

  const beginPress = useCallback((objectId: string, event: React.PointerEvent) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement | null
    if (target?.closest('.recently-node-tooltip')) return

    dragMovedRef.current = false
    pressIdRef.current = objectId
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

    setPressEpoch((n) => n + 1)
  }, [desk])

  const hoveredObject = hoveredId
    ? objects.find((object) => object.id === hoveredId) ?? null
    : null

  useEffect(() => {
    if (!hoveredObject || !tooltipPlacement || isShuffling || typeof document === 'undefined') {
      setPortalTooltip(null)
      return
    }

    setPortalTooltip(
      createPortal(
        <div
          className={[
            'recently-node-tooltip recently-node-tooltip-portal',
            tooltipVisible ? 'is-visible' : '',
            tooltipPlacement.variant === 'desktop' ? 'is-dock-desktop' : 'is-dock-mobile',
            'is-pinned',
          ].filter(Boolean).join(' ')}
          style={
            tooltipPlacement.variant === 'mobile'
              ? {
                  left: tooltipPlacement.left,
                  top: 'auto',
                  bottom: tooltipPlacement.bottom ?? 152,
                }
              : undefined
          }
          onPointerEnter={(event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return
            cancelTooltipClose()
          }}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement | null
            if (target?.closest('a, button, iframe, input, textarea')) {
              event.stopPropagation()
            }
          }}
        >
          <button
            type="button"
            className="recently-node-tooltip-close"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              hideTooltipFast()
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
    hideTooltipFast,
    hoveredObject,
    isShuffling,
    setPortalTooltip,
    tooltipPinned,
    tooltipPlacement,
    tooltipVisible,
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
                onPointerDown={(event) => beginPress(object.id, event)}
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
