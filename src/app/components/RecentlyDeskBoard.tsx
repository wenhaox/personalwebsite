'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import RecentlyIsometricDesk, {
  RecentlyDeskObjectAnchor,
  type DeskSurfaceSlot,
} from './RecentlyIsometricDesk'

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
  slotLayout: Record<string, DeskSurfaceSlot>
  fallbackSlots: DeskSurfaceSlot[]
  isReady: boolean
  isShuffling: boolean
  getPresentation: (pixelArt: string, kind: string) => ObjectPresentation
}

export default function RecentlyDeskBoard({
  objects,
  slotLayout,
  fallbackSlots,
  isReady,
  isShuffling,
  getPresentation,
}: RecentlyDeskBoardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipEdgeMap, setTooltipEdgeMap] = useState<Record<string, { left: boolean; right: boolean; top: boolean }>>({})
  const tooltipRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const tooltipCloseTimeoutRef = useRef<number | null>(null)

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

  const updateTooltipEdgeMap = useCallback((objectId: string) => {
    const node = tooltipRefs.current[objectId]
    if (!node) return

    const rect = node.getBoundingClientRect()
    setTooltipEdgeMap((current) => ({
      ...current,
      [objectId]: {
        left: rect.left < 16,
        right: rect.right > window.innerWidth - 16,
        top: rect.top < 16,
      },
    }))
  }, [])

  useEffect(() => () => {
    if (tooltipCloseTimeoutRef.current) {
      window.clearTimeout(tooltipCloseTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!hoveredId) return

    const closeTooltipIfOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.recently-node-shell')) return
      if (target.closest('.recently-node-tooltip')) return
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
  }, [hoveredId])

  return (
    <RecentlyIsometricDesk>
      {objects.map((object, index) => {
        const slot = slotLayout[object.id] || fallbackSlots[index % fallbackSlots.length]
        const presentation = getPresentation(object.pixelArt, object.kind)
        const isHovered = hoveredId === object.id
        const tooltipEdgeState = tooltipEdgeMap[object.id]
        const isTopEdge = slot.z < 0.35 || Boolean(tooltipEdgeState?.top)
        const isLeftEdge = slot.x < 0.22 || Boolean(tooltipEdgeState?.left)
        const isRightEdge = slot.x > 0.78 || Boolean(tooltipEdgeState?.right)
        const tooltipClassName = [
          'recently-node-tooltip',
          isHovered ? 'is-visible' : '',
          isTopEdge ? 'is-top-edge' : '',
          isLeftEdge ? 'is-left-edge' : '',
          isRightEdge ? 'is-right-edge' : '',
        ].filter(Boolean).join(' ')

        return (
          <RecentlyDeskObjectAnchor
            key={object.id}
            slot={slot}
            zIndex={isHovered ? 260 : 80 + index}
          >
            <article
              className={`recently-object-slot recently-iso-object ${isReady ? 'is-ready' : ''}`}
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
                  setHoveredId((current) => {
                    const next = current === object.id ? null : object.id
                    if (next) {
                      window.requestAnimationFrame(() => {
                        updateTooltipEdgeMap(object.id)
                      })
                    }
                    return next
                  })
                }}
              >
                <div
                  className={`recently-node recently-node-${object.kind} ${isHovered ? 'is-hovered' : ''}`}
                  aria-label={object.title}
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
                        {presentation.pixelExtraClass.includes('has-vinyl-spin') ? (
                          <span className="recently-vinyl-spinner" aria-hidden="true">
                            <img
                              src={object.pixelArt}
                              alt=""
                              className={`recently-node-pixel-image ${presentation.isSmoothArt ? 'is-smooth-art' : ''} ${presentation.motionClass}`.trim()}
                            />
                          </span>
                        ) : (
                          <img
                            src={object.pixelArt}
                            alt=""
                            aria-hidden="true"
                            className={`recently-node-pixel-image ${presentation.isSmoothArt ? 'is-smooth-art' : ''} ${presentation.motionClass}`.trim()}
                          />
                        )}
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
                >
                  <button
                    type="button"
                    className="recently-node-tooltip-close"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setHoveredId(null)
                    }}
                    onTouchStart={(event) => {
                      event.stopPropagation()
                    }}
                    aria-label={`Close details for ${object.title}`}
                  >
                    ✕
                  </button>

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

                  <div className="recently-node-tooltip-body">
                    <p className="recently-node-tooltip-title">{object.title}</p>
                    <p className="recently-node-tooltip-subtitle">{object.subtitle}</p>
                    <p className="recently-node-tooltip-copy">{object.description}</p>

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
              </div>
            </article>
          </RecentlyDeskObjectAnchor>
        )
      })}
    </RecentlyIsometricDesk>
  )
}
