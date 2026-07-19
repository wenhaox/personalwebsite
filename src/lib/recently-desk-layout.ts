export interface DeskSurfaceSlot {
  x: number
  z: number
  scale?: number
}

export const DESK_LAYOUT_STORAGE_KEY = 'recently:desk-layout:v6'

/** Default icon placement (captured from a settled local desk). */
export const DEFAULT_DESK_LAYOUT: Record<string, DeskSurfaceSlot> = {
  record: { x: 0.252, z: 0.754, scale: 0.82 },
  camera: { x: 0.783, z: 0.564, scale: 0.82 },
  movie: { x: 0.605, z: 0.9, scale: 0.82 },
  headphones: { x: 0.96, z: 0.318, scale: 0.82 },
  coffee: { x: 0.488, z: 0.281, scale: 0.82 },
  gamepad: { x: 0.96, z: 0.96, scale: 0.82 },
  book: { x: 0.266, z: 0.223, scale: 0.82 },
}

/** Match RecentlyIsometricDesk.deskSlotToWorld margins. */
export const DESK_UV = {
  marginX: 2.35,
  marginZBack: 2.45,
  marginZFront: 0.55,
  width: 22,
  depth: 12,
  z: 0.2,
  height: 2.55,
  thickness: 0.42,
} as const

/** Minimum world-space gap between icon centers (keeps sprites from stacking). */
export const MIN_ICON_SEPARATION = 2.95

/** Soft keep-out around lamp / bonsai corners (world XZ). */
const PROP_KEEP_OUTS: Array<{ x: number; z: number; radius: number }> = [
  { x: -DESK_UV.width * 0.5 + 1.55, z: DESK_UV.z - DESK_UV.depth * 0.5 + 1.45, radius: 2.4 },
  { x: DESK_UV.width * 0.5 - 1.55, z: DESK_UV.z - DESK_UV.depth * 0.5 + 1.45, radius: 2.4 },
]

const SLOT_INSET = 0.04

const clampSlotAxis = (value: number) => Math.min(1 - SLOT_INSET, Math.max(SLOT_INSET, value))

export function deskUsableBounds() {
  const usableW = DESK_UV.width - DESK_UV.marginX * 2
  const usableD = DESK_UV.depth - DESK_UV.marginZBack - DESK_UV.marginZFront
  const z0 = DESK_UV.z - DESK_UV.depth * 0.5 + DESK_UV.marginZBack
  return { usableW, usableD, z0 }
}

export function slotToWorldXZ(slot: DeskSurfaceSlot): { x: number; z: number } {
  const { usableW, usableD, z0 } = deskUsableBounds()
  return {
    x: (slot.x - 0.5) * usableW,
    z: z0 + slot.z * usableD,
  }
}

export function worldXZToSlot(x: number, z: number, scale = 1): DeskSurfaceSlot {
  const { usableW, usableD, z0 } = deskUsableBounds()
  return {
    x: clampSlotAxis(x / usableW + 0.5),
    z: clampSlotAxis((z - z0) / usableD),
    scale,
  }
}

export function clampSlotToDesk(slot: DeskSurfaceSlot): DeskSurfaceSlot {
  return {
    x: clampSlotAxis(slot.x),
    z: clampSlotAxis(slot.z),
    scale: slot.scale ?? 1,
  }
}

function pushOutOfKeepOuts(x: number, z: number): { x: number; z: number } {
  let nextX = x
  let nextZ = z
  for (const zone of PROP_KEEP_OUTS) {
    const dx = nextX - zone.x
    const dz = nextZ - zone.z
    const dist = Math.hypot(dx, dz)
    if (dist < zone.radius && dist > 1e-4) {
      const scale = zone.radius / dist
      nextX = zone.x + dx * scale
      nextZ = zone.z + dz * scale
    } else if (dist <= 1e-4) {
      nextX = zone.x + zone.radius
      nextZ = zone.z
    }
  }
  return { x: nextX, z: nextZ }
}

