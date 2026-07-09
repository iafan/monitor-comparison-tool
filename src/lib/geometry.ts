import type { Monitor } from '../types'

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// The aspect ratios monitors are actually marketed by.
//
// `exactOnly` ratios are used only when the panel's reduced fraction equals them
// exactly — never as a nearest approximation. This is essential for 24:10 (=12:5,
// e.g. 3840×1600): by decimal it sits *between* the 21:9 ultrawides (43:18≈2.389,
// 64:27≈2.370) and would steal their match, yet those are marketed 21:9, not
// 24:10. Matching exact fractions first, then nearest among the non-exact-only
// ratios, keeps 3840×1600 → "24:10" while 43:18/64:27 stay "21:9".
const MARKETING_RATIOS: { label: string; w: number; h: number; exactOnly?: boolean }[] = [
  { label: '1:1', w: 1, h: 1 },
  { label: '5:4', w: 5, h: 4 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:2', w: 3, h: 2 },
  { label: '16:10', w: 16, h: 10 },
  { label: '16:9', w: 16, h: 9 },
  { label: '21:9', w: 21, h: 9 },
  { label: '24:10', w: 24, h: 10, exactOnly: true },
  { label: '32:10', w: 32, h: 10 },
  { label: '32:9', w: 32, h: 9 },
]

// How far (relative) the real ratio may sit from a marketing ratio before we give
// up and just show the exact reduction. Generous enough to catch the ultrawides
// (43:18 and 64:27 are ~2% from 21:9), tight enough to reject unrelated shapes.
const RATIO_TOLERANCE = 0.06

/**
 * A human aspect-ratio label. Reduces the resolution to lowest terms, then: an
 * exact marketing match shows just the label ("16:10", "24:10"); a near match
 * shows marketing plus the real reduction ("21:9 (43:18)"); anything else falls
 * back to the plain reduction.
 */
export function aspectRatioLabel(resWidth: number, resHeight: number): string {
  const g = gcd(resWidth, resHeight) || 1
  const real = `${resWidth / g}:${resHeight / g}`
  const value = resWidth / resHeight

  // Exact fraction match wins outright (includes exact-only ratios like 24:10).
  const exact = MARKETING_RATIOS.find((m) => m.w * resHeight === m.h * resWidth)
  if (exact) return exact.label

  // Otherwise the nearest "family" ratio, ignoring exact-only ones.
  let best: (typeof MARKETING_RATIOS)[number] | null = null
  let bestDiff = Infinity
  for (const m of MARKETING_RATIOS) {
    if (m.exactOnly) continue
    const diff = Math.abs(value - m.w / m.h)
    if (diff < bestDiff) {
      bestDiff = diff
      best = m
    }
  }
  if (best && bestDiff / (best.w / best.h) <= RATIO_TOLERANCE) return `${best.label} (${real})`
  return real
}

export interface Physical {
  /** Physical panel width in inches. */
  widthIn: number
  /** Physical panel height in inches. */
  heightIn: number
  /** Pixels per inch. */
  ppi: number
  /** Dot (pixel) pitch in millimeters. */
  pitchMm: number
  /** Aspect-ratio label: marketing ratio, with the exact reduction when they differ. */
  ratio: string
}

/**
 * Samples a monitor's screen arc in physical inches, apex (the screen's
 * horizontal center, farthest from the viewer) at (0,0) and the arc bowing
 * toward +y — i.e. toward the viewer, so the two ends sit at +y depth. A flat
 * panel returns just its two end points. Shared by the top-down comparison view
 * and the 3D viewer, so both derive curvature the same way.
 */
export function arcPoints(
  widthIn: number,
  curveRadius: number | null,
  samples = 48,
): [number, number][] {
  if (!curveRadius || curveRadius <= 0) {
    return [
      [-widthIn / 2, 0],
      [widthIn / 2, 0],
    ]
  }
  const radiusIn = curveRadius / 25.4
  const theta = widthIn / radiusIn
  const points: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const beta = -theta / 2 + (theta * i) / samples
    points.push([radiusIn * Math.sin(beta), radiusIn * (1 - Math.cos(beta))])
  }
  return points
}

/** Derives physical panel dimensions from resolution + diagonal size. */
export function physical(m: Pick<Monitor, 'resWidth' | 'resHeight' | 'diagonal'>): Physical {
  const diagPx = Math.sqrt(m.resWidth ** 2 + m.resHeight ** 2)
  const widthIn = m.diagonal * (m.resWidth / diagPx)
  const heightIn = m.diagonal * (m.resHeight / diagPx)
  const ppi = diagPx / m.diagonal
  const pitchMm = 25.4 / ppi
  const ratio = aspectRatioLabel(m.resWidth, m.resHeight)
  return { widthIn, heightIn, ppi, pitchMm, ratio }
}

/**
 * Stable display order: largest physical panel area first, then alphabetically
 * by name. Independent of the order monitors were added, so the table, the
 * on-screen views, the card list, and the serialized URL all agree. Because
 * the canvas draws in this order, the largest panel is painted first and sits
 * at the bottom of the z-order, leaving smaller panels layered on top.
 */
export function sortMonitors(monitors: Monitor[]): Monitor[] {
  return [...monitors].sort((a, b) => {
    const pa = physical(a)
    const pb = physical(b)
    const areaA = pa.widthIn * pa.heightIn
    const areaB = pb.widthIn * pb.heightIn
    if (areaA !== areaB) return areaB - areaA
    return a.name.localeCompare(b.name)
  })
}

export function formatNumber(n: number, digits = 1): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
