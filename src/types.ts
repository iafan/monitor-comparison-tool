/** Which tool is active in the top-level tool selector. */
export type Tool = 'comparison' | 'check' | 'geometry' | 'view'

/**
 * The 3D Viewer's shareable state: which monitor is on screen and how far the
 * eye sits from it. Distance is stored canonically in inches (like the desk
 * dimensions) so a unit switch is display-only. Head angle is intentionally NOT
 * here — it's ephemeral local state in the viewer, never persisted or shared.
 */
export interface ViewSettings {
  /** Catalogue selection — a class id or a model id (see src/data). */
  selection: string
  /** Eye-to-screen distance, in inches. */
  distanceIn: number
}

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
  /** Provenance: the generic class this was created from, if any (see src/data). */
  classId?: string
  /** Provenance: the specific model this was created from, if any. */
  modelId?: string
}

/**
 * The Monitor Geometry "visible screen area" frame, in CSS pixels: two opposite
 * corners (inclusive) plus a corner radius. null means the full-screen default
 * (top-left 0,0 to bottom-right width-1,height-1, no rounding).
 */
export interface VisibleAreaFrame {
  topX: number
  topY: number
  botX: number
  botY: number
  radius: number
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
  'name' | 'resWidth' | 'resHeight' | 'diagonal' | 'curveRadius' | 'classId' | 'modelId'
>
