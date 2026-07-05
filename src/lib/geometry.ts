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

/** Derives physical panel dimensions from resolution + diagonal size. */
export function physical(m: Monitor): Physical {
  const diagPx = Math.sqrt(m.resWidth ** 2 + m.resHeight ** 2)
  const widthIn = m.diagonal * (m.resWidth / diagPx)
  const heightIn = m.diagonal * (m.resHeight / diagPx)
  const ppi = diagPx / m.diagonal
  const pitchMm = 25.4 / ppi
  const g = gcd(m.resWidth, m.resHeight) || 1
  const ratio = `${m.resWidth / g}:${m.resHeight / g}`
  return { widthIn, heightIn, ppi, pitchMm, ratio }
}

export function formatNumber(n: number, digits = 1): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
