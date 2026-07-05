import { useMemo } from 'react'
import { seriesColor } from '../constants'
import { physical } from '../lib/geometry'
import type { Alignment, Monitor, TopViewAlign } from '../types'

interface Props {
  monitors: Monitor[]
  alignment: Alignment
  topViewAlign: TopViewAlign
}

const PAD_Y = 0.5
const ARC_SAMPLES = 48
/** Cap how wide/short the strip can get so shallow arcs still render a visible band. */
const MAX_ASPECT = 7

interface Arc {
  id: string
  name: string
  color: string
  radius: number | null
  /** Points in physical inches; apex at (0, 0), curving toward +y (viewer). */
  local: [number, number][]
  /** Horizontal center (apex x), from the box alignment. */
  cx: number
  /** Half the chord width — horizontal reach from the center. */
  halfExtent: number
  /** Arc depth (0 for flat). */
  sag: number
}

/**
 * Top-down view of screen curvature. A curved panel is a circular arc whose
 * length equals its physical width and whose radius is the curvature radius
 * (e.g. 1500R = 1500 mm), drawn to scale. Arcs are centered horizontally on
 * each panel's box center (from the front-view alignment) and stacked
 * vertically per the top-view alignment. Only shown when a visible panel is curved.
 */
export function TopView({ monitors, alignment, topViewAlign }: Props) {
  const layout = useMemo(() => {
    const visible = monitors.filter((m) => m.visible)
    if (!visible.some((m) => m.curveRadius && m.curveRadius > 0)) return null

    const hAlign = alignment === 'center' ? 'center' : alignment.split('-')[1]
    const items = visible.map((m) => ({ m, widthIn: physical(m).widthIn }))
    const maxW = Math.max(...items.map((i) => i.widthIn))
    // Horizontal center of each panel's box — matches how the front view places
    // box centers (using flat physical width), so curved chords still center right.
    const centerXof = (w: number) =>
      hAlign === 'left' ? w / 2 : hAlign === 'right' ? maxW - w / 2 : maxW / 2

    const arcs: Arc[] = items.map(({ m, widthIn }) => {
      const color = seriesColor(m.colorSlot)
      const cx = centerXof(widthIn)
      if (m.curveRadius && m.curveRadius > 0) {
        const radiusIn = m.curveRadius / 25.4
        const theta = widthIn / radiusIn
        const local: [number, number][] = []
        for (let i = 0; i <= ARC_SAMPLES; i++) {
          const beta = -theta / 2 + (theta * i) / ARC_SAMPLES
          local.push([radiusIn * Math.sin(beta), radiusIn * (1 - Math.cos(beta))])
        }
        return {
          id: m.id,
          name: m.name,
          color,
          radius: m.curveRadius,
          local,
          cx,
          halfExtent: radiusIn * Math.sin(theta / 2),
          sag: radiusIn * (1 - Math.cos(theta / 2)),
        }
      }
      const local: [number, number][] = [
        [-widthIn / 2, 0],
        [widthIn / 2, 0],
      ]
      return { id: m.id, name: m.name, color, radius: null, local, cx, halfExtent: widthIn / 2, sag: 0 }
    })

    // Vertical offset per arc so the chosen reference line (apex / mid / edge) aligns.
    const offsetY = (sag: number) =>
      topViewAlign === 'back' ? 0 : topViewAlign === 'front' ? -sag : -sag / 2

    const xs = arcs.flatMap((a) => [a.cx - a.halfExtent, a.cx + a.halfExtent])
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
    const shiftY = -ymin + (vbH - contentH) / 2 // vertically center the group

    const polylines = arcs.map((a) => ({
      id: a.id,
      color: a.color,
      points: a.local
        .map(([x, y]) => `${a.cx + x + shiftX},${y + offsetY(a.sag) + shiftY}`)
        .join(' '),
    }))

    const legend = arcs.map((a) => ({ id: a.id, name: a.name, color: a.color, radius: a.radius }))
    return { vbW, vbH, polylines, legend }
  }, [monitors, alignment, topViewAlign])

  if (!layout) return null

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Top view — curvature</h2>
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
        aria-label="Top-down view of monitor curvature"
      >
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
      <p className="mt-1 text-center text-xs text-[var(--text-muted)]">
        Viewer at the bottom · to scale
      </p>
    </section>
  )
}
