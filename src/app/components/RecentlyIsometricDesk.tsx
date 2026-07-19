'use client'

import { Environment, Html } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { DESK_UV, worldXZToSlot, type DeskSurfaceSlot } from '@/lib/recently-desk-layout'

export type { DeskSurfaceSlot }

const RECENTLY_LAMP_EVENT = 'recently:toggle-lamp'
const RECENTLY_WATER_EVENT = 'recently:water-plant'

type ThemePalette = {
  deskTop: string
  deskApron: string
  deskLeg: string
  deskEdge: string
  plant: string
  pot: string
  soil: string
  shadeOn: string
  shadeOff: string
  lampBase: string
  lampStem: string
}

const LIGHT_THEME: ThemePalette = {
  deskTop: '#c9b08a',
  deskApron: '#a88762',
  deskLeg: '#8f6d48',
  deskEdge: '#7d5d3d',
  plant: '#3F6B45',
  pot: '#6B5344',
  soil: '#3A2F28',
  shadeOn: '#FFF4D6',
  shadeOff: '#D8D2C6',
  lampBase: '#8A8580',
  lampStem: '#6e6862',
}

const DARK_THEME: ThemePalette = {
  deskTop: '#b89a72',
  deskApron: '#947450',
  deskLeg: '#7a5a3a',
  deskEdge: '#6a4a30',
  plant: '#7FA57A',
  pot: '#A89078',
  soil: '#5C4A3C',
  shadeOn: '#FFE9B0',
  shadeOff: '#8A8478',
  lampBase: '#C4BFB6',
  lampStem: '#a8a39a',
}

const DESK = {
  width: DESK_UV.width,
  depth: DESK_UV.depth,
  thickness: DESK_UV.thickness,
  height: DESK_UV.height,
  leg: 0.34,
  z: DESK_UV.z,
}

type DeskInteractionApi = {
  projectPointerToSlot: (clientX: number, clientY: number, scale?: number) => DeskSurfaceSlot | null
}

const DeskInteractionContext = createContext<DeskInteractionApi | null>(null)
const DeskViewScaleContext = createContext(1)

export function useDeskInteraction() {
  return useContext(DeskInteractionContext)
}

export function useDeskViewScale() {
  return useContext(DeskViewScaleContext)
}

function DeskInteractionProvider({ children }: { children: ReactNode }) {
  const { camera, gl } = useThree()
  const plane = useMemo(() => {
    const y = DESK.height + DESK.thickness * 0.5
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), -y)
  }, [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  const projectPointerToSlot = useCallback((clientX: number, clientY: number, scale = 1) => {
    const rect = gl.domElement.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(ndc, camera)
    if (!raycaster.ray.intersectPlane(plane, hit)) return null
    return worldXZToSlot(hit.x, hit.z, scale)
  }, [camera, gl, hit, ndc, plane, raycaster])

  const api = useMemo(() => ({ projectPointerToSlot }), [projectPointerToSlot])

  return (
    <DeskInteractionContext.Provider value={api}>
      {children}
    </DeskInteractionContext.Provider>
  )
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setIsDark(root.classList.contains('dark'))
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

function HandmadeDesk({ palette }: { palette: ThemePalette }) {
  const topY = DESK.height
  const legH = DESK.height - DESK.thickness * 0.5
  const insetX = DESK.width * 0.5 - 0.55
  const insetZ = DESK.depth * 0.5 - 0.55
  const apronH = 0.42

  return (
    <group position={[0, 0, DESK.z]}>
      {/* Tabletop */}
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[DESK.width, DESK.thickness, DESK.depth]} />
        <meshStandardMaterial color={palette.deskTop} roughness={0.72} metalness={0.04} />
      </mesh>

      {/* Thin darker edge under the top */}
      <mesh position={[0, topY - DESK.thickness * 0.55, 0]}>
        <boxGeometry args={[DESK.width * 0.998, 0.06, DESK.depth * 0.998]} />
        <meshStandardMaterial color={palette.deskEdge} roughness={0.78} />
      </mesh>

      {/* Apron */}
      <mesh position={[0, topY - DESK.thickness * 0.5 - apronH * 0.5, 0]}>
        <boxGeometry args={[DESK.width * 0.92, apronH, DESK.depth * 0.88]} />
        <meshStandardMaterial color={palette.deskApron} roughness={0.76} metalness={0.02} />
      </mesh>

      {/* Square wood legs */}
      {([
        [insetX, insetZ],
        [-insetX, insetZ],
        [insetX, -insetZ],
        [-insetX, -insetZ],
      ] as const).map(([x, z], index) => (
        <mesh key={index} position={[x, legH / 2, z]}>
          <boxGeometry args={[DESK.leg, legH, DESK.leg]} />
          <meshStandardMaterial color={palette.deskLeg} roughness={0.8} metalness={0.02} />
        </mesh>
      ))}
    </group>
  )
}

