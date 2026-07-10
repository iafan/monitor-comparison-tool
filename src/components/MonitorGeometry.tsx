import { useCallback, useEffect, useRef, useState } from 'react'
import { Intro } from './Intro'
import { useSwipeDown } from '../hooks/useSwipeDown'
import type { VisibleAreaFrame } from '../types'

/**
 * Crosshatch geometry test card drawn at the true device resolution: a square
 * grid centered on screen (so a line runs through the exact center), two
 * circles to reveal aspect/roundness and pincushion/barrel distortion, and a
 * 1px white border hugging the very edge to check for overscan clipping.
 */
function GeometryCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      // Integer CSS dimensions (not the fractional getBoundingClientRect) so the
      // far right/bottom edge lands exactly on device pixels — otherwise the
      // outline there falls on a sub-pixel and disappears.
      const cssW = parent.clientWidth
      const cssH = parent.clientHeight
      // Skip degenerate sizes (e.g. before layout settles) — the circle radii
      // would go negative and throw; the ResizeObserver redraws once sized.
      if (cssW < 4 || cssH < 4) return
      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const lw = Math.max(1, Math.round(dpr)) // grid line ≈ 1 CSS px
      const cxf = w / 2
      const cyf = h / 2
      const cell = Math.max(8, Math.round(Math.min(w, h) / 14)) // ~14 square cells on the short side

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'

      // Grid lines stepping out from the true center in ± pairs (center drawn below).
      for (let k = 1; cxf + k * cell < w; k++) {
        ctx.fillRect(Math.round(cxf + k * cell - lw / 2), 0, lw, h)
        ctx.fillRect(Math.round(cxf - k * cell - lw / 2), 0, lw, h)
      }
      for (let k = 1; cyf + k * cell < h; k++) {
        ctx.fillRect(0, Math.round(cyf + k * cell - lw / 2), w, lw)
        ctx.fillRect(0, Math.round(cyf - k * cell - lw / 2), w, lw)
      }

      // A 1px line can't sit on the middle of an even pixel count, so widen the
      // center bar by one pixel when needed to keep equal margins on both sides
      // (2px straddling the center on an even-dimension screen, 1px on an odd one).
      const bar = (dim: number) => {
        let size = lw
        if ((dim - size) % 2 !== 0) size += 1
        return { pos: (dim - size) / 2, size }
      }
      const vb = bar(w)
      const hb = bar(h)
      ctx.fillRect(vb.pos, 0, vb.size, h)
      ctx.fillRect(0, hb.pos, w, hb.size)

      // Alignment circles: one touching the shorter-dimension sides, one touching
      // the longer-dimension sides (clipped top/bottom or left/right), and a small
      // central one — all should read as true circles if aspect and linearity are right.
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.arc(cxf, cyf, Math.min(w, h) / 2 - lw, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cxf, cyf, Math.max(w, h) / 2 - lw, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cxf, cyf, cell * 2, 0, Math.PI * 2)
      ctx.stroke()

      // Edge outline — drawn last so it stays crisp against the grid.
      ctx.fillRect(0, 0, w, lw)
      ctx.fillRect(0, h - lw, w, lw)
      ctx.fillRect(0, 0, lw, h)
      ctx.fillRect(w - lw, 0, lw, h)
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(parent)
    window.addEventListener('resize', draw)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [])

  return <canvas ref={ref} className="block" />
}

// ── Visible screen area ───────────────────────────────────────────────────────
// A 1px rounded frame the user shrinks to match how much of the panel a custom
// build (cyberdeck, art project) leaves uncovered, reading off the exact visible
// area in CSS pixels. The frame is two inclusive corners plus a corner radius;
// the full-screen default (0,0 → W-1,H-1, radius 0) is represented as null so it
// is neither stored nor put in the URL.

type Frame = VisibleAreaFrame

