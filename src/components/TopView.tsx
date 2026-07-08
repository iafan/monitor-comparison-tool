import { useMemo } from 'react'
import { arcPoints, physical } from '../lib/geometry'
import { formatLength } from '../lib/units'
import type { Alignment, Monitor, TopViewAlign, Unit } from '../types'

interface Props {
  monitors: Monitor[]
  alignment: Alignment
  topViewAlign: TopViewAlign
  colors: Record<string, string>
  deskEnabled: boolean
  deskWidth: number
  deskDepth: number
  deskX: number
  deskY: number
  unit: Unit
}

const PAD_Y = 0.5
const ARC_SAMPLES = 48
/** Cap how wide/short the strip can get so shallow arcs still render a visible band. */
const MAX_ASPECT = 7

export function TopView({
  monitors,
  alignment,
  topViewAlign,
  colors,
  deskEnabled,
  deskWidth,
  deskDepth,
  deskX,
  deskY,
  unit,
}: Props) {
  const layout = useMemo(() => {
    const visible = monitors.filter((m) => m.visible)
    const anyCurved = visible.some((m) => m.curveRadius && m.curveRadius > 0)
    // On a desk we always draw (flat panels included); otherwise only when curved.
    if (visible.length === 0 || (!deskEnabled && !anyCurved)) return null

    // Arrange the monitors as a stack: horizontal by the front-view alignment's
    // horizontal component, depth by the top-view alignment.
    const hAlign = alignment === 'center' ? 'center' : alignment.split('-')[1]
    const items = visible.map((m) => ({ m, widthIn: physical(m).widthIn }))
    const maxW = Math.max(...items.map((i) => i.widthIn))
    const centerXof = (w: number) =>
      hAlign === 'left' ? w / 2 : hAlign === 'right' ? maxW - w / 2 : maxW / 2
    const offsetY = (sag: number) =>
      topViewAlign === 'back' ? 0 : topViewAlign === 'front' ? -sag : -sag / 2

    const arcs = items.map(({ m, widthIn }) => {
      const local = arcPoints(widthIn, m.curveRadius, ARC_SAMPLES)
      const sag = local[local.length - 1][1]
      const cx = centerXof(widthIn)
      const oy = offsetY(sag)
      return {
        id: m.id,
        color: colors[m.id],
        // Absolute arrangement points (before final placement).
        pts: local.map(([x, y]) => [cx + x, y + oy] as [number, number]),
      }
    })

    const xs = arcs.flatMap((a) => a.pts.map((p) => p[0]))
    const ys = arcs.flatMap((a) => a.pts.map((p) => p[1]))
    const gxmin = Math.min(...xs)
    const gxmax = Math.max(...xs)
    const gymin = Math.min(...ys)
    const gymax = Math.max(...ys)

    if (deskEnabled) {
      const W = Math.max(deskWidth, 1)
      const D = Math.max(deskDepth, 1)
      // Place the group: horizontal center at deskX%, back-most point at deskY% from far edge.
      const shiftX = (deskX / 100) * W - (gxmin + gxmax) / 2
      const shiftY = (deskY / 100) * D - gymin

      const polylines = arcs.map((a) => ({
        id: a.id,
        color: a.color,
        points: a.pts.map(([x, y]) => `${(x + shiftX).toFixed(2)},${(y + shiftY).toFixed(2)}`).join(' '),
      }))

      // Fit the viewBox around the desk and any overhanging panels.
      const pad = Math.max(W, D) * 0.04 + 0.5
      const minX = Math.min(0, gxmin + shiftX) - pad
      const maxX = Math.max(W, gxmax + shiftX) + pad
      const minY = Math.min(0, gymin + shiftY) - pad
      const maxY = Math.max(D, gymax + shiftY) + pad
      const viewBox = `${minX.toFixed(2)} ${minY.toFixed(2)} ${(maxX - minX).toFixed(2)} ${(maxY - minY).toFixed(2)}`

      return { mode: 'desk' as const, viewBox, desk: { w: W, h: D }, polylines }
    }

    // Curvature-only mode: tight fit around the arranged stack.
    const contentW = gxmax - gxmin
    const contentH = gymax - gymin
    const padX = contentW * 0.04 + 0.4
    const vbW = contentW + padX * 2
    const vbH = Math.max(contentH + PAD_Y * 2, vbW / MAX_ASPECT)
    const shiftX = -gxmin + padX
    const shiftY = -gymin + (vbH - contentH) / 2

    const polylines = arcs.map((a) => ({
      id: a.id,
      color: a.color,
      points: a.pts.map(([x, y]) => `${(x + shiftX).toFixed(2)},${(y + shiftY).toFixed(2)}`).join(' '),
    }))

    return { mode: 'arcs' as const, viewBox: `0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}`, polylines }
  }, [monitors, alignment, topViewAlign, colors, deskEnabled, deskWidth, deskDepth, deskX, deskY])

  if (!layout) return null

  const heading = layout.mode === 'desk' ? 'Top view — on desk' : 'Top view — curvature'
  const caption =
    layout.mode === 'desk'
      ? `Desk ${formatLength(deskWidth, unit)} × ${formatLength(deskDepth, unit)} · viewer at the bottom · to scale`
      : 'Viewer at the bottom · to scale'

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <h2 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">{heading}</h2>
      <svg
        viewBox={layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        role="img"
        aria-label={layout.mode === 'desk' ? 'Top-down desk layout' : 'Top-down view of monitor curvature'}
      >
        {layout.mode === 'desk' && (
          <rect
            x={0}
            y={0}
            width={layout.desk.w}
            height={layout.desk.h}
            rx={0.4}
            fill="var(--page-plane)"
            stroke="var(--baseline)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {layout.polylines.map((pl) => (
          <g key={pl.id}>
            <polyline
              points={pl.points}
              fill="none"
              stroke="var(--surface-1)"
              strokeWidth={6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={pl.points}
              fill="none"
              stroke={pl.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-[var(--text-muted)]">{caption}</p>
    </section>
  )
}
