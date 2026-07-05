/** Which tool is active in the top-level tool selector. */
export type Tool = 'comparison' | 'check' | 'geometry'

/** Explicit color-scheme choice, persisted so it overrides the system default. */
export type Theme = 'light' | 'dark'

export interface Monitor {
  id: string
  name: string
  resWidth: number
  resHeight: number
  diagonal: number
  /** Curvature radius in mm (e.g. 1500 for "1500R"); null means a flat panel. */
  curveRadius: number | null
  visible: boolean
  colorSlot: number
}

/** Display unit for physical lengths. Diagonal, PPI and pixel pitch are exempt. */
export type Unit = 'in' | 'cm' | 'mm'

export interface Preferences {
  unit: Unit
  deskEnabled: boolean
  /** Desk dimensions stored canonically in inches. */
  deskWidth: number
  deskDepth: number
  /** Where the monitor group sits on the desk (percent). */
  deskX: number
  deskY: number
}

export type Alignment =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/**
 * Vertical alignment of curvature arcs in the top view:
 * - back: apex (screen center, farthest from viewer) aligned
 * - center: arcs' vertical midpoints aligned
 * - front: edges (closest to viewer) aligned
 */
export type TopViewAlign = 'back' | 'center' | 'front'

/** The editable fields of a monitor — everything the form collects. */
export type MonitorInput = Pick<
  Monitor,
  'name' | 'resWidth' | 'resHeight' | 'diagonal' | 'curveRadius'
>