// Inlined Lucide icon bodies (24×24, currentColor stroke) — we don't pull in the
// whole icon package for a handful of glyphs.
const ICONS = {
  'arrow-left-to-line': '<path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/>',
  'arrow-right-to-line': '<path d="M17 12H3"/><path d="m11 18 6-6-6-6"/><path d="M21 5v14"/>',
  'arrow-up-to-line': '<path d="M5 3h14"/><path d="m18 13-6-6-6 6"/><path d="M12 7v14"/>',
  'arrow-down-to-line': '<path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/>',
  radius:
    '<path d="M20.34 17.52a10 10 0 1 0-2.82 2.82"/><circle cx="19" cy="19" r="2"/><path d="m13.41 13.41 4.18 4.18"/><circle cx="12" cy="12" r="2"/>',
  move: '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
} as const

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 flex-none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

const AREA_FIELDS = [
  { key: 'topX', label: 'Top X', icon: 'arrow-left-to-line' },
  { key: 'topY', label: 'Top Y', icon: 'arrow-up-to-line' },
  { key: 'botX', label: 'Bottom X', icon: 'arrow-right-to-line' },
  { key: 'botY', label: 'Bottom Y', icon: 'arrow-down-to-line' },
  { key: 'radius', label: 'Corner radius', icon: 'radius' },
] as const

/** Keep the frame inside the screen, top-left above/left of bottom-right, radius sane. */
function clampFrame(f: Frame, W: number, H: number): Frame {
  const botX = Math.min(Math.max(Math.round(f.botX), 0), W - 1)
  const botY = Math.min(Math.max(Math.round(f.botY), 0), H - 1)
  const topX = Math.min(Math.max(Math.round(f.topX), 0), botX)
  const topY = Math.min(Math.max(Math.round(f.topY), 0), botY)
  // The radius may exceed the box — CSS clamps it to a pill/circle when rendered —
  // so only bound it to something sane (the screen's larger side).
  const radius = Math.min(Math.max(Math.round(f.radius), 0), Math.max(W, H))
  return { topX, topY, botX, botY, radius }
}

/** The full-screen default: corners at (0,0) and (W-1,H-1), no rounding. */
function fullFrame(W: number, H: number): Frame {
  return { topX: 0, topY: 0, botX: W - 1, botY: H - 1, radius: 0 }
}

function framesEqual(a: Frame, b: Frame): boolean {
  return a.topX === b.topX && a.topY === b.topY && a.botX === b.botX && a.botY === b.botY && a.radius === b.radius
}

/** Translate the frame by (dx, dy), keeping its size and staying on screen. */
function moveFrame(f: Frame, dx: number, dy: number, W: number, H: number): Frame {
  const w = f.botX - f.topX
  const h = f.botY - f.topY
  const topX = Math.min(Math.max(f.topX + dx, 0), W - 1 - w)
  const topY = Math.min(Math.max(f.topY + dy, 0), H - 1 - h)
  return { ...f, topX, topY, botX: topX + w, botY: topY + h }
}

/** Menu indices of the "Move" and "Reset" actions (after the numeric fields). */
const MOVE_INDEX = AREA_FIELDS.length
const RESET_INDEX = MOVE_INDEX + 1
const ITEM_COUNT = RESET_INDEX + 1

interface AreaProps {
  /** Persisted frame, or null for the full-screen default. */
  value: VisibleAreaFrame | null
  onChange: (frame: VisibleAreaFrame | null) => void
  onClose: () => void
}

