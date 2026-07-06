/** Panel technologies we distinguish on specific models. */
export type PanelType = 'IPS' | 'VA' | 'TN' | 'OLED' | 'QD-OLED' | 'WOLED'

/**
 * A generic monitor "class" — the geometry the comparison tool needs to render a
 * screen, independent of any specific product. Identified by a stable id built
 * from its geometry: `<diagonal>-<width>x<height>[-<curve>r]`
 *   e.g. "34-3440x1440-1800r" (curved) or "31.5-2560x1440" (flat, no curve suffix).
 */
export interface MonitorClass {
  id: string
  /** Viewable diagonal in inches. */
  diagonal: number
  resWidth: number
  resHeight: number
  /** Curvature radius in mm (e.g. 1800 → "1800R"); null means flat. */
  curveRadius: number | null
}

/**
 * A specific real-world monitor. It references a MonitorClass for geometry and
 * adds product-level properties on top.
 */
export interface MonitorModel {
  /** Stable slug, e.g. "dell-s3425dw". */
  id: string
  brand: string
  /** Full display name, e.g. "Dell S3425DW". */
  name: string
  /** References MonitorClass.id — the geometry this model uses. */
  classId: string
  panelType: PanelType
  releaseYear?: number
}
