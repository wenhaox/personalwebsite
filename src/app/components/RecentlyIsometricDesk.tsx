'use client'

import { Environment, Html } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const RECENTLY_LAMP_EVENT = 'recently:toggle-lamp'
const RECENTLY_WATER_EVENT = 'recently:water-plant'

export interface DeskSurfaceSlot {
  x: number
  z: number
  scale?: number
}

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
  width: 22,
  depth: 12,
  thickness: 0.42,
  height: 2.55,
  leg: 0.34,
  z: 0.2,
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

function InteractiveLamp({
  palette,
  isOn,
}: {
  palette: ThemePalette
  isOn: boolean
}) {
  const shadeRef = useRef<THREE.Mesh>(null)
  const bulbRef = useRef<THREE.Mesh>(null)
  const glow = useRef(isOn ? 1 : 0)
  const lightRef = useRef<THREE.PointLight>(null)
  const fillRef = useRef<THREE.PointLight>(null)
  const shadeOff = useMemo(() => new THREE.Color(palette.shadeOff), [palette.shadeOff])
  const shadeOn = useMemo(() => new THREE.Color(palette.shadeOn), [palette.shadeOn])
  const emissiveOff = useMemo(() => new THREE.Color('#1a1814'), [])

  useFrame((_, delta) => {
    const target = isOn ? 1 : 0
    // Slow warm-up / cool-down
    glow.current = THREE.MathUtils.damp(glow.current, target, 1.15, delta)
    const g = glow.current

    const shadeMat = shadeRef.current?.material as THREE.MeshStandardMaterial | undefined
    if (shadeMat) {
      shadeMat.color.lerpColors(shadeOff, shadeOn, g)
      shadeMat.emissive.lerpColors(emissiveOff, shadeOn, g)
      shadeMat.emissiveIntensity = 0.08 + g * 0.95
      shadeMat.opacity = 0.78 + g * 0.16
    }

    const bulbMat = bulbRef.current?.material as THREE.MeshStandardMaterial | undefined
    if (bulbMat) {
      bulbMat.emissiveIntensity = g * 2.4
      bulbMat.color.setRGB(1, 0.92 - (1 - g) * 0.25, 0.72 - (1 - g) * 0.35)
    }

    if (lightRef.current) {
      lightRef.current.intensity = g * 2.6
      lightRef.current.distance = 10 + g * 5
    }
    if (fillRef.current) {
      fillRef.current.intensity = g * 0.7
    }
  })

  // Sit clearly on the back-left corner of the desk top
  const surfaceY = DESK.height + DESK.thickness * 0.5 + 0.02
  const x = -DESK.width * 0.5 + 1.55
  const z = DESK.z - DESK.depth * 0.5 + 1.45

  return (
    <group position={[x, surfaceY, z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.12, 20]} />
        <meshStandardMaterial color={palette.lampBase} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 12]} />
        <meshStandardMaterial color={palette.lampStem} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh ref={bulbRef} position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshStandardMaterial
          color="#ffe7b0"
          emissive="#ffe7b0"
          emissiveIntensity={isOn ? 2.2 : 0}
          roughness={0.25}
        />
      </mesh>
      <mesh ref={shadeRef} position={[0, 1.48, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.58, 0.58, 24, 1, true]} />
        <meshStandardMaterial
          color={isOn ? palette.shadeOn : palette.shadeOff}
          emissive={isOn ? palette.shadeOn : '#1a1814'}
          emissiveIntensity={isOn ? 0.9 : 0.08}
          roughness={0.42}
          metalness={0.04}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 1.15, 0]}
        intensity={isOn ? 2.6 : 0}
        distance={14}
        decay={2}
        color="#ffd89a"
      />
      <pointLight
        ref={fillRef}
        position={[0.5, 0.4, 0.8]}
        intensity={isOn ? 0.7 : 0}
        distance={8}
        decay={2}
        color="#ffe8c4"
      />
    </group>
  )
}

