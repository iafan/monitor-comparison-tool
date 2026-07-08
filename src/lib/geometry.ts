import type { Monitor } from '../types'

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
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
  /** Reduced aspect ratio, e.g. "16:9". */
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
  const g = gcd(m.resWidth, m.resHeight) || 1
  const ratio = `${m.resWidth / g}:${m.resHeight / g}`
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
