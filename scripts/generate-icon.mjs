// Generates the Monitorture app icon as a self-contained SVG.
//
// Usage:
//   node scripts/generate-icon.mjs [outputPath] [variant]
//     outputPath  default: public/icon.svg
//     variant     "light" (default) or "dark"
//
// The two variants swap black and white (the RGB bars and grays stay the same):
//   light → black test-card screen with white grid/circles/rays
//   dark  → white test-card screen with black grid/circles/rays
//
// The icon: full-bleed R/G/B test bars overlaid by an "X" whose four arms meet
// at the icon center, splitting it into four sectors:
//   top    → the test-card "screen" (crosshatch grid + concentric circles)
//   left   → the R/G/B bars in black-and-white
//   right  → the R/G/B bars in black-and-white (mirror of the left)
//   bottom → the R/G/B bars in full color
import { writeFileSync } from 'node:fs'

const out = process.argv[2] || 'public/icon.svg'
const variant = (process.argv[3] || 'light').toLowerCase()
const dark = variant === 'dark'
const screenFill = dark ? '#ffffff' : '#000000' // the "screen" background
const line = dark ? '#000000' : '#ffffff' // grid, circles, rays

const S = 1200 // viewBox size; SVG scales to any rendered dimension
const cx = S / 2
const cy = S / 2 // the X's shared vertex = the icon center
const bw = S / 3 // equal thirds

// Ray angle above/below the horizontal. 45° would put the arms on the square's
// diagonals; 32° keeps a meaningful colored bottom sector while reading as an X.
const ANGLE_DEG = 32
const ySide = Math.round(cy - (S / 2) * Math.tan((ANGLE_DEG * Math.PI) / 180)) // up-rays meet the side edges here
const ySideBottom = 2 * cy - ySide // down-rays are the mirror image

const W = 26 // one stroke weight for rays, grid, and circles
const step = Math.round(S / 6) // grid spacing
const radii = [Math.round(0.242 * S), Math.round(0.44 * S)] // concentric circles

// The RGB bars in the two side sectors are rendered in black-and-white. The
// grays are a lifted-luma mapping (brighter than true Rec.601 luma so the darks
// stay legible), and red/blue share one value so the left/right sectors mirror.
const bwR = '#8b8b8b'
const bwG = '#b5b5b5'
const bwB = '#8b8b8b'
const bars = [
  ['#ff0000', bwR],
  ['#00ff00', bwG],
  ['#4d84ff', bwB],
]

const gridLines = []
for (let x = step; x < S; x += step) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${S}"/>`)
for (let y = step; y < S; y += step) gridLines.push(`<line x1="0" y1="${y}" x2="${S}" y2="${y}"/>`)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="Monitorture">
  <!-- RGB test bars: full bleed, equal width (the bottom sector stays in color) -->
  ${bars.map(([c], i) => `<rect x="${i * bw}" y="0" width="${bw}" height="${S}" fill="${c}"/>`).join('\n  ')}

  <defs>
    <!-- Top sector: the test-card screen, above the two up-rays -->
    <clipPath id="screen">
      <path d="M0 0 H${S} V${ySide} L${cx} ${cy} L0 ${ySide} Z"/>
    </clipPath>
    <!-- Left + right sectors: the two side triangles of the X -->
    <clipPath id="sides">
      <path d="M${cx} ${cy} L0 ${ySide} L0 ${ySideBottom} Z"/>
      <path d="M${cx} ${cy} L${S} ${ySide} L${S} ${ySideBottom} Z"/>
    </clipPath>
  </defs>

  <!-- The R/G/B bars rendered in black-and-white inside the side sectors -->
  <g clip-path="url(#sides)">
    ${bars.map(([, g], i) => `<rect x="${i * bw}" y="0" width="${bw}" height="${S}" fill="${g}"/>`).join('\n    ')}
  </g>

  <!-- Test-card screen: crosshatch grid + concentric circles -->
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

  <!-- The X: up-rays + mirrored down-rays, meeting at the icon center -->
  <g fill="none" stroke="${line}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round">
    <polyline points="0,${ySide} ${cx},${cy} ${S},${ySide}"/>
    <polyline points="0,${ySideBottom} ${cx},${cy} ${S},${ySideBottom}"/>
  </g>
</svg>
`

writeFileSync(out, svg)
console.log(`Wrote ${out} (${variant}, ${svg.length} bytes)`)
