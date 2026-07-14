import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Intro } from './Intro'
import { OverlayLabel } from './ui/OverlayLabel'
import { useSwipeDown } from '../hooks/useSwipeDown'

type Orientation = 'vertical' | 'horizontal'

interface Pattern {
  id: string
  label: string
  hint: string
  /** Solid-fill patterns set a color. */
  fill?: string
  /** Line patterns render a split CSS-px vs device-px comparison instead. */
  lines?: Orientation
  /** Composite screens rendered by a dedicated component. */
  render?: 'gradient' | 'gamma' | 'refresh'
}

/**
 * 1px black/white stripes average to 50% of white's *physical* luminance.
 * Under sRGB gamma (~2.2) the solid gray emitting that luminance is ~188/255,
 * not 128 — so a patch of this value melts into the stripes only when the
 * display's gamma is correct. That's what makes it a gamma check.
 */
const GAMMA_PATCH = '#bcbcbc'

const PATTERNS: Pattern[] = [
  { id: 'white', label: 'White', hint: 'Dead/stuck pixels, backlight bleed, dust', fill: '#ffffff' },
  { id: 'black', label: 'Black', hint: 'Stuck (lit) pixels, backlight bleed', fill: '#000000' },
  { id: 'red', label: 'Red', hint: 'Subpixel faults, uniformity', fill: '#ff0000' },
  { id: 'green', label: 'Green', hint: 'Subpixel faults, uniformity', fill: '#00ff00' },
  { id: 'blue', label: 'Blue', hint: 'Subpixel faults, uniformity', fill: '#0000ff' },
  { id: 'vlines', label: 'Vertical lines (1px)', hint: 'CSS px vs device px — top / bottom', lines: 'vertical' },
  { id: 'hlines', label: 'Horizontal lines (1px)', hint: 'CSS px vs device px — left / right', lines: 'horizontal' },
  { id: 'gradient', label: 'Gradient', hint: 'Banding & bit depth — dark/light shades, stepped & smooth', render: 'gradient' },
  { id: 'gamma', label: 'Gamma', hint: 'Patch melts into stripes at correct gamma', render: 'gamma' },
  { id: 'refresh', label: 'Refresh rate', hint: 'Measured Hz; watch the box for stutter', render: 'refresh' },
]

// The bouncing box advances a FIXED number of pixels per frame (not per second),
// so a faster refresh rate renders more frames/sec and the box visibly bounces
// faster — its speed itself reveals the rate. Range is the formula-derived travel:
//   trackWidth − 2·(border + gap) − boxWidth = 200 − 2·(1 + 1) − 20 = 176px.
const BOUNCE_STEP = 1 // px per frame
const BOUNCE_MAX = 176 // px of travel

/** Common panel refresh rates; the measured value snaps to the nearest one when close. */
const COMMON_RATES = [50, 60, 75, 90, 100, 120, 144, 160, 165, 175, 180, 200, 240, 360]

function snapRate(hz: number): number {
  let best = COMMON_RATES[0]
  for (const r of COMMON_RATES) if (Math.abs(r - hz) < Math.abs(best - hz)) best = r
  return Math.abs(best - hz) / best <= 0.06 ? best : Math.round(hz)
}

/** CSS-pixel repeating stripes: 1px black, 1px white. */
function cssStripes(orientation: Orientation): string {
  const dir = orientation === 'vertical' ? 'to right' : 'to bottom'
  return `repeating-linear-gradient(${dir}, #000, #000 1px, #fff 1px, #fff 2px)`
}

/** Stepped grayscale ramp, 20 bands evenly spanning 0–255. */
const GRAD_BANDS = Array.from({ length: 20 }, (_, i) => Math.round((i / 19) * 255))

/** 10 darkest shades (0, 2, …, 18) — isolates black-crush and low-end banding. */
const GRAD_DARK = Array.from({ length: 10 }, (_, i) => i * 2)

/** 10 brightest shades (237, 239, …, 255) — isolates white-clip and high-end banding. */
const GRAD_LIGHT = Array.from({ length: 10 }, (_, i) => 237 + i * 2)

/**
 * Paints alternating 1-device-pixel stripes on a canvas backed at the true
 * device resolution, so on HiDPI panels these are genuinely 1px wide (unlike
 * the CSS gradient, where 1 CSS px spans devicePixelRatio device pixels).
 */
