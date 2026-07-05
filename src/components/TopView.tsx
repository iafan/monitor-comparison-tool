import { useMemo } from 'react'
import { seriesColor } from '../constants'
import { physical } from '../lib/geometry'
import type { Monitor } from '../types'

interface Props {
  monitors: Monitor[]
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
  /** Points in physical inches; apex (screen center) at (0, 0), curving toward +y. */
  points: [number, number][]
  halfChord: number
}

/**
 * Top-down view of screen curvature. A curved panel is a circular arc whose
 * length equals the panel's physical width and whose radius is the curvature
 * radius (e.g. 1500R = 1500 mm). Apex-aligned, drawn to scale, curving toward
 * the viewer at the bottom. Only shown when at least one visible panel is curved.
 */
export function TopView({ monitors }: Props) {
  const layout = useMemo(() => {
    const visible = monitors.filter((m) => m.visible)
    const anyCurved = visible.some((m) => m.curveRadius && m.curveRadius > 0)
    if (!anyCurved) return null

    const arcs: Arc[] = visible.map((m) => {
      const { widthIn } = physical(m)
      const color = seriesColor(m.colorSlot)
      if (m.curveRadius && m.curveRadius > 0) {
        const radiusIn = m.curveRadius / 25.4
        const theta = widthIn / radiusIn // subtended angle (radians)
        const points: [number, number][] = []
        for (let i = 0; i <= ARC_SAMPLES; i++) {
          const beta = -theta / 2 + (theta * i) / ARC_SAMPLES
          points.push([radiusIn * Math.sin(beta), radiusIn * (1 - Math.cos(beta))])
        }
        return {
          id: m.id,
          name: m.name,
          color,
          radius: m.curveRadius,
          points,
          halfChord: radiusIn * Math.sin(theta / 2),
        }
      }
      const points: [number, number][] = [
        [-widthIn / 2, 0],
        [widthIn / 2, 0],
      ]
      return { id: m.id, name: m.name, color, radius: null, points, halfChord: widthIn / 2 }
    })

    const maxHalf = Math.max(...arcs.map((a) => a.halfChord))
    const maxSag = Math.max(...arcs.flatMap((a) => a.points.map((p) => p[1])))
    const padX = maxHalf * 0.06 + 0.4
    const vbW = maxHalf * 2 + padX * 2
    // Keep the strip from collapsing to a hairline when arcs are very shallow.
    const vbH = Math.max(maxSag + PAD_Y * 2, vbW / MAX_ASPECT)
    const cx = vbW / 2

    const polylines = arcs.map((a) => ({
      id: a.id,
      color: a.color,
      points: a.points.map(([x, y]) => `${cx + x},${PAD_Y + y}`).join(' '),
    }))

    return { vbW, vbH, polylines, arcs }
  }, [monitors])

  if (!layout) return null

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Top view — curvature</h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {layout.arcs.map((a) => (
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
        preserveAspectRatio="xMidYMin meet"
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
