import {
  ALIGN_KEY,
  ALIGNMENTS,
  DEFAULT_MONITORS,
  DEFAULT_PREFERENCES,
  DEFAULT_SIMULATOR,
  PREFS_KEY,
  SIMULATOR_KEY,
  STORAGE_KEY,
  THEME_KEY,
  TOOL_KEY,
  TOPVIEW_ALIGN_KEY,
  TOPVIEW_ALIGNS,
  VISIBLE_AREA_KEY,
} from '../constants'
import { resolveSelection } from '../data'
import type {
  Alignment,
  Monitor,
  Preferences,
  SimulatorSettings,
  Theme,
  Tool,
  TopViewAlign,
  VisibleAreaFrame,
} from '../types'

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
  return (ALIGNMENTS as string[]).includes(raw ?? '') ? (raw as Alignment) : 'center'
}

export function saveAlignment(alignment: Alignment): void {
  localStorage.setItem(ALIGN_KEY, alignment)
}

export function loadTopViewAlign(): TopViewAlign {
  const raw = localStorage.getItem(TOPVIEW_ALIGN_KEY)
  return (TOPVIEW_ALIGNS as string[]).includes(raw ?? '') ? (raw as TopViewAlign) : 'front'
}

export function saveTopViewAlign(align: TopViewAlign): void {
  localStorage.setItem(TOPVIEW_ALIGN_KEY, align)
}

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: Preferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function loadTool(): Tool {
  const raw = localStorage.getItem(TOOL_KEY)
  return raw === 'comparison' || raw === 'check' || raw === 'geometry' || raw === 'simulator'
    ? raw
    : 'comparison'
}

export function saveTool(tool: Tool): void {
  localStorage.setItem(TOOL_KEY, tool)
}

/** Returns the stored theme, or null to mean "no explicit choice — follow the system". */
export function loadTheme(): Theme | null {
  const raw = localStorage.getItem(THEME_KEY)
  return raw === 'light' || raw === 'dark' ? raw : null
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
}

const FRAME_KEYS = ['topX', 'topY', 'botX', 'botY', 'radius'] as const

/** The saved visible-area frame, or null (full-screen default — nothing stored). */
export function loadVisibleFrame(): VisibleAreaFrame | null {
  try {
    const raw = localStorage.getItem(VISIBLE_AREA_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Record<string, unknown>
    if (!FRAME_KEYS.every((k) => typeof p[k] === 'number' && Number.isFinite(p[k]))) return null
    return { topX: p.topX, topY: p.topY, botX: p.botX, botY: p.botY, radius: p.radius } as VisibleAreaFrame
  } catch {
    return null
  }
}

export function saveVisibleFrame(frame: VisibleAreaFrame | null): void {
  if (frame) localStorage.setItem(VISIBLE_AREA_KEY, JSON.stringify(frame))
  else localStorage.removeItem(VISIBLE_AREA_KEY)
}

/** The saved Monitor Simulator settings, falling back field-by-field to the defaults. */
export function loadSimulator(): SimulatorSettings {
  try {
    const raw = localStorage.getItem(SIMULATOR_KEY)
    if (!raw) return DEFAULT_SIMULATOR
    const p = JSON.parse(raw) as Partial<SimulatorSettings>
    const selection =
      typeof p.selection === 'string' && resolveSelection(p.selection)
        ? p.selection
        : DEFAULT_SIMULATOR.selection
    const distanceIn =
      typeof p.distanceIn === 'number' && Number.isFinite(p.distanceIn)
        ? p.distanceIn
        : DEFAULT_SIMULATOR.distanceIn
    return { selection, distanceIn }
  } catch {
    return DEFAULT_SIMULATOR
  }
}

export function saveSimulator(simulator: SimulatorSettings): void {
  localStorage.setItem(SIMULATOR_KEY, JSON.stringify(simulator))
}
