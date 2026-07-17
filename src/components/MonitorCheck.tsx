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
  /** Scrolling-text screens bounce a paragraph along this axis (smearing test). */
  scroll?: Orientation
  /** Composite screens rendered by a dedicated component. */
  render?: 'gradient' | 'gamma' | 'gamut' | 'refresh'
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
  { id: 'gray', label: 'Gray', hint: 'Uniformity & backlight mura', fill: '#808080' },
  { id: 'black', label: 'Black', hint: 'Stuck (lit) pixels, backlight bleed', fill: '#000000' },
  { id: 'red', label: 'Red', hint: 'Subpixel faults, uniformity', fill: '#ff0000' },
  { id: 'green', label: 'Green', hint: 'Subpixel faults, uniformity', fill: '#00ff00' },
  { id: 'blue', label: 'Blue', hint: 'Subpixel faults, uniformity', fill: '#0000ff' },
  { id: 'vlines', label: 'Vertical lines (1px)', hint: 'Sharpness, scaling & non-native resolution', lines: 'vertical' },
  { id: 'hlines', label: 'Horizontal lines (1px)', hint: 'Sharpness, scaling & non-native resolution', lines: 'horizontal' },
  { id: 'gradient', label: 'Gradient', hint: 'Banding & color bit depth', render: 'gradient' },
  { id: 'gamma', label: 'Gamma', hint: 'Gamma accuracy (≈2.2)', render: 'gamma' },
  { id: 'gamut', label: 'Color gamut', hint: 'Wide-gamut (P3) coverage & color management', render: 'gamut' },
  { id: 'refresh', label: 'Refresh rate', hint: 'Refresh rate, stutter & tearing', render: 'refresh' },
  { id: 'scrollv', label: 'Vertical text scrolling', hint: 'Motion smearing, ghosting & slow pixel response', scroll: 'vertical' },
  { id: 'scrollh', label: 'Horizontal text scrolling', hint: 'Motion smearing, ghosting & slow pixel response', scroll: 'horizontal' },
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

/** Stepped grayscale ramp, 20 bands evenly spanning 0–255. */
const GRAD_BANDS = Array.from({ length: 20 }, (_, i) => Math.round((i / 19) * 255))

/** 10 darkest shades (0, 2, …, 18) — isolates black-crush and low-end banding. */
const GRAD_DARK = Array.from({ length: 10 }, (_, i) => i * 2)

/** 10 brightest shades (237, 239, …, 255) — isolates white-clip and high-end banding. */
const GRAD_LIGHT = Array.from({ length: 10 }, (_, i) => 237 + i * 2)

/** Fully-saturated hue (HSL s=100%, l=50%) → its RGB components in 0..1. */
function hueToRgb(h: number): [number, number, number] {
  const x = 1 - Math.abs(((h / 60) % 2) - 1)
  const table: [number, number, number][] = [
    [1, x, 0],
    [x, 1, 0],
    [0, 1, x],
    [0, x, 1],
    [x, 0, 1],
    [1, 0, x],
  ]
  return table[Math.floor(h / 60) % 6]
}

// 36 hues around the wheel, each as an sRGB fill and the SAME nominal components
// fed to Display P3. Identical numbers, wider primaries: on a colour-managed
// wide-gamut panel the P3 band is visibly more saturated; on an sRGB panel P3 is
// clamped and the two bands match — which is exactly the read on the display.
const GAMUT_HUES = Array.from({ length: 36 }, (_, i) => {
  const [r, g, b] = hueToRgb(i * 10)
  return {
    srgb: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
    p3: `color(display-p3 ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)})`,
  }
})

// Masks the cross-gamut reference overlay down to 2px sampling lines every 20px.
// Each half anchors its mask to the centre seam and places the line at the far end
// of each 20px cell, so the seam stays clear and the first line sits ~20px away on
// both sides. The top half's seam is its bottom edge (tile upward, `to top`); the
// bottom half's seam is its top edge (tile downward, `to bottom`).
const GAMUT_LINE_MASK_TOP = 'repeating-linear-gradient(to top, transparent 0, transparent 18px, #000 18px, #000 20px)'
const GAMUT_LINE_MASK_BOTTOM = 'repeating-linear-gradient(to bottom, transparent 0, transparent 18px, #000 18px, #000 20px)'

