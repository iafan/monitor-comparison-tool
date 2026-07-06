// Generates the Monitorture app icon as a self-contained SVG.
//
// Usage:
//   node scripts/generate-icon.mjs [outputPath] [variant]
//     outputPath  default: public/icon.svg
//     variant     "light" (default) or "dark"
//
// The two variants swap black and white (the RGB bars stay the same):
//   light → black test-card screen with white grid/circles/rays
//   dark  → white test-card screen with black grid/circles/rays
//
// The icon: full-bleed R/G/B test bars, a test-card "screen" (crosshatch grid +
// concentric circles) occupying everything above two rays that meet at the icon
// center, and bar-seam outlines — together forming an M.
import { writeFileSync } from 'node:fs'

const out = process.argv[2] || 'public/icon.svg'
const variant = (process.argv[3] || 'light').toLowerCase()
const dark = variant === 'dark'
const screenFill = dark ? '#ffffff' : '#000000' // the "screen" background
const line = dark ? '#000000' : '#ffffff' // grid, circles, rays, bar seams

const S = 1200 // viewBox size; SVG scales to any rendered dimension
const cx = S / 2
const cy = S / 2
const bw = S / 3 // equal thirds
const ySide = Math.round(0.3 * S) // where the rays meet the left/right edges
const yV = cy // rays' shared vertex = the icon center
const W = 26 // one stroke weight for rays, bar outlines, grid, and circles
const step = Math.round(S / 6) // grid spacing
const radii = [Math.round(0.242 * S), Math.round(0.44 * S)] // concentric circles
const rayY = ySide + (yV - ySide) * (bw / cx) // y where a ray crosses a third boundary

const gridLines = []
for (let x = step; x < S; x += step) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${S}"/>`)
for (let y = step; y < S; y += step) gridLines.push(`<line x1="0" y1="${y}" x2="${S}" y2="${y}"/>`)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="Monitorture">
  <!-- RGB test bars: full bleed, equal width -->
  <rect x="0" y="0" width="${bw}" height="${S}" fill="#ff0000"/>
  <rect x="${bw}" y="0" width="${bw}" height="${S}" fill="#00ff00"/>
  <rect x="${2 * bw}" y="0" width="${bw}" height="${S}" fill="#0000ff"/>

  <!-- Test-card screen: everything above the two rays -->
  <defs>
    <clipPath id="screen">
      <path d="M0 0 H${S} V${ySide} L${cx} ${yV} L0 ${ySide} Z"/>
    </clipPath>
  </defs>
  <g clip-path="url(#screen)">
    <rect x="0" y="0" width="${S}" height="${S}" fill="${screenFill}"/>
    <g fill="none" stroke="${line}" stroke-width="${W}">
      <g stroke-opacity="0.9">
        ${gridLines.join('\n        ')}
      </g>
      <circle cx="${cx}" cy="${cy}" r="${radii[0]}"/>
      <circle cx="${cx}" cy="${cy}" r="${radii[1]}"/>
    </g>
  </g>

  <!-- M: rays meeting at the icon center + bar-seam outlines -->
  <g fill="none" stroke="${line}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round">
    <polyline points="0,${ySide} ${cx},${yV} ${S},${ySide}"/>
    <line x1="${bw}" y1="${rayY}" x2="${bw}" y2="${S}"/>
    <line x1="${2 * bw}" y1="${rayY}" x2="${2 * bw}" y2="${S}"/>
  </g>
</svg>
`

writeFileSync(out, svg)
console.log(`Wrote ${out} (${variant}, ${svg.length} bytes)`)