function VisibleAreaScreen({ value, onChange, onClose }: AreaProps) {
  const [size, setSize] = useState(() => ({ W: window.innerWidth, H: window.innerHeight }))
  const [sel, setSel] = useState(0)

  // The viewport size changes as we enter/leave fullscreen; track it so the
  // default frame and clamping follow the real screen.
  useEffect(() => {
    const sync = () => setSize({ W: window.innerWidth, H: window.innerHeight })
    window.addEventListener('resize', sync)
    document.addEventListener('fullscreenchange', sync)
    return () => {
      window.removeEventListener('resize', sync)
      document.removeEventListener('fullscreenchange', sync)
    }
  }, [])

  // Controlled: the live frame is the persisted value (or the full-screen default),
  // clamped to the current screen. Edits push back a value — or null when the frame
  // returns to the default, so it drops out of storage and the URL.
  const full = fullFrame(size.W, size.H)
  const frame = value ? clampFrame(value, size.W, size.H) : full
  const commit = useCallback(
    (next: Frame) => onChange(framesEqual(next, fullFrame(window.innerWidth, window.innerHeight)) ? null : next),
    [onChange],
  )

  // Arrows adjust the selected value (Up/Right increase, Down/Left decrease; hold
  // Shift for ×10). On the Move row they slide the whole frame. Tab cycles the
  // selection. Esc is handled by the parent.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const arrow =
        e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
      if (arrow) {
        e.preventDefault()
        if (sel === RESET_INDEX) return // Reset acts on Enter, not arrows
        const step = e.shiftKey ? 10 : 1
        if (sel === MOVE_INDEX) {
          const dx = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * step
          const dy = (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0) * step
          commit(moveFrame(frame, dx, dy, size.W, size.H))
        } else {
          const inc = e.key === 'ArrowUp' || e.key === 'ArrowRight'
          const key = AREA_FIELDS[sel].key
          commit(clampFrame({ ...frame, [key]: frame[key] + (inc ? step : -step) }, size.W, size.H))
        }
      } else if (e.key === 'Enter' && sel === RESET_INDEX) {
        e.preventDefault()
        onChange(null) // back to the full-screen default
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setSel((s) => (s + (e.shiftKey ? ITEM_COUNT - 1 : 1)) % ITEM_COUNT)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, frame, size.W, size.H, commit, onChange])

  // Inclusive corners: a 0..W-1 span is W pixels wide.
  const width = frame.botX - frame.topX + 1
  const height = frame.botY - frame.topY + 1

  return (
    <>
      {/* The 1px frame under test. */}
      <div
        className="absolute border border-white"
        style={{ left: frame.topX, top: frame.topY, width, height, borderRadius: frame.radius }}
      />
      {/* Controls, centered on screen. */}
      <div className="absolute top-1/2 left-1/2 w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 bg-black/80 p-4 text-sm text-white shadow-lg backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">Visible area</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded px-2 py-0.5 hover:bg-white/15"
            aria-label="Exit"
          >
            Esc ✕
          </button>
        </div>
        <ul>
          {AREA_FIELDS.map((f, i) => (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={i === sel}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left tabular-nums ${
                  i === sel ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Icon name={f.icon} />
                <span className="flex-1">{f.label}</span>
                <span>
                  {frame[f.key]}
                  <span className="text-white/50"> px</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSel(MOVE_INDEX)}
              aria-pressed={sel === MOVE_INDEX}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left ${
                sel === MOVE_INDEX ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <Icon name="move" />
              <span className="flex-1">Move</span>
              <span className="text-white/50">↑↓←→</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setSel(RESET_INDEX)
                onChange(null)
              }}
              aria-pressed={sel === RESET_INDEX}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left ${
                sel === RESET_INDEX ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <Icon name="rotate-ccw" />
              <span className="flex-1">Reset</span>
              <span className="text-white/50">↵ Enter</span>
            </button>
          </li>
        </ul>
        <div className="mt-2 border-t border-white/15 pt-2 text-white/70">
          <div className="mb-1 tabular-nums">
            Visible: {width} × {height} px
          </div>
          <div className="text-xs">
            {sel === RESET_INDEX
              ? 'Enter resets to full screen'
              : sel === MOVE_INDEX
                ? '↑↓←→ move frame · ⇧ ×10'
                : '↑→ increase · ↓← decrease · ⇧ ×10'}{' '}
            · Tab select
          </div>
        </div>
      </div>
    </>
  )
}

/** Small static thumbnail for the visible-area card. */
function AreaPreview() {
  return (
    <span className="relative block aspect-video w-full overflow-hidden rounded-lg border border-[var(--border)] bg-black">
      <span className="absolute border border-white" style={{ inset: '16%', borderRadius: 8 }} />
    </span>
  )
}

type Screen = 'geometry' | 'area'

interface Props {
  visibleFrame: VisibleAreaFrame | null
  setVisibleFrame: (frame: VisibleAreaFrame | null) => void
}

export function MonitorGeometry({ visibleFrame, setVisibleFrame }: Props) {
  const [active, setActive] = useState<Screen | null>(null)
  const [showHint, setShowHint] = useState(true)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const hintTimer = useRef<number | undefined>(undefined)

  const open = useCallback((screen: Screen) => {
    setActive(screen)
    surfaceRef.current?.requestFullscreen?.().catch(() => {})
  }, [])

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    setActive(null)
  }, [])

  const pokeHint = useCallback(() => {
    setShowHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setShowHint(false), 2500)
  }, [])

  const swipe = useSwipeDown({ onSwipeDown: close, enabled: active !== null })

  useEffect(() => {
    if (!active) return
    pokeHint()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) setActive(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
      window.clearTimeout(hintTimer.current)
    }
  }, [active, close, pokeHint])

  const cardClass =
    'flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 text-left'

  return (
    <section>
      <Intro>
        Full-screen patterns for checking display geometry — edges, linearity, centering, overscan,
        and how much of a panel stays visible when a custom build (a cyberdeck, an art project)
        covers part of it. Pick a card to go full screen; press <kbd>Esc</kbd> to exit.
      </Intro>

      <div className="grid max-w-[860px] gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => open('geometry')} className={cardClass}>
          <span className="relative block aspect-video w-full overflow-hidden rounded-lg border border-[var(--border)]">
            <GeometryCanvas />
          </span>
          <span className="px-1 text-sm font-semibold text-[var(--text-primary)]">Geometry test card</span>
          <span className="px-1 pb-1 text-xs text-[var(--text-muted)]">
            Crosshatch grid, circles, and edge outline
          </span>
        </button>

        <button type="button" onClick={() => open('area')} className={cardClass}>
          <AreaPreview />
          <span className="px-1 text-sm font-semibold text-[var(--text-primary)]">Visible screen area</span>
          <span className="px-1 pb-1 text-xs text-[var(--text-muted)]">
            Map the still-visible part of a panel a custom build (cyberdeck, art project) covers
          </span>
        </button>
      </div>

      {/* Fullscreen surface: always mounted so requestFullscreen has a target. */}
      <div
        ref={surfaceRef}
        onPointerMove={active ? (e) => e.pointerType === 'mouse' && pokeHint() : undefined}
        onClick={active === 'geometry' ? close : undefined}
        {...swipe}
        className={
          active ? `fixed inset-0 z-50 h-full w-full bg-black ${active === 'geometry' ? 'cursor-none' : ''}` : 'hidden'
        }
        role={active === 'geometry' ? 'img' : undefined}
        aria-label={active === 'geometry' ? 'Geometry test card' : undefined}
      >
        {active === 'geometry' && <GeometryCanvas />}
        {active === 'geometry' && (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4 transition-opacity duration-300 ${
              showHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
              <span>Geometry</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  close()
                }}
                className="cursor-pointer rounded px-2 py-1 hover:bg-white/15"
                aria-label="Exit test"
              >
                Esc ✕
              </button>
            </div>
          </div>
        )}
        {active === 'area' && (
          <VisibleAreaScreen value={visibleFrame} onChange={setVisibleFrame} onClose={close} />
        )}
      </div>
    </section>
  )
}