function DeviceStripes({ orientation }: { orientation: Orientation }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = parent.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#000'
      if (orientation === 'vertical') {
        for (let x = 0; x < w; x += 2) ctx.fillRect(x, 0, 1, h)
      } else {
        for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(parent)
    window.addEventListener('resize', draw)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [orientation])

  return <canvas ref={ref} className="block" />
}

function HalfLabel({ text, show }: { text: string; show: boolean }) {
  return (
    <OverlayLabel show={show} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {text}
    </OverlayLabel>
  )
}

/** Splits the surface in two: CSS-px stripes vs true device-px stripes. */
function SplitStripes({ orientation, showLabels }: { orientation: Orientation; showLabels: boolean }) {
  // Vertical lines split top/bottom (stacked); horizontal lines split left/right.
  const stack = orientation === 'vertical'
  return (
    <div className={`flex h-full w-full ${stack ? 'flex-col' : 'flex-row'}`}>
      <div className="relative flex-1 overflow-hidden" style={{ background: cssStripes(orientation) }}>
        <HalfLabel text="CSS px" show={showLabels} />
      </div>
      {/* 1px divider between the two halves — horizontal when stacked, vertical when side-by-side. */}
      <div className={`flex-none bg-black ${stack ? 'h-px w-full' : 'h-full w-px'}`} />
      <div className="relative flex-1 overflow-hidden bg-white">
        <DeviceStripes orientation={orientation} />
        <HalfLabel text="Device px" show={showLabels} />
      </div>
    </div>
  )
}

/** A strip of discrete grayscale bands, each labelled with its 0–255 value. */
function DiscreteBands({ values, showLabels }: { values: number[]; showLabels: boolean }) {
  return (
    <div className="flex flex-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex flex-1 items-center justify-center overflow-hidden"
          style={{ background: `rgb(${v}, ${v}, ${v})` }}
        >
          <OverlayLabel show={showLabels}>{v}</OverlayLabel>
        </div>
      ))}
    </div>
  )
}

/**
 * Four stacked strips for banding / bit-depth checks:
 *  1. 10 darkest shades (0–18, step 2) — black-crush & low-end banding
 *  2. 10 brightest shades (237–255, step 2) — white-clip & high-end banding
 *  3. 21-step grayscale ramp (0–255 in 5% steps)
 *  4. smooth dark-to-white gradient (full bit depth)
 * The three discrete strips label every shade with its 0–255 value.
 */
function GradientScreen({ showLabels }: { showLabels: boolean }) {
  return (
    <div className="flex h-full w-full flex-col">
      <DiscreteBands values={GRAD_DARK} showLabels={showLabels} />
      <DiscreteBands values={GRAD_LIGHT} showLabels={showLabels} />
      <DiscreteBands values={GRAD_BANDS} showLabels={showLabels} />
      <div className="flex-1" style={{ background: 'linear-gradient(to right, #000, #fff)' }} />
    </div>
  )
}

/** 1px stripes with a centered ~73% gray patch that vanishes at correct gamma. */
function GammaScreen() {
  return (
    <div className="relative h-full w-full bg-white">
      <DeviceStripes orientation="vertical" />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '25%', height: '25%', background: GAMMA_PATCH }}
      />
    </div>
  )
}

/**
 * Live refresh-rate readout. There's no API for a panel's true Hz, so we time
 * requestAnimationFrame (driven by the compositor's VSync): the frame interval
 * tracks the display's refresh rate. We report the median over a rolling window
 * (robust to hitches) and update ~4×/s so the number stays readable. The bar
 * sweeps via CSS so it stays smooth independent of React, letting you eyeball
 * stutter and tearing.
 */
