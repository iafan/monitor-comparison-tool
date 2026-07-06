import type { Alignment, Monitor, Preferences, TopViewAlign } from './types'

export const STORAGE_KEY = 'monitor-comparison:monitors:v1'
export const ALIGN_KEY = 'monitor-comparison:alignment:v1'
export const TOPVIEW_ALIGN_KEY = 'monitor-comparison:topview-align:v1'
export const PREFS_KEY = 'monitor-comparison:preferences:v1'
export const TOOL_KEY = 'monitor-comparison:tool:v1'
export const THEME_KEY = 'monitor-comparison:theme:v1'
export const COLOR_SLOTS = 8

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
  { label: 'WQHD+ (1600p) — 3440 × 1600', resWidth: 3440, resHeight: 1600 },
  { label: '4K UHD — 3840 × 2160', resWidth: 3840, resHeight: 2160 },
  { label: 'DQHD (Super UltraWide) — 5120 × 1440', resWidth: 5120, resHeight: 1440 },
  { label: '5K — 5120 × 2880', resWidth: 5120, resHeight: 2880 },
  { label: '6K — 6016 × 3384', resWidth: 6016, resHeight: 3384 },
]

/** Typical curved-monitor radii in mm; smaller = more aggressively curved. */
export const CURVATURE_PRESETS = [800, 1000, 1500, 1800, 2300, 2500, 3800]

/** Seeded on first load; QHD 31.5" and WQHD 34" as requested. */
export const DEFAULT_MONITORS: Omit<Monitor, 'id'>[] = [
  {
    name: 'QHD 31.5"',
    resWidth: 2560,
    resHeight: 1440,
    diagonal: 31.5,
    curveRadius: null,
    visible: true,
    colorSlot: 0,
  },
  {
    name: 'WQHD 34"',
    resWidth: 3440,
    resHeight: 1440,
    diagonal: 34,
    curveRadius: 1800,
    visible: true,
    colorSlot: 1,
  },
]

/** Maps a monitor's color slot to one of the eight categorical palette tokens. */
export function seriesColor(slot: number): string {
  return `var(--series-${(slot % COLOR_SLOTS) + 1})`
}
