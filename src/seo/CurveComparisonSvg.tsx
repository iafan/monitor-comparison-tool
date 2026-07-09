import { arcPoints, physical } from '../lib/geometry'
import type { MonitorClass } from '../data'
import { PANEL_COLORS } from './SizeComparisonSvg'

interface Props {
  /** The same panel at different curvatures, ordered gentlest → tightest. Colors
   *  match the accompanying table row-for-row (shared PANEL_COLORS order). */
  variants: { c: MonitorClass; name: string }[]
}

/**
 * A top-down look at one panel at each curvature: every arc has the same
 * arc-length (it is the same screen) but bows toward the viewer by a different
 * depth — a flat panel is a straight line, a tighter radius dips deeper and
 * pulls its edges inward. Uses the app's own arcPoints so the curve matches the
 * interactive top view exactly, and is pure SVG so it renders identically SSR.
 */
export function CurveComparisonSvg({ variants }: Props) {
  const items = variants.map(({ c, name }) => ({
    c,
    name,
    widthIn: physical(c).widthIn,
    pts: arcPoints(physical(c).widthIn, c.curveRadius),
  }))

  const widthIn = items[0].widthIn
  const maxDepthIn = Math.max(...items.flatMap((i) => i.pts.map(([, y]) => y)))

  const W = 560
  const M = 40
  const scale = (W - 2 * M) / widthIn
  const contentH = maxDepthIn * scale
  const H = M + contentH + M
  const cx = W / 2
  const topY = M

  const toXY = ([x, y]: [number, number]) => [cx + x * scale, topY + y * scale] as const

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full"
      role="img"
      aria-label={`Top-down view of the same panel at ${items.map((i) => i.name).join(', ')}, curve depth drawn to scale (deeper arc = tighter curve)`}
    >
      {/* Dashed straight reference through the screen's center-back. */}
      <line
        x1={M}
        y1={topY}
        x2={W - M}
        y2={topY}
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray="4 4"
        style={{ stroke: 'var(--text-muted)', opacity: 0.35 }}
      />
      {items.map((it, idx) => {
        const color = PANEL_COLORS[idx % PANEL_COLORS.length]
        const d = it.pts
          .map((p, i) => {
            const [X, Y] = toXY(p)
            return `${i ? 'L' : 'M'}${X.toFixed(1)} ${Y.toFixed(1)}`
          })
          .join(' ')
        return <path key={it.c.id} d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      })}
    </svg>
  )
}
