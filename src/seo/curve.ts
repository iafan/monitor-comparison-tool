import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'

export interface CurveMetrics {
  /** Radius of curvature in mm, or null for a flat panel. */
  radiusMm: number | null
  /** Physical panel width (arc length along the screen) in mm. */
  widthMm: number
  /** Curve depth (sagitta) — how far the center sits behind the edges, in mm. */
  depthMm: number
  /** How much of a full circle the screen wraps, in degrees. */
  wrapDeg: number
  /** Ideal viewing distance in mm (equals the radius), or null when flat. */
  idealDistanceMm: number | null
}

/** Derives the curvature geometry of a class, reusing the same arc math as the
 *  app (a screen of arc-length W on a circle of radius R subtends W/R radians). */
export function curveMetrics(c: Pick<MonitorClass, 'resWidth' | 'resHeight' | 'diagonal' | 'curveRadius'>): CurveMetrics {
  const widthMm = physical(c).widthIn * 25.4
  if (!c.curveRadius) {
    return { radiusMm: null, widthMm, depthMm: 0, wrapDeg: 0, idealDistanceMm: null }
  }
  const theta = widthMm / c.curveRadius // arc angle in radians
  const depthMm = c.curveRadius * (1 - Math.cos(theta / 2))
  return {
    radiusMm: c.curveRadius,
    widthMm,
    depthMm,
    wrapDeg: (theta * 180) / Math.PI,
    idealDistanceMm: c.curveRadius,
  }
}

/** Spec-sheet label for a curvature, e.g. "800R" or "Flat". */
export function curveName(radius: number | null): string {
  return radius ? `${radius}R` : 'Flat'
}

/** A one-line read on how a curve feels — biased toward the straight-line-work
 *  (documents / CAD) trade-off, mirroring ppiNote on the resolution pages. */
export function curveNote(radius: number | null): string {
  if (!radius) return 'Straight lines stay straight — best for CAD, layout & print'
  if (radius >= 2300) return 'Very gentle — negligible bow; fine for detailed document work'
  if (radius >= 1500) return 'Moderate — immersive, with a slight bow on long straight edges'
  if (radius >= 1000) return 'Aggressive — strong wrap; straight lines visibly bow'
  return 'Very aggressive — maximum immersion; not for precision layout'
}
