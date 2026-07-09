import { classDefaultName, getClass } from './data'
import type { Alignment, Monitor, Preferences, SimulatorSettings, TopViewAlign } from './types'

export const STORAGE_KEY = 'monitor-comparison:monitors:v1'
export const MY_MONITORS_KEY = 'monitor-comparison:my-monitors:v1'
export const ALIGN_KEY = 'monitor-comparison:alignment:v1'
export const TOPVIEW_ALIGN_KEY = 'monitor-comparison:topview-align:v1'
export const PREFS_KEY = 'monitor-comparison:preferences:v1'
export const TOOL_KEY = 'monitor-comparison:tool:v1'
export const THEME_KEY = 'monitor-comparison:theme:v1'
export const VISIBLE_AREA_KEY = 'monitor-comparison:visible-area:v1'
export const SIMULATOR_KEY = 'monitor-comparison:simulator:v1'
export const COLOR_SLOTS = 8

/**
 * Monitor Simulator defaults: a 34" 1800R ultrawide (curvature is the interesting case),
 * eyes ~60 cm from the screen. (Head angle isn't persisted — it starts centered.)
 */
export const DEFAULT_SIMULATOR: SimulatorSettings = {
  selection: '34-3440x1440-1800r',
  distanceIn: 23.6,
}

/** Bounds for the Monitor Simulator's inputs (inches / degrees). */
export const SIMULATOR_DISTANCE_MIN_IN = 8
export const SIMULATOR_DISTANCE_MAX_IN = 60
export const SIMULATOR_HEAD_ANGLE_MAX = 75 // horizontal head turn (yaw)
export const SIMULATOR_PITCH_MAX = 30 // vertical head tilt (look up/down)

/** Valid Monitor Check screen ids (mirrors PATTERNS in MonitorCheck); used to validate the URL `scr` value. */
export const CHECK_SCREEN_IDS = [
  'white',
  'black',
  'red',
  'green',
  'blue',
  'vlines',
  'hlines',
  'gradient',
  'gamma',
  'refresh',
] as const

/** Desk defaults ~140 × 70 cm, stored in inches; monitors centered near the back. */
export const DEFAULT_PREFERENCES: Preferences = {
  unit: 'in',
  deskEnabled: false,
  deskWidth: 55,
  deskDepth: 28,
  deskX: 50,
  deskY: 10,
}

export const ALIGNMENTS: Alignment[] = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

export const ALIGN_LABELS: Record<Alignment, string> = {
  'top-left': 'Top left',
  'top-center': 'Top center',
  'top-right': 'Top right',
  'center-left': 'Center left',
  center: 'Center',
  'center-right': 'Center right',
  'bottom-left': 'Bottom left',
  'bottom-center': 'Bottom center',
  'bottom-right': 'Bottom right',
}

export const TOPVIEW_ALIGNS: TopViewAlign[] = ['back', 'center', 'front']

export const TOPVIEW_ALIGN_LABELS: Record<TopViewAlign, string> = {
  back: 'Top view: align back (behind)',
  center: 'Top view: align center',
  front: 'Top view: align front (nearest viewer)',
}

export interface Preset {
  label: string
  resWidth: number
  resHeight: number
}

export const PRESETS: Preset[] = [
  { label: 'FHD — 1920 × 1080', resWidth: 1920, resHeight: 1080 },
  { label: 'QHD — 2560 × 1440', resWidth: 2560, resHeight: 1440 },
  { label: 'WQHD (UltraWide) — 3440 × 1440', resWidth: 3440, resHeight: 1440 },
  { label: 'WQHD+ (1600p) — 3840 × 1600', resWidth: 3840, resHeight: 1600 },
  { label: '4K UHD — 3840 × 2160', resWidth: 3840, resHeight: 2160 },
  { label: 'DQHD (Super UltraWide) — 5120 × 1440', resWidth: 5120, resHeight: 1440 },
  { label: '5K2K WUHD — 5120 × 2160', resWidth: 5120, resHeight: 2160 },
  { label: '5K — 5120 × 2880', resWidth: 5120, resHeight: 2880 },
  { label: '6K — 6016 × 3384', resWidth: 6016, resHeight: 3384 },
]

/** Typical curved-monitor radii in mm; smaller = more aggressively curved. */
export const CURVATURE_PRESETS = [800, 1000, 1500, 1800, 2300, 2500, 3800]

/**
 * Builds a seed monitor from a generic class. The name is the class's default
 * name so the seed is a true class reference — it serializes compactly to
 * `=<classId>` in the URL (no repeated geometry, no encoded name).
 */
function seedFromClass(classId: string): Omit<Monitor, 'id'> {
  const c = getClass(classId)
  if (!c) throw new Error(`Unknown monitor class "${classId}"`)
  return {
    name: classDefaultName(c),
    resWidth: c.resWidth,
    resHeight: c.resHeight,
    diagonal: c.diagonal,
    curveRadius: c.curveRadius,
    visible: true,
    classId,
  }
}

/** Seeded on first load: a 31.5" QHD flat and a 34" WQHD 1800R curved, from their classes. */
export const DEFAULT_MONITORS: Omit<Monitor, 'id'>[] = [
  seedFromClass('31.5-2560x1440'),
  seedFromClass('34-3440x1440-1800r'),
]

/** Neutral swatch color for a disabled monitor. */
export const DISABLED_SWATCH = 'var(--swatch-off)'

/** The Nth categorical palette token (0-based), rotating through the eight colors. */
export function seriesColor(index: number): string {
  return `var(--series-${(index % COLOR_SLOTS) + 1})`
}

/**
 * Assigns a display color to each monitor by its position among the *enabled*
 * monitors (top to bottom), rotating through the palette — the 9th enabled
 * monitor reuses the 1st color. Disabled monitors get a neutral gray. Returns a
 * map keyed by monitor id, so the table, on-screen views, and card list agree.
 */
export function assignColors(monitors: Monitor[]): Record<string, string> {
  const map: Record<string, string> = {}
  let i = 0
  for (const m of monitors) {
    map[m.id] = m.visible ? seriesColor(i++) : DISABLED_SWATCH
  }
  return map
}