function WaterDrop({
  delay,
  active,
  origin,
}: {
  delay: number
  active: boolean
  origin: [number, number, number]
}) {
  const ref = useRef<THREE.Mesh>(null)
  const life = useRef(-delay)

  useFrame((_, delta) => {
    if (!ref.current) return
    if (!active) {
      life.current = -delay
      ref.current.visible = false
      return
    }

    life.current += delta
    if (life.current < 0) {
      ref.current.visible = false
      return
    }

    const cycle = 0.72
    const t = (life.current % cycle) / cycle
    ref.current.visible = t < 0.9
    const fall = t * t
    ref.current.position.set(
      origin[0] + Math.sin((delay + t) * 6.2) * 0.04,
      origin[1] - fall * 2.4,
      origin[2] + Math.cos((delay + t) * 4.8) * 0.03
    )
    ref.current.scale.set(0.7 + t * 0.2, 0.95 + t * 1.05, 0.7 + t * 0.2)
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.opacity = 0.95 * (1 - t * 0.7)
  })

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshStandardMaterial color="#8EC5FF" transparent opacity={0.95} roughness={0.12} metalness={0.05} />
    </mesh>
  )
}

function InteractivePlant({
  palette,
  watering,
}: {
  palette: ThemePalette
  watering: boolean
}) {
  const foliage = useRef<THREE.Group>(null)
  const canRef = useRef<THREE.Group>(null)
  const spoutRef = useRef<THREE.Group>(null)
  const spoutLocal = useRef(new THREE.Vector3())
  const soilRef = useRef<THREE.Mesh>(null)
  const sway = useRef(0.12)
  const grow = useRef(1)
  const visit = useRef(0)
  const wet = useRef(0)
  const drySoil = useMemo(() => new THREE.Color(palette.soil), [palette.soil])
  const wetSoil = useMemo(() => new THREE.Color('#2a211c'), [])
  const dryLeaf = useMemo(() => new THREE.Color(palette.plant), [palette.plant])
  const freshLeaf = useMemo(() => new THREE.Color('#4f8a55'), [])
  const [dripping, setDripping] = useState(false)

  useEffect(() => {
    if (!watering) {
      setDripping(false)
      return
    }
    const timer = window.setTimeout(() => setDripping(true), 480)
    return () => window.clearTimeout(timer)
  }, [watering])

  useFrame((state, delta) => {
    // Can flies in, pours, then eases out when watering ends
    visit.current = THREE.MathUtils.damp(visit.current, watering ? 1 : 0, 2.4, delta)
    wet.current = THREE.MathUtils.damp(wet.current, watering ? 1 : 0, 1.4, delta)
    sway.current = THREE.MathUtils.damp(sway.current, watering ? 0.85 : 0.14, 3.2, delta)
    grow.current = THREE.MathUtils.damp(grow.current, watering ? 1.08 : 1, 2.6, delta)

    const v = visit.current
    const arrive = THREE.MathUtils.smoothstep(v, 0.02, 0.42)
    const pour = THREE.MathUtils.smoothstep(v, 0.32, 0.72)

    if (canRef.current) {
      canRef.current.visible = v > 0.02
      // Fly in from above, settle over the bonsai canopy, tip spout down onto foliage
      const x = 1.6 * (1 - arrive) + 0.18 * arrive
      const y = 3.9 * (1 - arrive) + (2.85 + Math.sin(pour * Math.PI) * 0.06) * arrive
      const z = 0.9 * (1 - arrive) + 0.05 * arrive
      canRef.current.position.set(x, y, z)
      canRef.current.rotation.set(
        0.2 + pour * 0.15,
        0.35,
        -0.2 - pour * 0.95
      )
      canRef.current.scale.setScalar(0.9 + arrive * 0.15)
    }

    if (spoutRef.current && canRef.current) {
      spoutLocal.current.set(0.64, -0.04, 0)
      canRef.current.localToWorld(spoutLocal.current)
      spoutRef.current.parent?.worldToLocal(spoutLocal.current)
      spoutRef.current.position.copy(spoutLocal.current)
    }

    if (foliage.current) {
      foliage.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.35) * 0.045 * sway.current
      foliage.current.rotation.x = Math.cos(state.clock.elapsedTime * 1.1) * 0.02 * sway.current
      foliage.current.scale.setScalar(grow.current)
      foliage.current.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat?.color) mat.color.lerpColors(dryLeaf, freshLeaf, wet.current * 0.55)
      })
    }

    if (soilRef.current) {
      const mat = soilRef.current.material as THREE.MeshStandardMaterial
      mat.color.lerpColors(drySoil, wetSoil, wet.current)
    }
  })

  // Sit clearly on the back-right corner of the desk top
  const surfaceY = DESK.height + DESK.thickness * 0.5 + 0.02
  const x = DESK.width * 0.5 - 1.55
  const z = DESK.z - DESK.depth * 0.5 + 1.45
  const trunk = useMemo(() => new THREE.Color('#6b4f38'), [])
  const trunkDark = useMemo(() => new THREE.Color('#4f3a2a'), [])
  const potRim = useMemo(() => new THREE.Color('#8a6b55'), [palette.pot])
  const moss = useMemo(() => new THREE.Color('#5a7a4a'), [])

  return (
    <group position={[x, surfaceY, z]} scale={0.92}>
      {/* Shallow bonsai pot */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.72, 0.58, 0.32, 24]} />
        <meshStandardMaterial color={palette.pot} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.30, 0]}>
        <torusGeometry args={[0.68, 0.045, 10, 28]} />
        <meshStandardMaterial color={potRim} roughness={0.7} />
      </mesh>
      <mesh ref={soilRef} position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.1, 22]} />
        <meshStandardMaterial color={palette.soil} roughness={0.95} />
      </mesh>
      {/* Moss + pebble accents */}
      <mesh position={[-0.28, 0.4, 0.18]} scale={[1, 0.35, 0.85]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={moss} roughness={0.9} />
      </mesh>
      <mesh position={[0.32, 0.39, -0.12]} rotation={[0.4, 0.2, 0.1]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#9a9086" roughness={0.85} />
      </mesh>

      {/* Curved trunk */}
      <group position={[0.02, 0.38, 0]}>
        <mesh position={[0, 0.28, 0]} rotation={[0.12, 0.15, 0.28]}>
          <cylinderGeometry args={[0.09, 0.13, 0.58, 10]} />
          <meshStandardMaterial color={trunk} roughness={0.88} />
        </mesh>
        <mesh position={[-0.12, 0.72, 0.04]} rotation={[-0.15, 0.1, -0.55]}>
          <cylinderGeometry args={[0.065, 0.095, 0.48, 10]} />
          <meshStandardMaterial color={trunk} roughness={0.88} />
        </mesh>
        <mesh position={[0.08, 1.05, -0.02]} rotation={[0.2, -0.2, 0.35]}>
          <cylinderGeometry args={[0.045, 0.07, 0.42, 10]} />
          <meshStandardMaterial color={trunkDark} roughness={0.9} />
        </mesh>
        <mesh position={[-0.28, 0.92, 0.08]} rotation={[0.1, 0.3, -1.05]}>
          <cylinderGeometry args={[0.03, 0.05, 0.32, 8]} />
          <meshStandardMaterial color={trunkDark} roughness={0.9} />
        </mesh>
      </group>

      {/* Layered bonsai canopy pads */}
      <group ref={foliage} position={[0, 1.05, 0]}>
        <mesh position={[0.06, 0.55, 0]} scale={[1.15, 0.48, 0.95]}>
          <sphereGeometry args={[0.55, 18, 14]} />
          <meshStandardMaterial color={palette.plant} roughness={0.78} />
        </mesh>
        <mesh position={[-0.38, 0.32, 0.12]} scale={[0.85, 0.4, 0.75]}>
          <sphereGeometry args={[0.38, 14, 12]} />
          <meshStandardMaterial color={palette.plant} roughness={0.78} />
        </mesh>
        <mesh position={[0.42, 0.28, -0.1]} scale={[0.75, 0.36, 0.7]}>
          <sphereGeometry args={[0.32, 14, 12]} />
          <meshStandardMaterial color={palette.plant} roughness={0.78} />
        </mesh>
        <mesh position={[-0.05, 0.88, -0.05]} scale={[0.7, 0.34, 0.65]}>
          <sphereGeometry args={[0.28, 14, 12]} />
          <meshStandardMaterial color={palette.plant} roughness={0.78} />
        </mesh>
        <mesh position={[0.22, 0.7, 0.18]} scale={[0.55, 0.3, 0.5]}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color={palette.plant} roughness={0.78} />
        </mesh>
      </group>

      <group ref={canRef} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.34, 0.46, 14]} />
          <meshStandardMaterial color="#6B8F71" roughness={0.55} metalness={0.15} />
        </mesh>
        <mesh position={[0.42, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.1, 0.48, 10]} />
          <meshStandardMaterial color="#5A7A60" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[-0.24, 0.14, 0]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.17, 0.038, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#5A7A60" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Drips track the spout and fall straight down onto the bonsai */}
      <group ref={spoutRef}>
        <WaterDrop delay={0} active={dripping} origin={[0, 0, 0]} />
        <WaterDrop delay={0.1} active={dripping} origin={[0.03, 0, 0.02]} />
        <WaterDrop delay={0.2} active={dripping} origin={[-0.02, 0, -0.02]} />
        <WaterDrop delay={0.32} active={dripping} origin={[0.05, 0, 0.01]} />
        <WaterDrop delay={0.44} active={dripping} origin={[0.01, 0, -0.03]} />
        <WaterDrop delay={0.56} active={dripping} origin={[-0.03, 0, 0.03]} />
        <WaterDrop delay={0.68} active={dripping} origin={[0.04, 0, -0.01]} />
      </group>
    </group>
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
      <InteractiveLamp palette={palette} isOn={lampOn} />
      <InteractivePlant palette={palette} watering={watering} />
    </group>
  )
}

