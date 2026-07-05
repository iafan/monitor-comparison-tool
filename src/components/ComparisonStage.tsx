import { useMemo } from 'react'
import { seriesColor } from '../constants'
import { physical } from '../lib/geometry'
import { deoverlap } from '../lib/labels'
import { useElementSize } from '../hooks/useElementSize'
import type { Alignment, Monitor } from '../types'

interface Props {
  monitors: Monitor[]
  alignment: Alignment
}

const PAD = { left: 1, right: 1, top: 1.2, bottom: 1 }
const LABEL_MIN_GAP = 22

export function ComparisonStage({ monitors, alignment }: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>()

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

    // Largest area first, so smaller panels layer on top and stay visible.
    const boxes = [...items]
      .sort((a, b) => b.widthIn * b.heightIn - a.widthIn * a.heightIn)
      .map(({ m, widthIn, heightIn }) => ({
        id: m.id,
        name: m.name,
        color: seriesColor(m.colorSlot),
        x: boxX(widthIn),
        yTop: boxY(heightIn),
        widthIn,
        heightIn,
      }))

    // Position labels in pixel space and nudge them apart so they don't overlap.
    const labels = deoverlap(
      boxes.map((b) => ({
        id: b.id,
        name: b.name,
        color: b.color,
        left: (b.x / vbW) * size.width,
        top: (b.yTop / vbH) * size.height,
      })),
      LABEL_MIN_GAP,
    )

    return { vbW, vbH, boxes, labels }
  }, [monitors, alignment, size.width, size.height])

  const hasAny = monitors.length > 0
  const hint = !hasAny
    ? 'Add a monitor to see it rendered to scale.'
    : 'No monitors are currently visible. Check a monitor in the list below.'

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div ref={ref} className="relative aspect-[16/11] w-full">
        {layout && (
          <>
            <svg
              viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
              preserveAspectRatio="xMinYMax meet"
              className="block size-full"
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
            <div className="pointer-events-none absolute inset-0">
              {layout.labels.map((label) => (
                <div
                  key={label.id}
                  className="absolute flex max-w-[calc(100%-12px)] translate-x-1.5 translate-y-1.5 items-center gap-1 overflow-hidden rounded-[4px] px-1.5 py-0.5 text-xs font-semibold text-ellipsis whitespace-nowrap text-[var(--text-primary)]"
                  style={{
                    left: label.left,
                    top: label.top,
                    background: 'color-mix(in srgb, var(--surface-1) 80%, transparent)',
                  }}
                >
                  <span
                    className="size-2 flex-none rounded-[2px]"
                    style={{ background: label.color }}
                  />
                  {label.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {!layout && (
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">{hint}</p>
      )}
    </section>
  )
}