function PixelDeskSprite({
  position,
  src,
  altClass,
  sizeRem = 4.2,
  zIndex = 70,
  children,
}: {
  position: [number, number, number]
  src: string
  altClass?: string
  sizeRem?: number
  zIndex?: number
  children?: ReactNode
}) {
  const viewScale = useDeskViewScale()
  return (
    <group position={position}>
      <Html
        center={false}
        zIndexRange={[zIndex, 0]}
        wrapperClass="recently-html-anchor"
        style={{
          width: `${sizeRem * viewScale}rem`,
          pointerEvents: 'none',
          transform: 'translate3d(-50%, -100%, 0)',
        }}
      >
        <div className={`recently-pixel-prop ${altClass ?? ''}`.trim()}>
          <img src={src} alt="" aria-hidden="true" className="recently-pixel-prop-art" />
          {children}
        </div>
      </Html>
    </group>
  )
}

function InteractiveLamp({ isOn }: { isOn: boolean }) {
  const glow = useRef(isOn ? 1 : 0)
  const lightRef = useRef<THREE.PointLight>(null)
  const fillRef = useRef<THREE.PointLight>(null)
  const viewScale = useDeskViewScale()

  useFrame((_, delta) => {
    // Match SoftRoomLight so glow and desk shadow settle together.
    const lambda = isOn ? 3.4 : 3.8
    glow.current = THREE.MathUtils.damp(glow.current, isOn ? 1 : 0, lambda, delta)
    const g = glow.current
    if (lightRef.current) {
      lightRef.current.intensity = g * 2.6
      lightRef.current.distance = 10 + g * 5
    }
    if (fillRef.current) {
      fillRef.current.intensity = g * 0.7
    }
  })

  const surfaceY = DESK.height + DESK.thickness * 0.5 + 0.02
  const x = -DESK.width * 0.5 + 1.55
  const z = DESK.z - DESK.depth * 0.5 + 1.45

  return (
    <group position={[x, surfaceY, z]}>
      <Html
        center={false}
        zIndexRange={[70, 0]}
        wrapperClass="recently-html-anchor"
        style={{
          width: `${3.6 * viewScale}rem`,
          pointerEvents: 'none',
          transform: 'translate3d(-50%, -100%, 0)',
        }}
      >
        <div className={`recently-pixel-prop recently-pixel-lamp ${isOn ? 'is-on' : 'is-off'}`}>
          <img
            src="/pixel-objects/desk-corner-lamp.svg"
            alt=""
            aria-hidden="true"
            className="recently-pixel-prop-art"
          />
        </div>
      </Html>
      <pointLight
        ref={lightRef}
        position={[0, 1.15, 0.2]}
        intensity={0}
        distance={14}
        decay={2}
        color="#ffd89a"
      />
      <pointLight
        ref={fillRef}
        position={[0.5, 0.4, 0.8]}
        intensity={0}
        distance={8}
        decay={2}
        color="#ffe8c4"
      />
    </group>
  )
}

function InteractivePlant({ watering }: { watering: boolean }) {
  const surfaceY = DESK.height + DESK.thickness * 0.5 + 0.02
  const x = DESK.width * 0.5 - 1.55
  const z = DESK.z - DESK.depth * 0.5 + 1.45

  return (
    <PixelDeskSprite
      position={[x, surfaceY, z]}
      src="/pixel-objects/desk-bonsai.svg"
      altClass={`recently-pixel-bonsai ${watering ? 'is-watering' : ''}`}
      sizeRem={3.6}
      zIndex={70}
    >
      <span className={`recently-pixel-bucket ${watering ? 'is-pouring' : ''}`} aria-hidden="true">
        <img src="/pixel-objects/desk-water-bucket.svg" alt="" className="recently-pixel-bucket-art" />
      </span>
      <span className={`recently-pixel-drips ${watering ? 'is-active' : ''}`} aria-hidden="true">
        <i /><i /><i /><i />
      </span>
    </PixelDeskSprite>
  )
}