export function deskSlotToWorld(slot: DeskSurfaceSlot): [number, number, number] {
  // Symmetric span left/right; inset enough for lamp / bonsai corners.
  const x = (slot.x - 0.5) * (DESK.width - 4.8)
  const z = (slot.z - 0.5) * (DESK.depth - 3.0) + DESK.z + 0.2
  const y = DESK.height + DESK.thickness * 0.5 + 0.04
  return [x, y, z]
}

function AnimatedHtmlAnchor({
  slot,
  children,
  zIndex,
}: {
  slot: DeskSurfaceSlot
  children: ReactNode
  zIndex?: number
}) {
  const group = useRef<THREE.Group>(null)
  const target = useRef(new THREE.Vector3(...deskSlotToWorld(slot)))
  const current = useRef(new THREE.Vector3(...deskSlotToWorld(slot)))

  useEffect(() => {
    target.current.set(...deskSlotToWorld(slot))
  }, [slot.x, slot.z, slot.scale])

  useFrame((_, delta) => {
    if (!group.current) return
    current.current.lerp(target.current, Math.min(1, delta * 7))
    group.current.position.copy(current.current)
  })

  const scale = slot.scale ?? 1

  return (
    <group ref={group} position={current.current.toArray() as [number, number, number]}>
      <Html
        center={false}
        zIndexRange={[zIndex ?? 120, 0]}
        style={{
          width: `${4.8 * scale}rem`,
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
}: {
  slot: DeskSurfaceSlot
  children: ReactNode
  zIndex?: number
}) {
  return (
    <AnimatedHtmlAnchor slot={slot} zIndex={zIndex}>
      {children}
    </AnimatedHtmlAnchor>
  )
}

function SoftRoomLight({ isDark, lampOn }: { isDark: boolean; lampOn: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const level = useRef(lampOn ? 1 : 0)

  useFrame((_, delta) => {
    level.current = THREE.MathUtils.damp(level.current, lampOn ? 1 : 0, 1.15, delta)
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

export default function RecentlyIsometricDesk({ children }: { children: ReactNode }) {
  const isDark = useIsDarkMode()

  return (
    <div className="recently-iso-canvas">
      <Canvas
        orthographic
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [15, 12.5, 16], zoom: 30, near: -200, far: 360 }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 2.4, 0.6)
          camera.updateProjectionMatrix()
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <DeskCanvasContents isDark={isDark}>{children}</DeskCanvasContents>
        </Suspense>
      </Canvas>
    </div>
  )
}
