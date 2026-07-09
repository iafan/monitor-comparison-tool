import type { Monitor, MonitorInput } from '../types'

/** The fields carried in an exported monitor (no internal id / visibility). */
type ExportedMonitor = Pick<Monitor, 'name' | 'resWidth' | 'resHeight' | 'diagonal' | 'curveRadius'>

/**
 * A stable identity for de-duplication: two monitors are "the same" when their
 * name and full geometry match. Used to skip duplicates on import.
 */
export function monitorKey(m: ExportedMonitor): string {
  return `${m.name.trim().toLowerCase()}|${m.resWidth}x${m.resHeight}|${m.diagonal}|${m.curveRadius ?? 'flat'}`
}

/** Pretty JSON for the Save dialog — just the meaningful fields, in a stable order. */
export function serializeMonitors(monitors: Monitor[]): string {
  const exported: ExportedMonitor[] = monitors.map((m) => ({
    name: m.name,
    resWidth: m.resWidth,
    resHeight: m.resHeight,
    diagonal: m.diagonal,
    curveRadius: m.curveRadius,
  }))
  return JSON.stringify(exported, null, 2)
}

const isPosNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Coerce one parsed object into a MonitorInput, or null if it isn't a valid monitor. */
function toInput(o: unknown): MonitorInput | null {
  if (!o || typeof o !== 'object') return null
  const r = o as Record<string, unknown>
  if (typeof r.name !== 'string' || !r.name.trim()) return null
  if (!isPosNum(r.resWidth) || !isPosNum(r.resHeight) || !isPosNum(r.diagonal)) return null
  let curveRadius: number | null
  if (r.curveRadius === undefined || r.curveRadius === null) curveRadius = null
  else if (isPosNum(r.curveRadius)) curveRadius = r.curveRadius
  else return null
  return {
    name: r.name.trim(),
    resWidth: r.resWidth,
    resHeight: r.resHeight,
    diagonal: r.diagonal,
    curveRadius,
    classId: undefined,
    modelId: undefined,
  }
}

/**
 * Parse pasted JSON into monitor inputs. Accepts a bare array or an object with a
 * `monitors` array. Throws an Error with a friendly message on malformed JSON or
 * when no valid monitor is found; otherwise returns the valid entries.
 */
export function parseMonitors(text: string): MonitorInput[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That doesn't look like valid JSON.")
  }
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).monitors)
      ? ((data as Record<string, unknown>).monitors as unknown[])
      : null
  if (!arr) throw new Error('Expected a JSON array of monitors.')
  const inputs = arr.map(toInput).filter((m): m is MonitorInput => m !== null)
  if (inputs.length === 0) throw new Error('No valid monitors found in that JSON.')
  return inputs
}