function RefreshRateScreen() {
  const [hz, setHz] = useState<number | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const deltas: number[] = []
    let last: number | null = null
    let lastUi = 0
    let pos = 0
    let dir = 1
    let raf = requestAnimationFrame(function loop(t) {
      if (last !== null) {
        const dt = t - last
        if (dt > 0 && dt < 1000) {
          deltas.push(dt)
          if (deltas.length > 240) deltas.shift()
        }
      }
      last = t

      // Advance a fixed step each frame, reversing at the ends — frame-paced, so
      // the bounce runs faster on higher-refresh displays.
      pos += BOUNCE_STEP * dir
      if (pos >= BOUNCE_MAX) {
        pos = BOUNCE_MAX
        dir = -1
      } else if (pos <= 0) {
        pos = 0
        dir = 1
      }
      if (boxRef.current) boxRef.current.style.transform = `translateX(${pos}px)`

      if (deltas.length > 8 && t - lastUi > 250) {
        const sorted = [...deltas].sort((a, b) => a - b)
        const med = sorted[Math.floor(sorted.length / 2)]
        setHz(1000 / med)
        lastUi = t
      }
      raf = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black text-white">
      <div className="text-center tabular-nums">
        <div className="text-[9vw] leading-none font-medium">{hz !== null ? `${snapRate(hz)}Hz` : '—'}</div>
        <div className="mt-[2vh] text-[2.6vw] text-white/60">
          {hz !== null ? `As measured: ${hz.toFixed(1)}Hz` : 'measuring…'}
        </div>
        {/* A white box bouncing inside a fixed 200px bordered track (1px gap all
            around). Frame-paced in the rAF loop above — faster refresh, faster bounce. */}
        <div className="relative mx-auto mt-[4vh] h-[24px] w-[200px] overflow-hidden rounded-[2px] border border-white">
          <div ref={boxRef} className="absolute top-[1px] left-[1px] h-[20px] w-[20px] bg-white will-change-transform" />
        </div>
      </div>
    </div>
  )
}

/** Static miniature of the refresh-rate screen for the tile (no measurement loop). */
function RefreshRatePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black">
      <span className="text-lg font-medium text-white">60Hz</span>
      <span className="relative block h-2.5 w-20 overflow-hidden rounded-[2px] border border-white">
        <span className="absolute top-1/2 left-[3px] h-1.5 w-1.5 -translate-y-1/2 bg-white" />
      </span>
    </div>
  )
}

/**
 * The single renderer for a pattern, used by both the preview tile and the
 * full-screen surface — it fills whatever container it's in, so the tile is a
 * true miniature screen (no scaling), not a separate approximation. `live`
 * enables the refresh screen's measurement loop (off for the tile grid).
 */
function PatternContent({ pattern, live = false }: { pattern: Pattern; live?: boolean }) {
  if (pattern.fill) return <div className="h-full w-full" style={{ background: pattern.fill }} />
  // Labels stay on for the whole live view (not tied to the auto-hiding hint); the
  // tile-grid thumbnails pass live=false, so they render label-free.
  if (pattern.lines) return <SplitStripes orientation={pattern.lines} showLabels={live} />
  if (pattern.render === 'gradient') return <GradientScreen showLabels={live} />
  if (pattern.render === 'gamma') return <GammaScreen />
  if (pattern.render === 'refresh') return live ? <RefreshRateScreen /> : <RefreshRatePreview />
  return null
}

/**
 * Shared pill styling for every on-screen-display element (the top bar and the
 * two nav buttons): plain semi-transparent black, matching the in-pattern labels.
 */
const OSD_PILL = 'rounded-full border border-white/20 bg-black/70 text-white shadow-lg'

/**
 * An interactive OSD control. The hover highlight is a dedicated white overlay
 * layer (via group-hover) painted on top of the dark fill — NOT a translucent
 * `hover:bg-*`, which would overwrite the base color and let the test pattern
 * behind bleed through, so the button reads identically over any screen.
 */
function OsdButton({
  onClick,
  label,
  className = '',
  children,
}: {
  onClick: (e: MouseEvent) => void
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group pointer-events-auto cursor-pointer overflow-hidden ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-150 group-hover:bg-white/15" />
      <span className="relative flex items-center justify-center gap-1">{children}</span>
    </button>
  )
}

interface Props {
  /** Selected screen id (from the URL/app state), or null for the tile grid. */
  screen: string | null
  setScreen: (screen: string | null) => void
}

