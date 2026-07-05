import { useMemo } from 'react'
import { seriesColor } from '../constants'
import { physical } from '../lib/geometry'
import { formatLength } from '../lib/units'
import type { Alignment, Monitor, TopViewAlign, Unit } from '../types'

interface Props {
  monitors: Monitor[]
  alignment: Alignment
  topViewAlign: TopViewAlign
  deskEnabled: boolean
  deskWidth: number
  deskDepth: number
  unit: Unit
}

const PAD_Y = 0.5
const ARC_SAMPLES = 48
/** Cap how wide/short the strip can get so shallow arcs still render a visible band. */
const MAX_ASPECT = 7

/** Arc points in physical inches, apex at (0,0) curving toward +y (viewer). */
function arcLocalPoints(widthIn: number, curveRadius: number | null): [number, number][] {
  if (!curveRadius || curveRadius <= 0) {
    return [
      [-widthIn / 2, 0],
      [widthIn / 2, 0],
    ]
  }
  const radiusIn = curveRadius / 25.4
  const theta = widthIn / radiusIn
  const points: [number, number][] = []
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const beta = -theta / 2 + (theta * i) / ARC_SAMPLES
    points.push([radiusIn * Math.sin(beta), radiusIn * (1 - Math.cos(beta))])
  }
  return points
}

export function TopView({
  monitors,
  alignment,
  topViewAlign,
  deskEnabled,
  deskWidth,
  deskDepth,
  unit,
}: Props) {
  const layout = useMemo(() => {
    const visible = monitors.filter((m) => m.visible)
    const anyCurved = visible.some((m) => m.curveRadius && m.curveRadius > 0)
    // On a desk we always draw (flat panels included); otherwise only when curved.
    if (visible.length === 0 || (!deskEnabled && !anyCurved)) return null

    const legend = visible.map((m) => ({
      id: m.id,
      name: m.name,
      color: seriesColor(m.colorSlot),
      radius: m.curveRadius,
    }))

    if (deskEnabled) {
      const W = Math.max(deskWidth, 1)
      const D = Math.max(deskDepth, 1)
      const padX = W * 0.04 + 0.5
      const padY = D * 0.06 + 0.5
      const vbW = W + padX * 2
      const vbH = D + padY * 2
      const desk = { x: padX, y: padY, w: W, h: D }

      const polylines = visible.map((m) => {
        const { widthIn } = physical(m)
        const cx = padX + (m.deskX / 100) * W
        const backY = padY + (m.deskY / 100) * D
        const points = arcLocalPoints(widthIn, m.curveRadius)
          .map(([x, y]) => `${(cx + x).toFixed(2)},${(backY + y).toFixed(2)}`)
          .join(' ')
        return { id: m.id, color: seriesColor(m.colorSlot), points }
      })

      return { mode: 'desk' as const, vbW, vbH, desk, polylines, legend }
    }

    // Curvature-only mode: apex/center/front aligned arcs, centered on box centers.
    const hAlign = alignment === 'center' ? 'center' : alignment.split('-')[1]
    const items = visible.map((m) => ({ m, widthIn: physical(m).widthIn }))
    const maxW = Math.max(...items.map((i) => i.widthIn))
    const centerXof = (w: number) =>
      hAlign === 'left' ? w / 2 : hAlign === 'right' ? maxW - w / 2 : maxW / 2

    const arcs = items.map(({ m, widthIn }) => {
      const local = arcLocalPoints(widthIn, m.curveRadius)
      const sag = local[local.length - 1][1]
      return { id: m.id, color: seriesColor(m.colorSlot), local, cx: centerXof(widthIn), sag, widthIn }
    })

    const offsetY = (sag: number) =>
      topViewAlign === 'back' ? 0 : topViewAlign === 'front' ? -sag : -sag / 2

    const xs = arcs.flatMap((a) => {
      const half = a.local.reduce((mx, [x]) => Math.max(mx, Math.abs(x)), 0)
      return [a.cx - half, a.cx + half]
    })
    const ys = arcs.flatMap((a) => a.local.map((p) => p[1] + offsetY(a.sag)))
    const xmin = Math.min(...xs)
    const xmax = Math.max(...xs)
    const ymin = Math.min(...ys)
    const ymax = Math.max(...ys)

    const padX = (xmax - xmin) * 0.04 + 0.4
    const vbW = xmax - xmin + padX * 2
    const contentH = ymax - ymin
    const vbH = Math.max(contentH + PAD_Y * 2, vbW / MAX_ASPECT)
    const shiftX = -xmin + padX
    const shiftY = -ymin + (vbH - contentH) / 2

    const polylines = arcs.map((a) => ({
      id: a.id,
      color: a.color,
      points: a.local
        .map(([x, y]) => `${(a.cx + x + shiftX).toFixed(2)},${(y + offsetY(a.sag) + shiftY).toFixed(2)}`)
        .join(' '),
    }))

    return { mode: 'arcs' as const, vbW, vbH, polylines, legend }
  }, [monitors, alignment, topViewAlign, deskEnabled, deskWidth, deskDepth])

  if (!layout) return null

  const heading = layout.mode === 'desk' ? 'Top view — on desk' : 'Top view — curvature'
  const caption =
    layout.mode === 'desk'
      ? `Desk ${formatLength(deskWidth, unit)} × ${formatLength(deskDepth, unit)} · viewer at the bottom · to scale`
      : 'Viewer at the bottom · to scale'

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{heading}</h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {layout.legend.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
            >
              <span className="size-2.5 flex-none rounded-[3px]" style={{ background: a.color }} />
              {a.name}
              <span className="text-[var(--text-muted)]">{a.radius ? `${a.radius}R` : 'Flat'}</span>
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        role="img"
        aria-label={layout.mode === 'desk' ? 'Top-down desk layout' : 'Top-down view of monitor curvature'}
      >
        {layout.mode === 'desk' && (
          <rect
            x={layout.desk.x}
            y={layout.desk.y}
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