function DeskScene({
  palette,
  lampOn,
  watering,
}: {
  palette: ThemePalette
  lampOn: boolean
  watering: boolean
}) {
  return (
    <group>
      <HandmadeDesk palette={palette} />
      <InteractiveLamp isOn={lampOn} />
      <InteractivePlant watering={watering} />
    </group>
  )
}

export function deskSlotToWorld(slot: DeskSurfaceSlot): [number, number, number] {
  const marginX = DESK_UV.marginX
  const marginZBack = DESK_UV.marginZBack
  const marginZFront = DESK_UV.marginZFront
  const usableW = DESK.width - marginX * 2
  const usableD = DESK.depth - marginZBack - marginZFront
  const x = (slot.x - 0.5) * usableW
  const z = DESK.z - DESK.depth * 0.5 + marginZBack + slot.z * usableD
  const y = DESK.height + DESK.thickness * 0.5 + 0.04
  return [x, y, z]
}

function AnimatedHtmlAnchor({
  slot,
  children,
  zIndex,
  elevate,
  snap,
  follow,
  stackKey,
}: {
  slot: DeskSurfaceSlot
  children: ReactNode
  zIndex?: number
  elevate?: boolean
  snap?: boolean
  follow?: boolean
  stackKey?: string
}) {
  const group = useRef<THREE.Group>(null)
  const world = deskSlotToWorld(slot)
  const target = useRef(new THREE.Vector3(...world))
  const current = useRef(new THREE.Vector3(...world))
  const wrapperClass = elevate
    ? `recently-html-anchor recently-html-elevated${stackKey ? ` recently-html-${stackKey}` : ''}`
    : `recently-html-anchor${stackKey ? ` recently-html-${stackKey}` : ''}`

  // Keep 3D + DOM transform in sync immediately when snapping (load).
  useEffect(() => {
    const next = deskSlotToWorld(slot)
    target.current.set(...next)
    if (snap && !follow) {
      current.current.set(...next)
      if (group.current) group.current.position.set(...next)
    }
  }, [slot.x, slot.z, slot.scale, snap, follow])

  useFrame((_, delta) => {
    if (!group.current) return

    if (snap && !follow) {
      current.current.copy(target.current)
      group.current.position.copy(current.current)
    } else {
      // Fast ease while dragging, slightly softer for shuffle.
      const rate = follow ? 28 : 10
      current.current.lerp(target.current, Math.min(1, delta * rate))
      group.current.position.copy(current.current)
    }

    // drei Html overwrites z-index from camera depth — force elevated hosts on top.
    if (elevate && stackKey) {
      const el = document.querySelector(`.recently-html-${CSS.escape(stackKey)}`) as HTMLElement | null
      if (el) el.style.setProperty('z-index', '2147483000', 'important')
    }
  })

  const scale = slot.scale ?? 1
  const viewScale = useDeskViewScale()

  return (
    <group ref={group} position={current.current.toArray() as [number, number, number]}>
      <Html
        center={false}
        zIndexRange={elevate ? [2147483000, 2147482000] : [zIndex ?? 120, 0]}
        wrapperClass={wrapperClass}
        style={{
          width: `${4.8 * scale * viewScale}rem`,
          pointerEvents: 'auto',
          transform: 'translate3d(-50%, -100%, 0)',
        }}
      >
        <div className="recently-iso-anchor">
          {children}
        </div>
      </Html>
    </group>
  )
}

export function RecentlyDeskObjectAnchor({
  slot,
  children,
  zIndex,
  elevate,
  snap,
  follow,
  stackKey,
}: {
  slot: DeskSurfaceSlot
  children: ReactNode
  zIndex?: number
  elevate?: boolean
  snap?: boolean
  follow?: boolean
  stackKey?: string
}) {
  return (
    <AnimatedHtmlAnchor
      slot={slot}
      zIndex={zIndex}
      elevate={elevate}
      snap={snap}
      follow={follow}
      stackKey={stackKey}
    >
      {children}
    </AnimatedHtmlAnchor>
  )
}

