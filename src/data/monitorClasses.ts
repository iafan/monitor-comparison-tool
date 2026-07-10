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

/** The default monitor name suggested/assigned for a class, e.g. `34" 3440×1440 1800R`. */
export function classDefaultName(c: MonitorClass): string {
  const curve = c.curveRadius ? ` ${c.curveRadius}R` : ''
  return `${c.diagonal}" ${c.resWidth}×${c.resHeight}${curve}`
}

/**
 * The generic geometry classes. Add a new class here, then create a matching
 * per-class file under `models/` (named exactly `<id>.ts`) for its products.
 */
export const MONITOR_CLASSES: MonitorClass[] = [
  // 24″
  { id: '24-1920x1080', diagonal: 24, resWidth: 1920, resHeight: 1080, curveRadius: null },
  { id: '24-1920x1200', diagonal: 24, resWidth: 1920, resHeight: 1200, curveRadius: null },
  { id: '24-2560x1440', diagonal: 24, resWidth: 2560, resHeight: 1440, curveRadius: null },
  // 27″
  { id: '27-1920x1080', diagonal: 27, resWidth: 1920, resHeight: 1080, curveRadius: null },
  { id: '27-1920x1200', diagonal: 27, resWidth: 1920, resHeight: 1200, curveRadius: null },
  { id: '27-2560x1440', diagonal: 27, resWidth: 2560, resHeight: 1440, curveRadius: null },
  { id: '27-3840x2160', diagonal: 27, resWidth: 3840, resHeight: 2160, curveRadius: null },
  { id: '27-5120x2880', diagonal: 27, resWidth: 5120, resHeight: 2880, curveRadius: null },
  // 29″ (ultrawide)
  { id: '29-2560x1080', diagonal: 29, resWidth: 2560, resHeight: 1080, curveRadius: null },
  // 30″
  { id: '30-2560x1600', diagonal: 30, resWidth: 2560, resHeight: 1600, curveRadius: null },
  // 31.5″ / 32″
  { id: '31.5-2560x1440', diagonal: 31.5, resWidth: 2560, resHeight: 1440, curveRadius: null },
  { id: '32-2560x1440', diagonal: 32, resWidth: 2560, resHeight: 1440, curveRadius: null },
  { id: '32-2560x1440-1000r', diagonal: 32, resWidth: 2560, resHeight: 1440, curveRadius: 1000 },
  { id: '32-3840x2160', diagonal: 32, resWidth: 3840, resHeight: 2160, curveRadius: null },
  { id: '32-3840x2160-1700r', diagonal: 32, resWidth: 3840, resHeight: 2160, curveRadius: 1700 },
  { id: '32-3840x2400', diagonal: 32, resWidth: 3840, resHeight: 2400, curveRadius: null },
  { id: '32-6016x3384', diagonal: 32, resWidth: 6016, resHeight: 3384, curveRadius: null },
  // 34″ (ultrawide)
  { id: '34-2560x1080-1500r', diagonal: 34, resWidth: 2560, resHeight: 1080, curveRadius: 1500 },
  { id: '34-3440x1440', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: null },
  { id: '34-3440x1440-800r', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: 800 },
  { id: '34-3440x1440-1000r', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: 1000 },
  { id: '34-3440x1440-1500r', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: 1500 },
  { id: '34-3440x1440-1800r', diagonal: 34, resWidth: 3440, resHeight: 1440, curveRadius: 1800 },
  // 37.5″ / 39″ (ultrawide)
  { id: '37.5-3840x1600-2300r', diagonal: 37.5, resWidth: 3840, resHeight: 1600, curveRadius: 2300 },
  { id: '39-3440x1440-800r', diagonal: 39, resWidth: 3440, resHeight: 1440, curveRadius: 800 },
  // 40″ (ultrawide 5K2K)
  { id: '40-5120x2160', diagonal: 40, resWidth: 5120, resHeight: 2160, curveRadius: null },
  { id: '40-5120x2160-2500r', diagonal: 40, resWidth: 5120, resHeight: 2160, curveRadius: 2500 },
  // 42″ / 43″ / 45″ / 48″
  { id: '42-3840x2160', diagonal: 42, resWidth: 3840, resHeight: 2160, curveRadius: null },
  { id: '43-3840x2160', diagonal: 43, resWidth: 3840, resHeight: 2160, curveRadius: null },
  { id: '45-3440x1440-800r', diagonal: 45, resWidth: 3440, resHeight: 1440, curveRadius: 800 },
  { id: '45-5120x2160-800r', diagonal: 45, resWidth: 5120, resHeight: 2160, curveRadius: 800 },
  { id: '48-3840x2160', diagonal: 48, resWidth: 3840, resHeight: 2160, curveRadius: null },
  // 49″ (super ultrawide DQHD)
  { id: '49-5120x1440-1000r', diagonal: 49, resWidth: 5120, resHeight: 1440, curveRadius: 1000 },
  { id: '49-5120x1440-1800r', diagonal: 49, resWidth: 5120, resHeight: 1440, curveRadius: 1800 },
  { id: '49-5120x1440-3800r', diagonal: 49, resWidth: 5120, resHeight: 1440, curveRadius: 3800 },
  // 57″ (super ultrawide Dual 4K)
  { id: '57-7680x2160-1000r', diagonal: 57, resWidth: 7680, resHeight: 2160, curveRadius: 1000 },
]