export function MonitorCheck({ screen, setScreen }: Props) {
  const [showHint, setShowHint] = useState(true)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const hintTimer = useRef<number | undefined>(undefined)

  // Derive the active index from the selected screen id (−1/invalid ⇒ none).
  const idx = screen ? PATTERNS.findIndex((p) => p.id === screen) : -1
  const active = idx >= 0 ? idx : null

  const open = useCallback(
    (index: number) => {
      setScreen(PATTERNS[index].id)
      surfaceRef.current?.requestFullscreen?.().catch(() => {})
    },
    [setScreen],
  )

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    setScreen(null)
  }, [setScreen])

  const step = useCallback(
    (delta: number) => {
      if (active === null) return
      setScreen(PATTERNS[(active + delta + PATTERNS.length) % PATTERNS.length].id)
    },
    [active, setScreen],
  )

  // Reveal the OSD (top bar + side arrows) and arm the auto-hide timer. Used by
  // pointer movement, keyboard nav, and on open — navigation happens via the
  // arrow buttons, so a stray poke never jumps screens.
  const pokeHint = useCallback(() => {
    setShowHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setShowHint(false), 2500)
  }, [])

  // A tap/click on the surface toggles the OSD: one tap brings it up (and arms
  // the auto-hide), another dismisses it immediately.
  const toggleHint = useCallback(() => {
    window.clearTimeout(hintTimer.current)
    setShowHint((visible) => {
      if (visible) return false
      hintTimer.current = window.setTimeout(() => setShowHint(false), 2500)
      return true
    })
  }, [])

  const swipe = useSwipeDown({ onSwipeDown: close, enabled: active !== null })

  useEffect(() => {
    if (active === null) return
    pokeHint()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        step(1)
        pokeHint()
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        step(-1)
        pokeHint()
      }
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) setScreen(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
      window.clearTimeout(hintTimer.current)
    }
  }, [active, close, step, pokeHint, setScreen])

  const current = active === null ? null : PATTERNS[active]

  return (
    <section>
      <Intro>
        Full-screen test patterns for spotting dead pixels, backlight bleed, and uniformity issues.
        Pick a pattern to begin — then tap the screen to reveal the controls, use the on-screen
        arrows or <kbd>←</kbd>/<kbd>→</kbd> to move between screens, and <kbd>Esc</kbd> to exit.
      </Intro>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PATTERNS.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 text-left"
            >
              <span
                className={`relative block h-20 w-full overflow-hidden rounded-lg ${
                  p.fill ? 'border border-[var(--border)]' : ''
                }`}
                aria-hidden="true"
              >
                <PatternContent pattern={p} />
              </span>
              <span className="px-1 text-sm font-semibold text-[var(--text-primary)]">{p.label}</span>
              <span className="px-1 pb-1 text-xs text-[var(--text-muted)]">{p.hint}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Fullscreen surface: always mounted so requestFullscreen has a target. */}
      <div
        ref={surfaceRef}
        // Mouse movement reveals the OSD (desktop); guard on pointerType so the
        // synthetic mouse events a tap emits don't fight the tap-to-toggle below.
        onPointerMove={active !== null ? (e) => e.pointerType === 'mouse' && pokeHint() : undefined}
        onClick={active !== null ? toggleHint : undefined}
        {...swipe}
        className={
          active === null
            ? 'hidden'
            : `fixed inset-0 z-50 h-full w-full bg-black ${showHint ? '' : 'cursor-none'}`
        }
        role={active !== null ? 'img' : undefined}
        aria-label={current ? `${current.label} test pattern` : undefined}
      >
        {active !== null && current && <PatternContent pattern={current} live />}

        {active !== null && (
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              showHint ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!showHint}
          >
            {/* Top OSD bar */}
            <div className="absolute inset-x-0 top-0 flex justify-center p-4">
              <div className={`pointer-events-auto flex items-center gap-3 px-4 py-2 text-sm ${OSD_PILL}`}>
                <span className="tabular-nums">
                  {active + 1} / {PATTERNS.length} · {current?.label}
                </span>
                <OsdButton
                  onClick={(e) => {
                    e.stopPropagation()
                    close()
                  }}
                  label="Exit test"
                  className="relative ml-1 rounded px-2 py-1"
                >
                  Esc <X className="size-3.5" aria-hidden="true" />
                </OsdButton>
              </div>
            </div>

            {/* Previous — vertically centered on the left edge */}
            <OsdButton
              onClick={(e) => {
                e.stopPropagation()
                step(-1)
                pokeHint()
              }}
              label="Previous pattern"
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 ${OSD_PILL}`}
            >
              <ArrowLeft className="h-6 w-6" />
            </OsdButton>

            {/* Next — vertically centered on the right edge */}
            <OsdButton
              onClick={(e) => {
                e.stopPropagation()
                step(1)
                pokeHint()
              }}
              label="Next pattern"
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 ${OSD_PILL}`}
            >
              <ArrowRight className="h-6 w-6" />
            </OsdButton>
          </div>
        )}
      </div>
    </section>
  )
}
