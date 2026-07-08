import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  DEFAULT_VIEW,
  VIEW_DISTANCE_MAX_IN,
  VIEW_DISTANCE_MIN_IN,
  VIEW_HEAD_ANGLE_MAX,
} from '../constants'
import { resolveSelection } from '../data'
import { arcPoints, physical } from '../lib/geometry'
import { formatLength, fromInches, roundToUnit, toInches, UNIT_LABELS } from '../lib/units'
import type { Unit, ViewSettings } from '../types'
import { Intro } from './Intro'
import { MonitorPicker } from './MonitorPicker'
import { NumberField } from './NumberField'

// The eye's simulated field of view. Three's camera fov is vertical; we fix the
// front-view canvas to 16:9 so the horizontal fov (what actually matters for
// "does the whole width fit?") is stable and can be mirrored in the top view.
const FOV_V_DEG = 50
const ASPECT = 16 / 9
const H_FOV_DEG = (Math.atan(Math.tan((FOV_V_DEG * Math.PI) / 360) * ASPECT) * 360) / Math.PI

// Bezel widths (inches). The bottom is a larger "chin", like a real monitor.
const BEZEL_SIDE = 0.4
const BEZEL_TOP = 0.4
const BEZEL_BOTTOM = 0.8
/** Arc tessellation for the 3D mesh — denser than the 2D top view so the curve reads smoothly. */
const MESH_SAMPLES = 72

const deg2rad = (d: number) => (d * Math.PI) / 180
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

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
  dark,
}: {
  widthIn: number
  heightIn: number
  curveRadius: number | null
  resWidth: number
  resHeight: number
  distanceIn: number
  headAngle: number
  dark: boolean
}) {
  const texture = useScreenTexture(resWidth, resHeight)
  const bg = dark ? '#0c0c0e' : '#dfe3ea'
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} frameloop="demand">
      <color attach="background" args={[bg]} />
      {/* Eye at +z looking toward the screen; head turn is a yaw about the eye. */}
      <PerspectiveCamera
        makeDefault
        fov={FOV_V_DEG}
        near={0.1}
        far={5000}
        position={[0, 0, distanceIn]}
        rotation={[0, -deg2rad(headAngle), 0]}
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
  headAngle,
  unit,
  onDistance,
}: {
  widthIn: number
  curveRadius: number | null
  distanceIn: number
  headAngle: number
  unit: Unit
  onDistance: (inches: number) => void
}) {
  const geom = useMemo(() => {
    const arc = arcPoints(widthIn, curveRadius, 48)
    const halfW = Math.max(...arc.map((p) => Math.abs(p[0])))
    const worldTop = -1
    const worldBottom = distanceIn + 3
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

    // How much of your field of view the screen actually occupies.
    const angles = arc.map(([x, depth]) => (Math.atan2(x, distanceIn - depth) * 180) / Math.PI)
    const spanDeg = Math.max(...angles) - Math.min(...angles)

    return { screen, eye, apex, left, right, center, spanDeg }
  }, [widthIn, curveRadius, distanceIn, headAngle])

  return (
    <div className="relative w-full max-w-[720px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
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
        {/* The eye. */}
        <circle cx={geom.eye.x} cy={geom.eye.y} r={7} fill="var(--series-1)" />
        <text x={geom.eye.x + 12} y={geom.eye.y + 4} fill="currentColor" fontSize={13}>
          Eyes
        </text>
        <text x={geom.apex.x} y={geom.apex.y - 8} fill="currentColor" fontSize={13} textAnchor="middle">
          Screen
        </text>
      </svg>

      {/* Distance input, centered on the projection as requested. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <label className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/95 px-2 py-1.5 shadow-sm backdrop-blur">
          <span className="sr-only">Eye-to-screen distance</span>
          <NumberField
            value={distanceIn}
            onCommit={(v) => v !== null && onDistance(v)}
            parse={(disp) => toInches(disp, unit)}
            format={(inches) => String(roundToUnit(inches, unit))}
            clamp={(inches) => clamp(inches, VIEW_DISTANCE_MIN_IN, VIEW_DISTANCE_MAX_IN)}
            min={fromInches(VIEW_DISTANCE_MIN_IN, unit)}
            max={fromInches(VIEW_DISTANCE_MAX_IN, unit)}
            step="any"
            inputMode="decimal"
            aria-label="Eye-to-screen distance"
            className="w-16 bg-transparent text-center text-sm font-semibold tabular-nums text-[var(--text-primary)] outline-none"
          />
          <span className="text-xs text-[var(--text-secondary)]">{UNIT_LABELS[unit]}</span>
        </label>
      </div>

      {/* Field-of-view readout. */}
      <div className="absolute right-2 bottom-2 rounded-md bg-[var(--surface-1)]/90 px-2 py-1 text-xs text-[var(--text-secondary)] backdrop-blur">
        Screen spans {Math.round(geom.spanDeg)}° of your {Math.round(H_FOV_DEG)}° view
      </div>
    </div>
  )
}

