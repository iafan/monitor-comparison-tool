import { ALIGN_KEY, ALIGNMENTS, DEFAULT_MONITORS, STORAGE_KEY } from '../constants'
import type { Alignment, Monitor } from '../types'

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function seedDefaults(): Monitor[] {
  return DEFAULT_MONITORS.map((d) => ({ ...d, id: uid() }))
}

export function loadMonitors(): Monitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDefaults()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDefaults()
    // Normalize entries saved before curveRadius existed.
    return (parsed as Monitor[]).map((m) => ({ ...m, curveRadius: m.curveRadius ?? null }))
  } catch {
    return seedDefaults()
  }
}

export function saveMonitors(monitors: Monitor[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors))
}

export function loadAlignment(): Alignment {
  const raw = localStorage.getItem(ALIGN_KEY)
  return (ALIGNMENTS as string[]).includes(raw ?? '') ? (raw as Alignment) : 'bottom-left'
}

export function saveAlignment(alignment: Alignment): void {
  localStorage.setItem(ALIGN_KEY, alignment)
}
