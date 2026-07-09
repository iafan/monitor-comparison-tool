import { physical } from '../lib/geometry'
import type { MonitorClass } from '../data'

/** Distinct outline colors per panel (self-contained — not reliant on the app
 *  palette). Eight entries so the curvature concept page (flat + 7 radii) never
 *  wraps and repeats a color. */
export const PANEL_COLORS = ['#2f6bff', '#12a150', '#e0642a', '#8a4fff', '#e0a92a', '#e563b4', '#0891b2', '#475569']

interface Props {
  classes: MonitorClass[]
}

/**
 * The shared-resolution panels drawn to scale as nested, center-aligned outlines
 * — pure SVG, no effects/measurement, so it renders identically server-side and
 * is inlined straight into the static page.
 */
export function SizeComparisonSvg({ classes }: Props) {
  const panels = classes.map((c) => ({ c, ...physical(c) }))
  const maxW = Math.max(...panels.map((p) => p.widthIn))
  const maxH = Math.max(...panels.map((p) => p.heightIn))

  const W = 560
  const M = 44 // margin for labels
  const scale = (W - 2 * M) / maxW
  const contentH = maxH * scale
  const H = contentH + 2 * M
  const cx = W / 2
  const cy = M + contentH / 2

  // Largest first so the smaller outlines sit on top and stay legible.
  const order = [...panels].sort((a, b) => b.widthIn - a.widthIn)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${classes[0].resWidth}×${classes[0].resHeight} shown at ${classes
        .map((c) => `${c.diagonal} inch`)
        .join(', ')}, drawn to scale`}
    >
      {order.map((p) => {
        const color = PANEL_COLORS[classes.indexOf(p.c) % PANEL_COLORS.length]
        const w = p.widthIn * scale
        const h = p.heightIn * scale
        const x = cx - w / 2
        const y = cy - h / 2
        return (
          <g key={p.c.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={6}
              fill={color}
              fillOpacity={0.08}
              stroke={color}
              strokeWidth={2}
            />
            <text x={x + 8} y={y + 20} fill={color} fontSize={15} fontWeight={600}>
              {p.c.diagonal}″
            </text>
          </g>
        )
      })}
    </svg>
  )
}
