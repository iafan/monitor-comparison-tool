import type { MonitorClass } from './types'

/**
 * Builds the canonical class id from geometry:
 *   `<diagonal>-<width>x<height>[-<curve>r]`
 * The curve suffix is omitted for flat panels. `index.ts` asserts every
 * class's declared id matches this, so ids can't silently drift from geometry.
 */
export function makeClassId(
  c: Pick<MonitorClass, 'diagonal' | 'resWidth' | 'resHeight' | 'curveRadius'>,
): string {
  const base = `${c.diagonal}-${c.resWidth}x${c.resHeight}`
  return c.curveRadius ? `${base}-${c.curveRadius}r` : base
}

/** A human label for a class, e.g. `34" · 3440×1440 · 1800R` or `31.5" · 2560×1440 · Flat`. */
export function classLabel(c: MonitorClass): string {
  const curve = c.curveRadius ? `${c.curveRadius}R` : 'Flat'
  return `${c.diagonal}" · ${c.resWidth}×${c.resHeight} · ${curve}`
}

/**
 * The generic geometry classes. Add a new class here, then create a matching
 * per-class file under `models/` (named exactly `<id>.ts`) for its products.
 */
export const MONITOR_CLASSES: MonitorClass[] = [
  { id: '31.5-2560x1440', diagonal: 31.5, resWidth: 2560, resHeight: 1440, curveRadius: null },
  { id: '34-3440x1440-1800r', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: 1800 },
]
