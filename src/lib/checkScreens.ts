// The catalogue of Monitor Check screens — the single source of truth for what
// screens exist. The Check component renders from it, and the URL codec derives
// its valid-id set from it, so a new screen can never fall out of sync with URL
// validation: add an entry here and it's automatically shareable.
//
// Deliberately data-only (no React) so the URL codec can import it without
// pulling the lazy-loaded MonitorCheck chunk into the main bundle.

type Orientation = 'vertical' | 'horizontal'

export interface Pattern {
  id: string
  label: string
  hint: string
  /** Solid-fill patterns set a color. */
  fill?: string
  /** Line patterns render a split CSS-px vs device-px comparison instead. */
  lines?: Orientation
  /** Scrolling-text screens bounce a paragraph along this axis (smearing test). */
  scroll?: Orientation
  /** Composite screens rendered by a dedicated component. */
  render?: 'gradient' | 'gamma' | 'gamut' | 'refresh'
}

export const CHECK_PATTERNS: Pattern[] = [
  { id: 'white', label: 'White', hint: 'Dead/stuck pixels, backlight bleed, dust', fill: '#ffffff' },
  { id: 'gray', label: 'Gray', hint: 'Uniformity & backlight mura', fill: '#808080' },
  { id: 'black', label: 'Black', hint: 'Stuck (lit) pixels, backlight bleed', fill: '#000000' },
  { id: 'red', label: 'Red', hint: 'Subpixel faults, uniformity', fill: '#ff0000' },
  { id: 'green', label: 'Green', hint: 'Subpixel faults, uniformity', fill: '#00ff00' },
  { id: 'blue', label: 'Blue', hint: 'Subpixel faults, uniformity', fill: '#0000ff' },
  { id: 'vlines', label: 'Vertical lines (1px)', hint: 'Sharpness, scaling & non-native resolution', lines: 'vertical' },
  { id: 'hlines', label: 'Horizontal lines (1px)', hint: 'Sharpness, scaling & non-native resolution', lines: 'horizontal' },
  { id: 'gradient', label: 'Gradient', hint: 'Banding & color bit depth', render: 'gradient' },
  { id: 'gamma', label: 'Gamma', hint: 'Gamma accuracy (≈2.2)', render: 'gamma' },
  { id: 'gamut', label: 'Color gamut', hint: 'Wide-gamut (P3) coverage & color management', render: 'gamut' },
  { id: 'refresh', label: 'Refresh rate', hint: 'Refresh rate, stutter & tearing', render: 'refresh' },
  { id: 'scrollv', label: 'Vertical text scrolling', hint: 'Motion smearing, ghosting & slow pixel response', scroll: 'vertical' },
  { id: 'scrollh', label: 'Horizontal text scrolling', hint: 'Motion smearing, ghosting & slow pixel response', scroll: 'horizontal' },
]

/** Valid screen ids, derived from the catalogue so it can never drift. */
export const CHECK_SCREEN_IDS: readonly string[] = CHECK_PATTERNS.map((p) => p.id)
