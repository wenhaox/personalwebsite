'use client'

import { ContactShadows, Environment, Html, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, type ReactNode, useEffect, useMemo, useState, useRef } from 'react'
import * as THREE from 'three'

export interface DeskSurfaceSlot {
  x: number
  z: number
  scale?: number
}

type FurniturePalette = {
  wood: string
  woodDark: string
  metal: string
  seat: string
  plant: string
  shade: string
}

const LIGHT_PALETTE: FurniturePalette = {
  wood: '#5A4536',
  woodDark: '#3A2E25',
  metal: '#5C5A57',
  seat: '#2A2724',
  plant: '#3E5A3A',
  shade: '#F2EBDD',
}

const DARK_PALETTE: FurniturePalette = {
  wood: '#C4A484',
  woodDark: '#9A7B5C',
  metal: '#B0ADA8',
  seat: '#D6D0C8',
  plant: '#7FA57A',
  shade: '#FFF6E8',
}

/** Kenney desk footprint after centering + DESK_SCALE */
const DESK_SCALE = 18.5
const CHAIR_SCALE = 15.4
const DESK = {
  width: 0.734 * DESK_SCALE,
  depth: 0.556 * DESK_SCALE,
  height: 0.384 * DESK_SCALE,
  z: 0,
}

const MODELS = {
  desk: '/models/kenney/desk.glb',
  chair: '/models/kenney/chairDesk.glb',
  lamp: '/models/kenney/lampRoundFloor.glb',
  plant: '/models/kenney/pottedPlant.glb',
} as const

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

function materialColorMap(palette: FurniturePalette): Record<string, string> {
  return {
    wood: palette.wood,
    wooddark: palette.woodDark,
    metal: palette.metal,
    metalmedium: palette.metal,
    carpet: palette.seat,
    plant: palette.plant,
    lamp: palette.shade,
  }
}

function recolorMaterials(root: THREE.Object3D, palette: FurniturePalette) {
  const colors = materialColorMap(palette)

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return
    const mesh = child as THREE.Mesh
    mesh.castShadow = true
    mesh.receiveShadow = true

    const apply = (material: THREE.Material) => {
      const next = material.clone()
      const name = (material.name || '').toLowerCase()
      const colorHex = colors[name]

      if ('color' in next && next.color instanceof THREE.Color) {
        if (colorHex) {
          next.color.set(colorHex)
        } else {
          next.color.lerp(new THREE.Color(palette.metal), 0.55)
        }
      }
      if ('roughness' in next && typeof next.roughness === 'number') {
        next.roughness = name.includes('metal') ? 0.38 : 0.72
      }
      if ('metalness' in next && typeof next.metalness === 'number') {
        next.metalness = name.includes('metal') ? 0.62 : 0.05
      }
      if (name === 'lamp' && 'emissive' in next && next.emissive instanceof THREE.Color) {
        next.emissive.set(palette.shade)
        ;(next as THREE.MeshStandardMaterial).emissiveIntensity = 0.28
      }
      return next
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(apply)
    } else if (mesh.material) {
      mesh.material = apply(mesh.material)
    }
  })
}

function KenneyProp({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  palette,
}: {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  palette: FurniturePalette
}) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const root = scene.clone(true)
    recolorMaterials(root, palette)

    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    root.position.x -= center.x
    root.position.z -= center.z
    root.position.y -= box.min.y
    return root
  }, [scene, palette])

  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function DeskScene({ palette }: { palette: FurniturePalette }) {
  const chairZ = DESK.z + DESK.depth * 0.5 + 0.443 * CHAIR_SCALE * 0.42

  return (
    <group>
      <KenneyProp url={MODELS.desk} position={[0, 0, DESK.z]} scale={DESK_SCALE} palette={palette} />
      <KenneyProp
        url={MODELS.chair}
        position={[0, 0, chairZ]}
        rotation={[0, Math.PI, 0]}
        scale={CHAIR_SCALE}
        palette={palette}
      />
      <KenneyProp
        url={MODELS.lamp}
        position={[-DESK.width * 0.58, 0, -DESK.depth * 0.08]}
        scale={10.2}
        palette={palette}
      />
      <KenneyProp
        url={MODELS.plant}
        position={[DESK.width * 0.55, 0, DESK.z + DESK.depth * 0.02]}
        scale={9.4}
        palette={palette}
      />
    </group>
  )
}

export function deskSlotToWorld(slot: DeskSurfaceSlot): [number, number, number] {
  const x = (slot.x - 0.5) * (DESK.width * 0.76)
  const z = (slot.z - 0.5) * (DESK.depth * 0.64) + DESK.z
  // Sit just above the desk top surface
  const y = DESK.height + 0.04
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
      {/* Bottom-center of the HTML sits on the desk (not vertically centered through it). */}
      <Html
        transform
        sprite
        distanceFactor={14.5}
        zIndexRange={[zIndex ?? 120, 0]}
        style={{
          width: `${6.4 * scale}rem`,
          pointerEvents: 'auto',
        }}
      >
        <div className="recently-iso-pin">
          <div className="recently-iso-anchor">{children}</div>
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

function DeskCanvasContents({ children, isDark }: { children: ReactNode; isDark: boolean }) {
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE

  return (
    <>
      <ambientLight intensity={isDark ? 0.48 : 0.7} />
      <directionalLight
        castShadow
        intensity={isDark ? 0.95 : 1.12}
        position={[9, 16, 8]}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />
      <directionalLight
        intensity={isDark ? 0.2 : 0.28}
        position={[-6, 5, -3]}
        color={isDark ? '#9aa6b8' : '#dfe4ec'}
      />
      <pointLight
        position={[-DESK.width * 0.5, DESK.height + 1.2, 0]}
        intensity={isDark ? 0.55 : 0.32}
        distance={18}
        color={isDark ? '#ffe8c8' : '#f3efe6'}
      />
      <Environment preset="apartment" environmentIntensity={isDark ? 0.18 : 0.28} />
      <DeskScene palette={palette} />
      <ContactShadows
        position={[0, 0.02, 1.4]}
        opacity={isDark ? 0.42 : 0.26}
        scale={36}
        blur={2.8}
        far={16}
        color="#1a1612"
      />
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
        camera={{ position: [15.5, 13, 16.5], zoom: 22, near: -200, far: 360 }}
        shadows
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 2.8, 1.4)
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

useGLTF.preload(MODELS.desk)
useGLTF.preload(MODELS.chair)
useGLTF.preload(MODELS.lamp)
useGLTF.preload(MODELS.plant)
