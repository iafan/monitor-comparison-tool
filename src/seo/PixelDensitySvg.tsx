import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'
import { PANEL_COLORS } from './SizeComparisonSvg'

/** How much real screen (in inches) each swatch represents. Small enough that a
 *  low-density panel still shows a countable grid, big enough that the difference
 *  between resolutions is obvious. */
const PATCH_IN = 0.18

interface Props {
  /** Resolutions at one fixed diagonal, sorted by pixel count ascending. */
  resolutions: { c: MonitorClass; name: string }[]
}

/**
 * A magnified look at the *same physical patch* of screen at each resolution:
 * every swatch is the same on-screen size and represents the same real-world
 * area, but is divided into that resolution's actual pixel grid — so a denser
 * (higher-PPI) panel visibly packs more, smaller pixels into the identical space.
 *
 * This is the honest visualization for the fixed-size axis: at one diagonal the
 * panels are the same physical rectangle, so nesting their outlines (as the
 * resolution pages do) would just overlap — what actually changes is sharpness.
 * Pure SVG, so it renders identically server-side and inlines into the page.
 */
export function PixelDensitySvg({ resolutions }: Props) {
  const S = 150 // on-screen swatch size (px)
  const GAP = 34
  const M = 16
  const LABEL_H = 52
  const n = resolutions.length
  const W = 2 * M + n * S + (n - 1) * GAP
  const H = M + S + LABEL_H

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full max-w-[640px]"
      role="img"
      aria-label={`The same ${PATCH_IN}-inch patch of screen shown at ${resolutions
        .map((r) => r.name)
        .join(', ')}, pixel grid drawn to scale`}
    >
      {resolutions.map(({ c, name }, i) => {
        const { ppi } = physical(c)
        const cells = Math.max(2, Math.round(ppi * PATCH_IN))
        const cell = S / cells
        const color = PANEL_COLORS[i % PANEL_COLORS.length]
        const x0 = M + i * (S + GAP)
        const grid = []
        for (let k = 1; k < cells; k++) {
          const off = k * cell
          grid.push(
            <line key={`v${k}`} x1={x0 + off} y1={M} x2={x0 + off} y2={M + S} stroke={color} strokeOpacity={0.35} strokeWidth={0.75} />,
            <line key={`h${k}`} x1={x0} y1={M + off} x2={x0 + S} y2={M + off} stroke={color} strokeOpacity={0.35} strokeWidth={0.75} />,
          )
        }
        return (
          <g key={c.id}>
            <rect x={x0} y={M} width={S} height={S} rx={4} fill={color} fillOpacity={0.06} stroke={color} strokeWidth={2} />
            {grid}
            <text x={x0 + S / 2} y={M + S + 22} textAnchor="middle" fontSize={15} fontWeight={600} style={{ fill: 'var(--text-primary)' }}>
              {name}
            </text>
            <text x={x0 + S / 2} y={M + S + 40} textAnchor="middle" fontSize={12} style={{ fill: 'var(--text-muted)' }}>
              {Math.round(ppi)} PPI
            </text>
          </g>
        )
      })}
    </svg>
  )
}