// Real copy about panel smearing (a paragraph for the vertical screen, a shorter
// line for the horizontal one): high-contrast moving edges make trailing smears
// from slow pixel response easy to spot, and the text itself explains what to look
// for on each panel type.
const SMEAR_TEXT =
  'Watch the moving edges for trailing smears. VA panels suffer the most, especially ' +
  'in dark scenes — their slow gray-to-gray transitions leave a murky black smear ' +
  'behind fast-moving shadows. IPS panels switch faster and more evenly, so motion ' +
  'stays clearer, though aggressive overdrive can add a pale inverse-ghost outline. ' +
  'OLED pixels change in microseconds, all but eliminating smear; any blur you still ' +
  'see is sample-and-hold persistence, not slow response. If these letters trail or ' +
  'ghost as they scroll, that is your panel’s real motion clarity.'
const SMEAR_LINE = 'VA smears in the dark · IPS stays clean · OLED switches instantly'
// The vertical screen renders SMEAR_COLS side-by-side columns of the paragraph; the
// horizontal screen SMEAR_ROWS stacked copies of the line — each a single shade
// ramping dark→white, centred as a block (so the middle copy sits at the centre).
const SMEAR_COLS = 3
const SMEAR_ROWS = 5

/** Gray value for copy `i` of `n`, ramping from dark gray (48) to white (255). */
function smearShade(i: number, n: number): number {
  return Math.round(48 + (255 - 48) * (i / (n - 1)))
}

// Ease-in-out bounce duration scales with travel so the mid-travel speed (where
// smearing shows most) stays roughly constant across screen sizes.
const SCROLL_MS_PER_PX = 2.2

// Supersample factor for the CSS-resolution stripes. At a fractional device-pixel
// ratio, back the canvas at ceil(dpr)× CSS size and display at CSS size, so the
// browser MINIFIES the big bitmap to the device grid — a WebRender path that
// renders the fine pattern cleanly, unlike magnifying it (which glitches at
// fractional ratios on some Firefox/Linux/GPU combos). At an INTEGER ratio the
// upscale aligns exactly to the device grid and never glitches, so skip the
// supersample entirely (1×) and let it magnify — crisp, and a smaller canvas.
const stripeSupersample = (): number => {
  const dpr = window.devicePixelRatio || 1
  return Number.isInteger(dpr) ? 1 : Math.ceil(dpr)
}

/**
 * Paints alternating 1-pixel black/white stripes on a canvas. By default the
 * canvas is backed at the true device resolution, so on HiDPI panels the lines
 * are genuinely 1 device pixel wide. With `cssResolution`, the canvas is backed
 * at ceil(dpr)× the CSS resolution (stripes that many px wide) and displayed at
 * CSS size, so the browser downsamples it to the physical grid — dodging a
 * Firefox/WebRender fractional-ratio artifact seen when magnifying the pattern.
 */
