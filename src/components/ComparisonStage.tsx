import { useMemo } from 'react'
import { physical } from '../lib/geometry'
import type { Alignment, Monitor } from '../types'

interface Props {
  monitors: Monitor[]
  alignment: Alignment
  colors: Record<string, string>
}

const PAD = { left: 1, right: 1, top: 1, bottom: 1 }

export function ComparisonStage({ monitors, alignment, colors }: Props) {
  const layout = useMemo(() => {
    const visible = monitors.filter((m) => m.visible)
    if (visible.length === 0) return null

    const items = visible.map((m) => ({ m, ...physical(m) }))
    const maxW = Math.max(...items.map((i) => i.widthIn))
    const maxH = Math.max(...items.map((i) => i.heightIn))
    const vbW = maxW + PAD.left + PAD.right
    const vbH = maxH + PAD.top + PAD.bottom

    const [vAlign, hAlign] =
      alignment === 'center' ? (['center', 'center'] as const) : alignment.split('-')

    const boxX = (w: number) =>
      hAlign === 'left'
        ? PAD.left
        : hAlign === 'right'
          ? PAD.left + (maxW - w)
          : PAD.left + (maxW - w) / 2
    const boxY = (h: number) =>
      vAlign === 'top'
        ? PAD.top
        : vAlign === 'bottom'
          ? PAD.top + (maxH - h)
          : PAD.top + (maxH - h) / 2

    // Render in list order (largest area first), so the largest panel is drawn
    // first at the bottom of the z-order and smaller panels layer on top.
    const boxes = items.map(({ m, widthIn, heightIn }) => ({
      id: m.id,
      color: colors[m.id],
      x: boxX(widthIn),
      yTop: boxY(heightIn),
      widthIn,
      heightIn,
    }))

    return { vbW, vbH, boxes }
  }, [monitors, alignment, colors])

  const hasAny = monitors.length > 0
  const hint = !hasAny
    ? 'Add a monitor to see it rendered to scale.'
    : 'No monitors are currently visible. Check a monitor in the list below.'

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <h2 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">Front view</h2>
      {layout ? (
        <svg
          viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full"
          role="img"
          aria-label="Monitor size comparison diagram"
        >
          {layout.boxes.map((b) => (
            <g key={b.id}>
              {/* Surface-colored halo separates overlapping panel outlines. */}
              <rect
                x={b.x}
                y={b.yTop}
                width={b.widthIn}
                height={b.heightIn}
                rx={0.12}
                fill="none"
                stroke="var(--surface-1)"
                strokeWidth={6}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={b.x}
                y={b.yTop}
                width={b.widthIn}
                height={b.heightIn}
                rx={0.12}
                fill={b.color}
                fillOpacity={0.16}
                stroke={b.color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">{hint}</p>
      )}
    </section>
  )
}
