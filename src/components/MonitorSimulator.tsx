import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, PerspectiveCamera } from '@react-three/drei'
import { FoldVertical, Grid2x2, Maximize, Minimize } from 'lucide-react'
import * as THREE from 'three'
import {
  DEFAULT_SIMULATOR,
  SIMULATOR_DISTANCE_MAX_IN,
  SIMULATOR_DISTANCE_MIN_IN,
  SIMULATOR_HEAD_ANGLE_MAX,
  SIMULATOR_PITCH_MAX,
} from '../constants'
import { monitorSelectionToken, resolveSelection } from '../data'
import { arcPoints, physical } from '../lib/geometry'
import { formatLength, fromInches, roundToUnit, toInches, UNIT_LABELS } from '../lib/units'
import type { Monitor, SimulatorSettings, Unit } from '../types'
import { Intro } from './Intro'
import { MonitorPicker } from './MonitorPicker'
import { NumberField } from './NumberField'

// The eye's simulated field of view. Three's camera fov is vertical; we fix the
// front-view canvas to 3:2 — the proportion of the human forward field of view
// (~210° wide × ~150° tall ≈ 1.4, and the native frame of a 43mm normal lens) —
// so the horizontal fov is stable and can be mirrored in the top view.
const ASPECT = 3 / 2
// ~45° horizontal ≈ a 43mm "true normal" lens on full-frame — focal length equal
// to the frame diagonal (2·atan(18/43.3)), the geometric definition of natural
// human perspective. The eye position (distance) drives the actual distortion;
// this renders that geometry at natural perspective without adding lens warp.
// Three's camera fov is vertical, so derive it from the horizontal at our 16:9.
const H_FOV_DEG = 45
const FOV_V_DEG = (Math.atan(Math.tan((H_FOV_DEG * Math.PI) / 360) / ASPECT) * 360) / Math.PI
// Half the vertical FOV as a tangent — the image-plane half-extent. Used to turn a
// dragged pixel into its angular size for direct-manipulation dragging (see dragSens).
const TAN_HALF_FOV_V = Math.tan((FOV_V_DEG * Math.PI) / 360)

// Bezel widths (inches). The bottom is a larger "chin", like a real monitor.
const BEZEL_SIDE = 0.4
const BEZEL_TOP = 0.4
const BEZEL_BOTTOM = 0.8
/** Arc tessellation for the 3D mesh — denser than the 2D top view so the curve reads smoothly. */
const MESH_SAMPLES = 72

const deg2rad = (d: number) => (d * Math.PI) / 180
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const HEAD_DRAG_SENS = 0.25 // degrees of head turn per pixel dragged (top-view control)
const KEY_ANIM_MS = 180 // ease-in-out duration for a single arrow-key step
const RECENTER_MS = 450 // ease-in-out duration for recenter / nominal-distance sync
const EPS = 1e-6 // nudge so a value already on an integer steps to the next one
/** easeInOutCubic. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** WebGL guarantees at least 4096²; cap the texture there and downscale larger panels. */
const MAX_TEX = 4096

// ── Screen content texture ────────────────────────────────────────────────────
// A faux macOS desktop drawn to a canvas at the panel's TRUE pixel resolution, so
// everything is sized in real device pixels: the windows (800×600 and 1440×900),
// the 24px menu bar, and the Dock icons occupy the same fraction of the panel a
// real one would — making pixel density visible (a window looks tiny on a dense 4K
// panel and large on a 1440p one). No external asset is fetched.

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

// Coordinates below are all in true device pixels.
const MENUBAR_H = 24 // macOS menu bar: 24 pt = 24px at 1x (verified against Apple's spec)
const TITLE_H = 40 // faux window title bar
const DOCK_ICON = 56
const DOCK_GAP = 14
const DOCK_PAD = 12 // padding between the Dock's icons and the panel edge
const DOCK_MARGIN = 16 // gap from the Dock panel to the screen's bottom edge
const INK = 'rgba(29,29,31,0.9)' // menu-bar foreground