function SoftRoomLight({ isDark, lampOn }: { isDark: boolean; lampOn: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const level = useRef(lampOn ? 1 : 0)

  useFrame((_, delta) => {
    // Same settle speed as InteractiveLamp so light + shadow stay locked.
    const lambda = lampOn ? 3.4 : 3.8
    level.current = THREE.MathUtils.damp(level.current, lampOn ? 1 : 0, lambda, delta)
    const g = level.current
    if (ambientRef.current) {
      ambientRef.current.intensity = isDark
        ? 0.18 + g * 0.18
        : 0.4 + g * 0.2
    }
    if (keyRef.current) {
      keyRef.current.intensity = isDark
        ? 0.45 + g * 0.35
        : 0.7 + g * 0.3
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={isDark ? 0.36 : 0.6} />
      <directionalLight
        ref={keyRef}
        intensity={isDark ? 0.8 : 1.0}
        position={[9, 16, 8]}
      />
      <directionalLight intensity={0.2} position={[-6, 5, -3]} color={isDark ? '#9aa6b8' : '#dfe4ec'} />
    </>
  )
}

function DeskCanvasContents({ children, isDark }: { children: ReactNode; isDark: boolean }) {
  const palette = isDark ? DARK_THEME : LIGHT_THEME
  const [lampOn, setLampOn] = useState(true)
  const [watering, setWatering] = useState(false)
  const waterTimer = useRef<number | null>(null)

  useEffect(() => {
    const onLamp = () => setLampOn((v) => !v)
    const onWater = () => {
      setWatering(true)
      if (waterTimer.current) window.clearTimeout(waterTimer.current)
      waterTimer.current = window.setTimeout(() => setWatering(false), 3400)
    }

    window.addEventListener(RECENTLY_LAMP_EVENT, onLamp)
    window.addEventListener(RECENTLY_WATER_EVENT, onWater)
    return () => {
      window.removeEventListener(RECENTLY_LAMP_EVENT, onLamp)
      window.removeEventListener(RECENTLY_WATER_EVENT, onWater)
      if (waterTimer.current) window.clearTimeout(waterTimer.current)
    }
  }, [])

  return (
    <>
      <SoftRoomLight isDark={isDark} lampOn={lampOn} />
      <Environment preset="apartment" environmentIntensity={isDark ? 0.14 : 0.26} />
      <DeskScene palette={palette} lampOn={lampOn} watering={watering} />
      {children}
    </>
  )
}

function AdaptiveDeskCamera({
  onViewScale,
}: {
  onViewScale: (scale: number) => void
}) {
  const { camera, size } = useThree()

  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    const narrow = size.width < 720
    const short = size.height < 520
    const tiny = size.width < 420 || size.height < 500

    // Pull back so the full desk stays in frame on phones.
    const zoom = narrow ? (tiny ? 14.2 : short ? 16.5 : 20) : 30
    cam.zoom = zoom
    cam.position.set(narrow ? 13.2 : 15, narrow ? 13.2 : 12.5, narrow ? 15.2 : 16)
    cam.lookAt(0, narrow ? 2.1 : 2.4, narrow ? 0.05 : 0.6)
    cam.updateProjectionMatrix()

    // Keep HTML icons proportional to the desk zoom (desktop baseline = 30).
    const scale = narrow ? (zoom / 30) * 1.12 : 1
    onViewScale(scale)
  }, [camera, onViewScale, size.height, size.width])

  return null
}

export default function RecentlyIsometricDesk({ children }: { children: ReactNode }) {
  const isDark = useIsDarkMode()
  const [viewScale, setViewScale] = useState(1)

  return (
    <div
      className="recently-iso-canvas"
      style={{ ['--desk-icon-scale' as string]: String(viewScale) }}
    >
      <Canvas
        orthographic
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [15, 12.5, 16], zoom: 30, near: -200, far: 360 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <AdaptiveDeskCamera onViewScale={setViewScale} />
        <Suspense fallback={null}>
          <DeskViewScaleContext.Provider value={viewScale}>
            <DeskInteractionProvider>
              <DeskCanvasContents isDark={isDark}>{children}</DeskCanvasContents>
            </DeskInteractionProvider>
          </DeskViewScaleContext.Provider>
        </Suspense>
      </Canvas>
    </div>
  )
}