/** Soft desk clamp only — used while dragging so motion stays fluid. */
export function clampLayoutSlot(
  layout: Record<string, DeskSurfaceSlot>,
  movingId: string
): Record<string, DeskSurfaceSlot> {
  const next = { ...layout }
  const moving = next[movingId]
  if (!moving) return next

  let { x, z } = slotToWorldXZ(moving)
  ;({ x, z } = pushOutOfKeepOuts(x, z))
  next[movingId] = clampSlotToDesk(worldXZToSlot(x, z, moving.scale ?? 1))
  return next
}

/** Keep `movingId` at least MIN_ICON_SEPARATION from every other icon. */
export function resolveSlotCollisions(
  layout: Record<string, DeskSurfaceSlot>,
  movingId: string,
  separation = MIN_ICON_SEPARATION
): Record<string, DeskSurfaceSlot> {
  const next = { ...layout }
  const moving = next[movingId]
  if (!moving) return next

  let { x, z } = slotToWorldXZ(moving)
  ;({ x, z } = pushOutOfKeepOuts(x, z))

  for (let pass = 0; pass < 8; pass += 1) {
    let pushed = false
    for (const [id, slot] of Object.entries(next)) {
      if (id === movingId) continue
      const other = slotToWorldXZ(slot)
      const dx = x - other.x
      const dz = z - other.z
      const dist = Math.hypot(dx, dz)
      if (dist >= separation || dist < 1e-5) {
        if (dist < 1e-5) {
          x += separation
          pushed = true
        }
        continue
      }
      const scale = separation / dist
      x = other.x + dx * scale
      z = other.z + dz * scale
      pushed = true
    }
    ;({ x, z } = pushOutOfKeepOuts(x, z))
    if (!pushed) break
  }

  // Re-clamp onto usable desk after pushes
  next[movingId] = clampSlotToDesk(worldXZToSlot(x, z, moving.scale ?? 1))
  return next
}

export function buildDefaultLayout(
  objectIds: string[],
  slots: DeskSurfaceSlot[]
): Record<string, DeskSurfaceSlot> {
  const layout: Record<string, DeskSurfaceSlot> = {}
  objectIds.forEach((id, index) => {
    const named = DEFAULT_DESK_LAYOUT[id]
    layout[id] = named ? { ...named } : { ...slots[index % slots.length] }
  })
  return layout
}

export function loadDeskLayout(
  objectIds: string[],
  fallback: Record<string, DeskSurfaceSlot>
): Record<string, DeskSurfaceSlot> {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(DESK_LAYOUT_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Record<string, DeskSurfaceSlot>
    if (!parsed || typeof parsed !== 'object') return fallback

    const layout: Record<string, DeskSurfaceSlot> = {}
    let missing = false
    for (const id of objectIds) {
      const saved = parsed[id]
      if (
        saved
        && typeof saved.x === 'number'
        && typeof saved.z === 'number'
        && Number.isFinite(saved.x)
        && Number.isFinite(saved.z)
      ) {
        layout[id] = clampSlotToDesk({
          x: saved.x,
          z: saved.z,
          scale: typeof saved.scale === 'number' ? saved.scale : fallback[id]?.scale ?? 1,
        })
      } else {
        missing = true
        layout[id] = fallback[id] ?? { x: 0.5, z: 0.5, scale: 1 }
      }
    }

    // Resolve any persisted overlaps (e.g. after icon size changes).
    let resolved = layout
    for (const id of objectIds) {
      resolved = resolveSlotCollisions(resolved, id)
    }
    if (missing) saveDeskLayout(resolved)
    return resolved
  } catch {
    return fallback
  }
}

export function saveDeskLayout(layout: Record<string, DeskSurfaceSlot>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DESK_LAYOUT_STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // ignore quota / private mode
  }
}
