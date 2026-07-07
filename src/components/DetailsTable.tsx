import { seriesColor } from '../constants'
import { formatNumber, physical } from '../lib/geometry'
import { formatLength } from '../lib/units'
import type { Monitor, Unit } from '../types'

interface Props {
  monitors: Monitor[]
  unit: Unit
}

const HEADERS = [
  '',
  'Name',
  'Resolution',
  'Ratio',
  'Diagonal',
  'Width',
  'Height',
  'PPI',
  'Pixel pitch',
  'Curvature',
]

export function DetailsTable({ monitors, unit }: Props) {
  // Only the enabled (visible) monitors — this table replaces the legend at the top.
  const visible = monitors.filter((m) => m.visible)
  return (
    <section className="mb-3">
      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)]">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          <thead>
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-[var(--gridline)] bg-[var(--surface-1)] px-2.5 py-2 font-semibold text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="p-4 text-center text-[var(--text-muted)]">
                  No monitors to display.
                </td>
              </tr>
            ) : (
              visible.map((m) => {
                const p = physical(m)
                return (
                  <tr key={m.id} className="[&>td]:border-b [&>td]:border-[var(--gridline)] last:[&>td]:border-b-0">
                    <td className="px-2.5 py-2">
                      <span
                        className="inline-block size-3 rounded-[3px]"
                        style={{ background: seriesColor(m.colorSlot) }}
                      />
                    </td>
                    <td className="px-2.5 py-2">{m.name}</td>
                    <td className="px-2.5 py-2 tabular-nums">
                      {m.resWidth}×{m.resHeight}
                    </td>
                    <td className="px-2.5 py-2 tabular-nums">{p.ratio}</td>
                    <td className="px-2.5 py-2 tabular-nums">{m.diagonal}"</td>
                    <td className="px-2.5 py-2 tabular-nums">{formatLength(p.widthIn, unit)}</td>
                    <td className="px-2.5 py-2 tabular-nums">{formatLength(p.heightIn, unit)}</td>
                    <td className="px-2.5 py-2 tabular-nums">{Math.round(p.ppi)}</td>
                    <td className="px-2.5 py-2 tabular-nums">{formatNumber(p.pitchMm, 3)} mm</td>
                    <td className="px-2.5 py-2 tabular-nums">
                      {m.curveRadius ? `${m.curveRadius}R` : 'Flat'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