interface Props {
  view: ViewSettings
  setView: (patch: Partial<ViewSettings>) => void
  unit: Unit
  theme: 'light' | 'dark'
}

export default function MonitorView({ view, setView, unit, theme }: Props) {
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null)

  const geo = resolveSelection(view.selection) ?? resolveSelection(DEFAULT_VIEW.selection)!
  const { widthIn, heightIn } = physical(geo)

  // Head angle is ephemeral local state — never persisted to localStorage or the
  // URL — so it starts centered on every load and a drag/slider scrub only
  // re-renders this view, never the whole app or its storage.
  const [headAngle, setHeadAngle] = useState(0)

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startAngle: headAngle }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const next = clamp(d.startAngle + (e.clientX - d.startX) * 0.25, -VIEW_HEAD_ANGLE_MAX, VIEW_HEAD_ANGLE_MAX)
    setHeadAngle(Math.round(next))
  }
  const endDrag = () => {
    dragRef.current = null
  }

  return (
    <section>
      <Intro>
        See how a monitor fills your vision from where you sit. Pick a class or a specific model,
        set how far your eyes are from the screen, and turn your head left and right — drag across
        the 3D view or use the slider. The diagram below shows the same scene from above, with your
        field of view drawn as rays.
      </Intro>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">Monitor</span>
          <MonitorPicker
            value={geo.modelId ?? geo.classId}
            onChange={(id) => setView({ selection: id })}
            aria-label="Monitor"
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </label>
      </div>

      {/* First-person 3D view. Fixed 16:9 so the horizontal FOV is stable. */}
      <div
        className="relative aspect-video w-full cursor-ew-resize touch-none overflow-hidden rounded-xl border border-[var(--border)] select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="Drag left/right to turn your head"
      >
        <FrontView
          widthIn={widthIn}
          heightIn={heightIn}
          curveRadius={geo.curveRadius}
          resWidth={geo.resWidth}
          resHeight={geo.resHeight}
          distanceIn={view.distanceIn}
          headAngle={headAngle}
          dark={theme === 'dark'}
        />
        <div className="pointer-events-none absolute top-2 left-2 rounded-md bg-black/55 px-2 py-1 text-xs text-white">
          {geo.name}
        </div>
      </div>

      {/* Head-turn control. */}
      <div className="mt-4 flex items-center gap-3">
        <span className="w-24 text-sm font-medium text-[var(--text-primary)]">Head angle</span>
        <input
          type="range"
          min={-VIEW_HEAD_ANGLE_MAX}
          max={VIEW_HEAD_ANGLE_MAX}
          step={1}
          value={headAngle}
          onChange={(e) => setHeadAngle(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-[var(--series-1)]"
          aria-label="Head angle in degrees"
        />
        <span className="w-14 text-right text-sm tabular-nums text-[var(--text-secondary)]">
          {headAngle > 0 ? `+${headAngle}` : headAngle}°
        </span>
        <button
          type="button"
          onClick={() => setHeadAngle(0)}
          className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
        >
          Center
        </button>
      </div>

      {/* Top-down projection. */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="self-start text-sm font-semibold text-[var(--text-primary)]">Top view</h2>
        <TopDown
          widthIn={widthIn}
          curveRadius={geo.curveRadius}
          distanceIn={view.distanceIn}
          headAngle={headAngle}
          unit={unit}
          onDistance={(inches) => setView({ distanceIn: inches })}
        />
        <p className="text-xs text-[var(--text-muted)]">
          Distance {formatLength(view.distanceIn, unit)} · viewing angle{' '}
          {headAngle > 0 ? `+${headAngle}` : headAngle}°
        </p>
      </div>
    </section>
  )
}