/** A macOS-ish window with a gray title bar and its pixel size printed at 60px. */
function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Soft drop shadow on all sides, so an overlapping window casts a visible
  // penumbra on the one beneath and their boundaries stay legible. Painted with
  // the body fill, then reset so the title bar and text below stay crisp.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 20
  ctx.fillStyle = '#eef2f7'
  roundRect(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundRect(ctx, x, y, w, h, 14)
  ctx.clip()
  ctx.fillStyle = '#c9ced7' // gray title bar
  ctx.fillRect(x, y, w, TITLE_H)
  ctx.fillStyle = 'rgba(0,0,0,0.1)' // hairline under the title bar
  ctx.fillRect(x, y + TITLE_H - 1, w, 1)
  ctx.restore()

  const dot = (cx: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx, y + TITLE_H / 2, 7, 0, Math.PI * 2)
    ctx.fill()
  }
  dot(x + 24, '#f87171')
  dot(x + 48, '#fbbf24')
  dot(x + 72, '#34d399')

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 60px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${w}×${h}`, x + w / 2, y + TITLE_H + (h - TITLE_H) / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** The menu's leading mark — a plain solid dot, centered on (cx, cy). */
function drawMenuLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

/** Menu-bar status glyphs, each anchored by its right edge at `rx`, centered on `cy`. */
function drawSearch(ctx: CanvasRenderingContext2D, rx: number, cy: number) {
  const r = 5
  const cx = rx - 7
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.arc(cx, cy - 1, r, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 4, cy + 3); ctx.lineTo(cx + 7, cy + 6); ctx.stroke()
}
function drawWifi(ctx: CanvasRenderingContext2D, rx: number, cy: number) {
  const cx = rx - 9
  const baseY = cy + 4.5 // apex dot; the 9px-tall fan above it centers on cy
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  for (const r of [9, 6, 3]) {
    ctx.beginPath(); ctx.arc(cx, baseY, r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke()
  }
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(cx, baseY, 1.3, 0, Math.PI * 2); ctx.fill()
}
function drawBattery(ctx: CanvasRenderingContext2D, rx: number, cy: number) {
  const w = 25
  const h = 12
  const x = rx - w
  const y = cy - h / 2
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  roundRect(ctx, x, y, w, h, 3); ctx.stroke()
  ctx.fillStyle = INK
  ctx.fillRect(x + w + 1.5, y + h * 0.3, 2, h * 0.4) // terminal nub
  roundRect(ctx, x + 2, y + 2, (w - 4) * 0.7, h - 4, 1.5); ctx.fill() // charge level
}

/** The translucent menu bar: Apple + app menus on the left, status icons + clock on the right. */
function drawMenuBar(ctx: CanvasRenderingContext2D, W: number) {
  ctx.fillStyle = 'rgba(248,249,251,0.62)'
  ctx.fillRect(0, 0, W, MENUBAR_H)
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.fillRect(0, MENUBAR_H - 1, W, 1) // hairline separator

  const cy = MENUBAR_H / 2
  ctx.textBaseline = 'middle'
  ctx.fillStyle = INK

  let x = 16
  drawMenuLogo(ctx, x, cy, 6)
  x += 20
  ctx.textAlign = 'left'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText('Monitorture', x, cy + 0.5)
  x += ctx.measureText('Monitorture').width + 18
  ctx.font = '15px sans-serif'
  for (const item of ['File', 'Edit', 'View', 'Go', 'Window', 'Help']) {
    ctx.fillText(item, x, cy + 0.5)
    x += ctx.measureText(item).width + 16
  }

  let rx = W - 16
  ctx.textAlign = 'right'
  ctx.font = '15px sans-serif'
  const clock = 'Mon 12:00'
  ctx.fillText(clock, rx, cy + 0.5)
  rx -= ctx.measureText(clock).width + 18
  drawBattery(ctx, rx, cy); rx -= 34
  drawWifi(ctx, rx, cy); rx -= 26
  drawSearch(ctx, rx, cy)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** The Dock: rounded squircle icons centered on a translucent white panel that hugs them. */
function drawDock(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const icons = ['#5eb0f7', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#ff2d55', '#64d2ff', '#30d158']
  const iconsW = icons.length * DOCK_ICON + (icons.length - 1) * DOCK_GAP
  const panelW = iconsW + 2 * DOCK_PAD
  const panelH = DOCK_ICON + 2 * DOCK_PAD
  const panelX = (W - panelW) / 2
  const panelY = H - DOCK_MARGIN - panelH
  const radius = panelH * 0.28

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  roundRect(ctx, panelX, panelY, panelW, panelH, radius)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 1
  roundRect(ctx, panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1, radius)
  ctx.stroke()

  let x = panelX + DOCK_PAD
  const y = panelY + DOCK_PAD
  for (const color of icons) {
    ctx.fillStyle = color
    roundRect(ctx, x, y, DOCK_ICON, DOCK_ICON, DOCK_ICON * 0.24)
    ctx.fill()
    x += DOCK_ICON + DOCK_GAP
  }
}

function drawDesktop(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0e7490')
  bg.addColorStop(0.55, '#1e3a8a')
  bg.addColorStop(1, '#312e81')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Faint 128px grid to reveal curvature on the mesh.
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = 128; x < W; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 128; y < H; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Two windows at real pixel sizes, centered in the area between menu bar and Dock.
  const contentTop = MENUBAR_H
  const contentBottom = H - DOCK_MARGIN - (DOCK_ICON + 2 * DOCK_PAD)
  const centerY = (h: number) => Math.round(contentTop + (contentBottom - contentTop - h) / 2)
  drawWindow(ctx, Math.round(W * 0.1), centerY(600), 800, 600)
  drawWindow(ctx, Math.round(W - 1440 - W * 0.08), centerY(900), 1440, 900)

  // Dock floats over the windows; the menu bar sits above everything.
  drawDock(ctx, W, H)
  drawMenuBar(ctx, W)
}

function useScreenTexture(resWidth: number, resHeight: number) {
  return useMemo(() => {
    // Draw at native resolution when it fits, else uniformly downscale the buffer.
    // The content is drawn in device-pixel space regardless, so proportions (and
    // thus apparent pixel density) are identical either way — only sharpness drops.
    const scale = Math.min(1, MAX_TEX / Math.max(resWidth, resHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(resWidth * scale))
    canvas.height = Math.max(1, Math.round(resHeight * scale))
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(scale, scale)
      drawDesktop(ctx, resWidth, resHeight)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [resWidth, resHeight])
}

// ── Curved panel geometry ───────────────────────────────────────────────────────
// A width×2 vertex grid following the screen arc (apex at z=0, edges bowing toward
// +z / the viewer), UV-mapped left→right, bottom→top so the texture wraps like
// on-screen content.
function buildCurvedGeometry(
  widthIn: number,
  heightIn: number,
  curveRadius: number | null,
): THREE.BufferGeometry {
  const arc = arcPoints(widthIn, curveRadius, MESH_SAMPLES)
  const cols = arc.length
  const positions = new Float32Array(cols * 2 * 3)
  const uvs = new Float32Array(cols * 2 * 2)
  for (let i = 0; i < cols; i++) {
    const [x, depth] = arc[i]
    const u = cols === 1 ? 0 : i / (cols - 1)
    const b = i * 2
    positions[b * 3] = x
    positions[b * 3 + 1] = -heightIn / 2
    positions[b * 3 + 2] = depth
    uvs[b * 2] = u
    uvs[b * 2 + 1] = 0
    positions[(b + 1) * 3] = x
    positions[(b + 1) * 3 + 1] = heightIn / 2
    positions[(b + 1) * 3 + 2] = depth
    uvs[(b + 1) * 2] = u
    uvs[(b + 1) * 2 + 1] = 1
  }
  const indices: number[] = []
  for (let i = 0; i < cols - 1; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = (i + 1) * 2
    const d = (i + 1) * 2 + 1
    indices.push(a, c, b, b, c, d)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function ScreenMesh({
  widthIn,
  heightIn,
  curveRadius,
  texture,
}: {
  widthIn: number
  heightIn: number
  curveRadius: number | null
  texture: THREE.Texture
}) {
  const screenGeo = useMemo(
    () => buildCurvedGeometry(widthIn, heightIn, curveRadius),
    [widthIn, heightIn, curveRadius],
  )
  const bezelGeo = useMemo(
    () =>
      buildCurvedGeometry(widthIn + 2 * BEZEL_SIDE, heightIn + BEZEL_TOP + BEZEL_BOTTOM, curveRadius),
    [widthIn, heightIn, curveRadius],
  )
  const screenMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
    [texture],
  )
  const bezelMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.DoubleSide }),
    [],
  )

  useEffect(
    () => () => {
      screenGeo.dispose()
      bezelGeo.dispose()
      screenMat.dispose()
      bezelMat.dispose()
    },
    [screenGeo, bezelGeo, screenMat, bezelMat],
  )

  return (
    <group>
      {/* Bezel sits just behind the screen so it shows as a border around all four edges. */}
      <mesh geometry={bezelGeo} material={bezelMat} position={[0, (BEZEL_TOP - BEZEL_BOTTOM) / 2, -0.2]} />
      <mesh geometry={screenGeo} material={screenMat} />
    </group>
  )
}

function FrontView({
  widthIn,
  heightIn,
  curveRadius,
  resWidth,
  resHeight,
  distanceIn,
  headAngle,
  pitch,
  dark,
}: {
  widthIn: number
  heightIn: number
  curveRadius: number | null
  resWidth: number
  resHeight: number
  distanceIn: number
  headAngle: number
  pitch: number
  dark: boolean
}) {
  const texture = useScreenTexture(resWidth, resHeight)
  // Dark: the top view's --surface-1 gray rather than near-black, so the dark
  // monitor bezel reads against the ambient background instead of merging into it.
  const bg = dark ? '#1a1a19' : '#dfe3ea'
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} frameloop="demand">
      <color attach="background" args={[bg]} />
      {/* Eye at +z looking toward the screen. Head turn is a yaw about the eye
          (Y) plus a pitch about X; YXZ order keeps the horizon level. */}
      <PerspectiveCamera
        makeDefault
        fov={FOV_V_DEG}
        near={0.1}
        far={5000}
        position={[0, 0, distanceIn]}
        rotation={[deg2rad(pitch), -deg2rad(headAngle), 0, 'YXZ']}
      />
      <ScreenMesh widthIn={widthIn} heightIn={heightIn} curveRadius={curveRadius} texture={texture} />
      <Grid
        position={[0, -heightIn / 2 - 2, 0]}
        args={[200, 200]}
        infiniteGrid
        cellSize={2}
        cellThickness={0.6}
        sectionSize={10}
        sectionThickness={1}
        cellColor={dark ? '#2a2a30' : '#b7bdc7'}
        sectionColor={dark ? '#3a3a44' : '#9aa2af'}
        fadeDistance={Math.max(60, distanceIn * 3)}
        fadeStrength={1.5}
      />
    </Canvas>
  )
}

// ── Top-down projection (SVG, same approach as the comparison tool's top view) ──
const SVG_W = 800
const SVG_H = 460
const PAD_PX = 28

function TopDown({
  widthIn,
  curveRadius,
  distanceIn,
  nominalDistanceIn,
  headAngle,
  unit,
  onRotate,
  onReset,
}: {
  widthIn: number
  /** The actual (keyboard-controlled) eye distance — drives the eye and rays. */
  distanceIn: number
  /** The nominal (input-field / persisted) distance — drawn as a tick marker. */
  nominalDistanceIn: number
  curveRadius: number | null
  headAngle: number
  unit: Unit
  onRotate: (deg: number) => void
  /** Ease the actual distance back to the nominal (set) distance. */
  onReset: () => void
}) {
  // Drag left/right anywhere on the diagram to aim the camera (direct: drag
  // right → camera turns right).
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startAngle: headAngle }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const next = d.startAngle + (e.clientX - d.startX) * HEAD_DRAG_SENS
    onRotate(clamp(next, -SIMULATOR_HEAD_ANGLE_MAX, SIMULATOR_HEAD_ANGLE_MAX))
  }
  const endDrag = () => {
    dragRef.current = null
  }

  const geom = useMemo(() => {
    const arc = arcPoints(widthIn, curveRadius, 48)
    const halfW = Math.max(...arc.map((p) => Math.abs(p[0])))
    const worldTop = -1
    const worldBottom = Math.max(distanceIn, nominalDistanceIn) + 3
    const worldHalfW = halfW + 2
    const worldW = worldHalfW * 2
    const worldH = worldBottom - worldTop
    const scale = Math.min((SVG_W - 2 * PAD_PX) / worldW, (SVG_H - 2 * PAD_PX) / worldH)
    const cx = SVG_W / 2
    const originY = (SVG_H - worldH * scale) / 2 - worldTop * scale
    const px = (x: number) => cx + x * scale
    const py = (depth: number) => originY + depth * scale

    const screen = arc.map(([x, depth]) => `${px(x)},${py(depth)}`).join(' ')
    const eye = { x: px(0), y: py(distanceIn) }
    const apex = { x: px(0), y: py(0) }

    // Frustum edge + center rays, rotated by the head angle.
    const rayLen = worldH * 1.3
    const ray = (gDeg: number) => {
      const a = deg2rad(gDeg)
      return { x: px(Math.sin(a) * rayLen), y: py(distanceIn - Math.cos(a) * rayLen) }
    }
    const left = ray(headAngle - H_FOV_DEG / 2)
    const right = ray(headAngle + H_FOV_DEG / 2)
    const center = ray(headAngle)

    const nominalY = py(nominalDistanceIn)

    return { screen, eye, apex, left, right, center, cx, nominalY }
  }, [widthIn, curveRadius, distanceIn, nominalDistanceIn, headAngle])

  return (
    <div
      className="relative w-full max-w-[720px] cursor-ew-resize touch-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)] select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title="Drag left/right to move the camera"
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full text-[var(--text-muted)]"
        style={{ aspectRatio: `${SVG_W} / ${SVG_H}` }}
      >
        {/* Field-of-view cone. */}
        <polygon
          points={`${geom.eye.x},${geom.eye.y} ${geom.left.x},${geom.left.y} ${geom.right.x},${geom.right.y}`}
          fill="currentColor"
          opacity={0.1}
        />
        {/* Edge rays (the camera-view bounding box) + center gaze. */}
        <line x1={geom.eye.x} y1={geom.eye.y} x2={geom.left.x} y2={geom.left.y} stroke="currentColor" strokeWidth={1.5} />
        <line x1={geom.eye.x} y1={geom.eye.y} x2={geom.right.x} y2={geom.right.y} stroke="currentColor" strokeWidth={1.5} />
        <line
          x1={geom.eye.x}
          y1={geom.eye.y}
          x2={geom.center.x}
          y2={geom.center.y}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="5 5"
          opacity={0.6}
        />
        {/* Distance guide from eye to screen center. */}
        <line
          x1={geom.apex.x}
          y1={geom.apex.y}
          x2={geom.eye.x}
          y2={geom.eye.y}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.5}
        />
        {/* The screen, from above. */}
        <polyline
          points={geom.screen}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Nominal (set) distance — a short tick on the center axis. */}
        <line
          x1={geom.cx - 12}
          y1={geom.nominalY}
          x2={geom.cx + 12}
          y2={geom.nominalY}
          stroke="var(--text-secondary)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* The eye — the actual (current) position. */}
        <circle cx={geom.eye.x} cy={geom.eye.y} r={7} fill="var(--series-1)" />
        <text x={geom.eye.x + 12} y={geom.eye.y + 4} fill="currentColor" fontSize={13}>
          Eyes
        </text>
        <text x={geom.apex.x} y={geom.apex.y - 8} fill="currentColor" fontSize={13} textAnchor="middle">
          Screen
        </text>
        {/* Actual eye-to-screen distance, at the middle of the dotted guide. */}
        {(() => {
          const midY = (geom.apex.y + geom.eye.y) / 2
          const label = formatLength(distanceIn, unit)
          const w = label.length * 7.5 + 12
          return (
            <>
              <rect
                x={geom.cx - w / 2}
                y={midY - 10}
                width={w}
                height={20}
                rx={5}
                fill="var(--surface-1)"
                opacity={0.9}
              />
              <text
                x={geom.cx}
                y={midY + 4}
                textAnchor="middle"
                fontSize={13}
                fill="var(--text-primary)"
                className="tabular-nums"
              >
                {label}
              </text>
            </>
          )
        })()}
      </svg>

      {/* Reset the actual distance to the set (nominal) one — shown only when moved. */}
      {distanceIn !== nominalDistanceIn && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onReset}
          title="Reset to the set distance"
          className="absolute right-2 bottom-2 flex cursor-pointer items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
        >
          <FoldVertical className="size-3.5" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  )
}

interface Props {
  simulator: SimulatorSettings
  setSimulator: (patch: Partial<SimulatorSettings>) => void
  /** The viewer's own monitors, offered as a "My monitors" section in the picker. */
  monitors: Monitor[]
  unit: Unit
  theme: 'light' | 'dark'
}

export default function MonitorSimulator({ simulator, setSimulator, monitors, unit, theme }: Props) {
  const dragRef = useRef<{ startX: number; startY: number; startAngle: number; startPitch: number } | null>(
    null,
  )
  // Active pointers on the 3D view + the in-progress pinch (two fingers). A pinch
  // drives the actual eye distance; one finger rotates.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ startDist: number; startDistanceIn: number } | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  const geo = resolveSelection(simulator.selection) ?? resolveSelection(DEFAULT_SIMULATOR.selection)!
  const { widthIn, heightIn } = physical(geo)
  const myMonitors = useMemo(
    () => monitors.map((m) => ({ value: monitorSelectionToken(m), label: m.name })),
    [monitors],
  )

  // Yaw, pitch and the *actual* eye distance are ephemeral local state — never
  // persisted. The nominal distance (the input-field value) is the persisted one
  // (simulator.distanceIn); the actual distance is what the keyboard nudges and
  // what the camera uses, easing to the nominal whenever the nominal changes.
  const [headAngle, setHeadAngle] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [actualDistance, setActualDistance] = useState(simulator.distanceIn)
  const centered = headAngle === 0 && pitch === 0
  // Two fullscreen paths: the native Fullscreen API, and a CSS fallback (fixed
  // inset-0) for platforms without it — notably iOS Safari, which exposes the API
  // only on <video>. `isFullscreen` covers both, for the toggle button's state.
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [cssFullscreen, setCssFullscreen] = useState(false)
  const isFullscreen = nativeFullscreen || cssFullscreen

  // Live mirrors (read inside once-registered handlers / rAF ticks) plus "goal"
  // values that integer stepping advances from, so repeated presses reliably go
  // 1 → 2 → 3 even mid-animation.
  const yawRef = useRef(0)
  yawRef.current = headAngle
  const pitchRef = useRef(0)
  pitchRef.current = pitch
  const actualRef = useRef(actualDistance)
  actualRef.current = actualDistance
  const yawGoalRef = useRef(0)
  const distGoalRef = useRef(simulator.distanceIn)

  const headAnimRef = useRef<number | null>(null)
  const distAnimRef = useRef<number | null>(null)
  const cancelHead = useCallback(() => {
    if (headAnimRef.current !== null) {
      cancelAnimationFrame(headAnimRef.current)
      headAnimRef.current = null
    }
  }, [])
  const cancelDist = useCallback(() => {
    if (distAnimRef.current !== null) {
      cancelAnimationFrame(distAnimRef.current)
      distAnimRef.current = null
    }
  }, [])
  useEffect(() => () => {
    cancelHead()
    cancelDist()
  }, [cancelHead, cancelDist])

  // Ease yaw + pitch to a target. Yaw-key steps keep the current pitch; the
  // recenter button targets (0, 0).
  const tweenHead = useCallback(
    (toYaw: number, toPitch: number, duration: number) => {
      cancelHead()
      yawGoalRef.current = toYaw
      const fromYaw = yawRef.current
      const fromPitch = pitchRef.current
      if (fromYaw === toYaw && fromPitch === toPitch) return
      let start: number | null = null
      const tick = (now: number) => {
        if (start === null) start = now
        const t = Math.min(1, (now - start) / duration)
        const e = easeInOut(t)
        setHeadAngle(fromYaw + (toYaw - fromYaw) * e)
        setPitch(fromPitch + (toPitch - fromPitch) * e)
        if (t < 1) headAnimRef.current = requestAnimationFrame(tick)
        else {
          headAnimRef.current = null
          setHeadAngle(toYaw)
          setPitch(toPitch)
        }
      }
      headAnimRef.current = requestAnimationFrame(tick)
    },
    [cancelHead],
  )

  // Ease the actual eye distance to a target (ephemeral — never written to the store).
  const tweenDist = useCallback(
    (to: number, duration: number) => {
      cancelDist()
      distGoalRef.current = to
      const from = actualRef.current
      if (from === to) {
        setActualDistance(to)
        return
      }
      let start: number | null = null
      const tick = (now: number) => {
        if (start === null) start = now
        const t = Math.min(1, (now - start) / duration)
        setActualDistance(from + (to - from) * easeInOut(t))
        if (t < 1) distAnimRef.current = requestAnimationFrame(tick)
        else {
          distAnimRef.current = null
          setActualDistance(to)
        }
      }
      distAnimRef.current = requestAnimationFrame(tick)
    },
    [cancelDist],
  )

  // Set the actual distance immediately (no tween) — for continuous gestures
  // (pinch, trackpad zoom). Clamped to the allowed range.
  const setDistanceLive = useCallback(
    (to: number) => {
      cancelDist()
      const next = clamp(to, SIMULATOR_DISTANCE_MIN_IN, SIMULATOR_DISTANCE_MAX_IN)
      distGoalRef.current = next
      setActualDistance(next)
    },
    [cancelDist],
  )

  // When the nominal (input) distance changes, ease the actual distance to it.
  useEffect(() => {
    tweenDist(simulator.distanceIn, RECENTER_MS)
  }, [simulator.distanceIn, tweenDist])

  // Dragging the 3D view moves the *monitor*: pull it right and it follows, so the
  // camera turns left; pull it down and it follows, so you look up. Both deltas are
  // inverted relative to the gaze (horizontal is opposite the top view's drag).
  const pointerGap = () => {
    const [a, b] = Array.from(pointersRef.current.values())
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  // Direct manipulation: one dragged pixel turns the head by that pixel's own
  // angular size, so the grabbed point tracks the pointer 1:1 at any view size.
  // The camera's image plane spans 2·tan(fov/2) over the rendered height, so the
  // per-pixel angle is 2·tan(halfFovV)/height (radians). It's isotropic — the
  // camera aspect follows the element — so the same scale drives yaw and pitch.
  const dragSens = () => {
    const h = sceneRef.current?.clientHeight
    if (!h) return HEAD_DRAG_SENS
    return ((2 * TAN_HALF_FOV_V) / h) * (180 / Math.PI)
  }
  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (pointersRef.current.size >= 2) {
      // Second finger down → pinch to zoom. Drop the rotate drag so the head
      // doesn't lurch, and start from the current actual distance.
      dragRef.current = null
      pinchRef.current = { startDist: pointerGap(), startDistanceIn: actualRef.current }
    } else {
      cancelHead()
      dragRef.current = { startX: e.clientX, startY: e.clientY, startAngle: headAngle, startPitch: pitch }
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    // Pinch: fingers apart (gap grows) → zoom in → smaller eye distance.
    if (pinchRef.current && pointersRef.current.size >= 2) {
      const gap = pointerGap()
      if (gap > 0) setDistanceLive(pinchRef.current.startDistanceIn * (pinchRef.current.startDist / gap))
      return
    }
    const d = dragRef.current
    if (!d) return
    const sens = dragSens()
    const nextAngle = clamp(
      d.startAngle - (e.clientX - d.startX) * sens,
      -SIMULATOR_HEAD_ANGLE_MAX,
      SIMULATOR_HEAD_ANGLE_MAX,
    )
    const nextPitch = clamp(
      d.startPitch + (e.clientY - d.startY) * sens,
      -SIMULATOR_PITCH_MAX,
      SIMULATOR_PITCH_MAX,
    )
    yawGoalRef.current = nextAngle
    setHeadAngle(nextAngle)
    setPitch(nextPitch)
  }
  const endDrag = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 1) {
      // Lifting one finger of a pinch → resume one-finger rotation from the finger
      // still down, without jumping.
      const [pt] = Array.from(pointersRef.current.values())
      cancelHead()
      dragRef.current = { startX: pt.x, startY: pt.y, startAngle: yawRef.current, startPitch: pitchRef.current }
    } else if (pointersRef.current.size === 0) {
      dragRef.current = null
    }
  }
  const recenter = () => tweenHead(0, 0, RECENTER_MS)

  // Arrow keys, ignored while a form field is focused. ←/→ turn the head; ↑/↓
  // move the actual distance closer/farther. Each press eases to the next integer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const cur = yawGoalRef.current
        const target = e.key === 'ArrowRight' ? Math.floor(cur + EPS) + 1 : Math.ceil(cur - EPS) - 1
        tweenHead(
          clamp(target, -SIMULATOR_HEAD_ANGLE_MAX, SIMULATOR_HEAD_ANGLE_MAX),
          pitchRef.current,
          KEY_ANIM_MS,
        )
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const cur = distGoalRef.current
        const target = e.key === 'ArrowUp' ? Math.ceil(cur - EPS) - 1 : Math.floor(cur + EPS) + 1
        tweenDist(clamp(target, SIMULATOR_DISTANCE_MIN_IN, SIMULATOR_DISTANCE_MAX_IN), KEY_ANIM_MS)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tweenHead, tweenDist])

  // Full-screen the 3D scene. Prefer the native API; fall back to a CSS full-cover
  // (fixed inset-0) where it's missing or rejected, so iOS still expands the panel.
  const toggleFullscreen = useCallback(() => {
    const el = sceneRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    if (cssFullscreen) {
      setCssFullscreen(false)
      return
    }
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setCssFullscreen(true))
    } else {
      setCssFullscreen(true)
    }
  }, [cssFullscreen])
  // Track native fullscreen so the button reflects exits triggered elsewhere (the
  // OS chrome). Esc already exits native fullscreen; handle it for the CSS fallback.
  useEffect(() => {
    const onChange = () => setNativeFullscreen(document.fullscreenElement === sceneRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  useEffect(() => {
    if (!cssFullscreen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCssFullscreen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cssFullscreen])

  // Trackpad pinch arrives as a wheel event with ctrlKey set. A non-passive
  // listener is required to preventDefault (otherwise the browser page-zooms).
  // Plain scrolling (no ctrlKey) is left untouched.
  useEffect(() => {
    const el = sceneRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      // Pinch out → deltaY < 0 → zoom in → smaller eye distance.
      setDistanceLive(actualRef.current * Math.exp(e.deltaY * 0.01))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setDistanceLive])

  return (
    <section>
      <Intro>
        See how a monitor fills your vision from where you sit. Turn your head by dragging the monitor
        in the 3D view, sliding the top view below, or pressing the <kbd>←</kbd> <kbd>→</kbd> keys;
        pinch (or press <kbd>↑</kbd> <kbd>↓</kbd>) to move closer or farther.
      </Intro>

      {/* Reads "{monitor} at {n} in". The picker takes the leftover width and
          shrinks first on small screens; "at {n} in" keeps its natural size. */}
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <MonitorPicker
          value={simulator.selection}
          onChange={(id) => setSimulator({ selection: id })}
          custom={myMonitors}
          aria-label="Monitor"
          className="min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        <span className="flex-none">at</span>
        <label className="flex flex-none cursor-text items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2 py-2">
          <span className="sr-only">Eye-to-screen distance</span>
          <NumberField
            value={simulator.distanceIn}
            onCommit={(v) => v !== null && setSimulator({ distanceIn: v })}
            parse={(disp) => toInches(disp, unit)}
            format={(inches) => String(roundToUnit(inches, unit))}
            clamp={(inches) => clamp(inches, SIMULATOR_DISTANCE_MIN_IN, SIMULATOR_DISTANCE_MAX_IN)}
            min={fromInches(SIMULATOR_DISTANCE_MIN_IN, unit)}
            max={fromInches(SIMULATOR_DISTANCE_MAX_IN, unit)}
            step="any"
            inputMode="decimal"
            aria-label="Eye-to-screen distance"
            className="w-12 bg-transparent text-center tabular-nums text-[var(--text-primary)] outline-none"
          />
          <span className="text-xs text-[var(--text-secondary)]">{UNIT_LABELS[unit]}</span>
        </label>
      </div>

      {/* First-person 3D view. Fixed 3:2 (human-field proportion) so the horizontal FOV is stable.
          The CSS fallback covers the viewport (fixed inset-0) when native fullscreen is unavailable. */}
      <div
        ref={sceneRef}
        className={
          cssFullscreen
            ? 'fixed inset-0 z-50 cursor-grab touch-none overflow-hidden bg-black select-none active:cursor-grabbing'
            : 'relative aspect-[3/2] w-full cursor-grab touch-none overflow-hidden rounded-xl border border-[var(--border)] select-none active:cursor-grabbing'
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="Drag to move the monitor · pinch to zoom"
      >
        <FrontView
          widthIn={widthIn}
          heightIn={heightIn}
          curveRadius={geo.curveRadius}
          resWidth={geo.resWidth}
          resHeight={geo.resHeight}
          distanceIn={actualDistance}
          headAngle={headAngle}
          pitch={pitch}
          dark={theme === 'dark'}
        />
        {/* Full-screen toggle, top-right. */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit full screen' : 'View full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
          className="absolute top-2 right-2 flex cursor-pointer items-center rounded-md bg-black/55 p-1.5 text-white hover:bg-black/70"
        >
          {isFullscreen ? (
            <Minimize className="size-3.5" aria-hidden="true" />
          ) : (
            <Maximize className="size-3.5" aria-hidden="true" />
          )}
        </button>
        {/* Recenter control, bottom-right — shown only when the view is off-center. */}
        {!centered && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={recenter}
            title="Center the view on the screen"
            className="absolute right-2 bottom-2 flex cursor-pointer items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
          >
            <Grid2x2 className="size-3.5" aria-hidden="true" />
            Center
          </button>
        )}
      </div>

      {/* Top-down projection — also the primary head-turn control. */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <TopDown
          widthIn={widthIn}
          curveRadius={geo.curveRadius}
          distanceIn={actualDistance}
          nominalDistanceIn={simulator.distanceIn}
          headAngle={headAngle}
          unit={unit}
          onRotate={(deg) => {
            cancelHead()
            yawGoalRef.current = deg
            setHeadAngle(deg)
          }}
          onReset={() => tweenDist(simulator.distanceIn, RECENTER_MS)}
        />
        <p className="text-xs text-[var(--text-muted)]">
          <kbd>←</kbd> <kbd>→</kbd> turn your head · <kbd>↑</kbd> <kbd>↓</kbd> move closer / farther
        </p>
      </div>
    </section>
  )
}