function StripeCanvas({ orientation, cssResolution = false }: { orientation: Orientation; cssResolution?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = parent.getBoundingClientRect()
      if (cssResolution) {
        // Supersample only the stripe axis; the uniform axis stays 1:1 in CSS px.
        const vertical = orientation === 'vertical'
        const cssW = Math.max(1, Math.round(rect.width))
        const cssH = Math.max(1, Math.round(rect.height))
        const s = stripeSupersample()
        const w = vertical ? cssW * s : cssW
        const h = vertical ? cssH : cssH * s
        canvas.width = w
        canvas.height = h
        canvas.style.width = `${cssW}px`
        canvas.style.height = `${cssH}px`
        canvas.style.imageRendering = 'auto' // smooth minification (the point)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#000'
        if (vertical) {
          for (let x = 0; x < w; x += 2 * s) ctx.fillRect(x, 0, s, h)
        } else {
          for (let y = 0; y < h; y += 2 * s) ctx.fillRect(0, y, w, s)
        }
      } else {
        const dpr = window.devicePixelRatio || 1
        const w = Math.max(1, Math.round(rect.width * dpr))
        const h = Math.max(1, Math.round(rect.height * dpr))
        canvas.width = w
        canvas.height = h
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        canvas.style.imageRendering = 'auto'
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#000'
        if (orientation === 'vertical') {
          for (let x = 0; x < w; x += 2) ctx.fillRect(x, 0, 1, h)
        } else {
          for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1)
        }
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
  }, [orientation, cssResolution])

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
  // Surface the device-pixel ratio when it isn't 1 — a non-integer ratio is why
  // the CSS-px stripes can't map cleanly to physical pixels.
  const dpr = window.devicePixelRatio || 1
  const cssLabel = dpr === 1 ? 'CSS px' : `CSS px (ratio = ${Math.round(dpr * 1000) / 1000})`
  return (
    <div className={`flex h-full w-full ${stack ? 'flex-col' : 'flex-row'}`}>
      <div className="relative flex-1 overflow-hidden bg-white">
        <StripeCanvas orientation={orientation} cssResolution />
        <HalfLabel text={cssLabel} show={showLabels} />
      </div>
      {/* 1px divider between the two halves — horizontal when stacked, vertical when side-by-side. */}
      <div className={`flex-none bg-black ${stack ? 'h-px w-full' : 'h-full w-px'}`} />
      <div className="relative flex-1 overflow-hidden bg-white">
        <StripeCanvas orientation={orientation} />
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

/**
 * Wide-gamut vs sRGB: 36 fully-saturated hues from the colour wheel, shown in
 * sRGB (top half) and the identical nominal values in Display P3 (bottom half).
 * Each band peaks at full saturation on the centre seam where the halves meet
 * and fades to black at the outer screen edge — the P3 fade stays in P3 (so its
 * extra saturation shows across the whole band, not just at the seam). On a
 * colour-managed wide-gamut panel the P3 band is noticeably more saturated; on
 * an sRGB panel P3 is clamped and the halves look the same.
 */
function GamutScreen({ showLabels }: { showLabels: boolean }) {
  const centerLabel = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
  return (
    <div className="flex h-full w-full flex-col">
      {/* Top: black at the screen edge → full colour at the seam below. Carries
          2px P3 reference lines (the mirror of the wide-gamut band's sRGB lines),
          so each half shows the other gamut sampled along its full luminance. */}
      <div className="relative flex flex-1">
        {GAMUT_HUES.map((h, i) => (
          <div
            key={i}
            className="relative flex-1"
            style={{ background: `linear-gradient(to bottom in srgb, #000, ${h.srgb})` }}
          >
            <div
              className="absolute inset-y-0 left-[20%] right-[20%]"
              style={{
                background: `linear-gradient(to bottom in display-p3, color(display-p3 0 0 0), ${h.p3})`,
                WebkitMaskImage: GAMUT_LINE_MASK_TOP,
                maskImage: GAMUT_LINE_MASK_TOP,
              }}
            />
          </div>
        ))}
        <OverlayLabel className={centerLabel} show={showLabels}>
          sRGB
        </OverlayLabel>
      </div>
      {/* Bottom: full colour at the seam above → black at the screen edge. Each
          band carries 2px sRGB reference lines (every 20px) from the matching
          sRGB→black gradient, so the P3-vs-sRGB gap is visible at every luminance,
          not only at peak saturation. */}
      <div className="relative flex flex-1">
        {GAMUT_HUES.map((h, i) => (
          <div
            key={i}
            className="relative flex-1"
            style={{ background: `linear-gradient(to bottom in display-p3, ${h.p3}, color(display-p3 0 0 0))` }}
          >
            <div
              className="absolute inset-y-0 left-[20%] right-[20%]"
              style={{
                background: `linear-gradient(to bottom in srgb, ${h.srgb}, #000)`,
                WebkitMaskImage: GAMUT_LINE_MASK_BOTTOM,
                maskImage: GAMUT_LINE_MASK_BOTTOM,
              }}
            />
          </div>
        ))}
        <OverlayLabel className={centerLabel} show={showLabels}>
          Wide-gamut
        </OverlayLabel>
      </div>
    </div>
  )
}

/** 1px stripes with a centered ~73% gray patch that vanishes at correct gamma. */
function GammaScreen() {
  return (
    <div className="relative h-full w-full bg-white">
      <StripeCanvas orientation="vertical" />
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
 * Centered text that eases up/down (or left/right) to expose motion smearing and
 * ghosting: trailing edges behind moving high-contrast text reveal slow pixel
 * response and overdrive artifacts. Uses the Web Animations API with an
 * ease-in-out, alternating bounce around the centered rest position — watch the
 * fast mid-travel, where smearing peaks. The bounce always covers a good slice
 * of the surface (so it moves even when the text fits), and grows to reveal the
 * whole text when it overflows. Travel is re-measured on resize.
 *
 * Sizes in container-query units (cqh/cqw) so the exact same render is a true
 * miniature in the tile grid; `animate` is off there (the tile is a still frame,
 * like the other cards), on for the live full-screen surface.
 */
function ScrollTextScreen({ orientation, animate = true }: { orientation: Orientation; animate?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const vertical = orientation === 'vertical'

  useEffect(() => {
    if (!animate) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    let anim: Animation | undefined
    const start = () => {
      anim?.cancel()
      const extent = vertical ? container.clientHeight : container.clientWidth
      const overflow = vertical
        ? content.scrollHeight - container.clientHeight
        : content.scrollWidth - container.clientWidth
      // Bounce symmetrically about the centered rest position. Travel is at least
      // ~40% of the surface so the text always visibly moves, and half the
      // overflow when larger, so an over-tall/-wide block scrolls fully into view.
      const travel = Math.max(extent * 0.4, overflow / 2)
      if (travel <= 0) return
      const axis = vertical ? 'Y' : 'X'
      anim = content.animate(
        [{ transform: `translate${axis}(${travel}px)` }, { transform: `translate${axis}(${-travel}px)` }],
        {
          duration: Math.max(2000, travel * 2 * SCROLL_MS_PER_PX),
          direction: 'alternate',
          iterations: Infinity,
          easing: 'ease-in-out',
        },
      )
    }

    start()
    const ro = new ResizeObserver(start)
    ro.observe(container)
    return () => {
      ro.disconnect()
      anim?.cancel()
    }
  }, [vertical, animate])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-black [container-type:size]"
    >
      <div
        ref={contentRef}
        className={
          vertical
            ? 'flex gap-[4cqw] text-[3.6cqh] leading-[1.3] font-semibold will-change-transform'
            : 'flex flex-col px-[6cqw] text-[11cqh] leading-[1.25] font-semibold will-change-transform'
        }
      >
        {Array.from({ length: vertical ? SMEAR_COLS : SMEAR_ROWS }, (_, i) => {
          const v = smearShade(i, vertical ? SMEAR_COLS : SMEAR_ROWS)
          return vertical ? (
            <div key={i} className="w-[22cqw] text-left" style={{ color: `rgb(${v}, ${v}, ${v})` }}>
              {SMEAR_TEXT}
            </div>
          ) : (
            <div key={i} className="whitespace-nowrap" style={{ color: `rgb(${v}, ${v}, ${v})` }}>
              {SMEAR_LINE}
            </div>
          )
        })}
      </div>
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
  if (pattern.scroll) return <ScrollTextScreen orientation={pattern.scroll} animate={live} />
  if (pattern.render === 'gradient') return <GradientScreen showLabels={live} />
  if (pattern.render === 'gamut') return <GamutScreen showLabels={live} />
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
              className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 text-left"
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
