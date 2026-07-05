import { seriesColor } from '../constants'
import { formatNumber, physical } from '../lib/geometry'
import type { Monitor } from '../types'

interface Props {
  monitor: Monitor
  onToggle: (id: string) => void
  onEdit: (monitor: Monitor) => void
  onDelete: (monitor: Monitor) => void
}

export function MonitorCard({ monitor, onToggle, onEdit, onDelete }: Props) {
  const p = physical(monitor)

  return (
    <div
      className={`flex items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 ${
        monitor.visible ? '' : 'opacity-45'
      }`}
    >
      <input
        type="checkbox"
        checked={monitor.visible}
        onChange={() => onToggle(monitor.id)}
        aria-label={`Show ${monitor.name} in comparison`}
        className="size-4"
      />
      <span
        className="size-3.5 flex-none rounded-[4px]"
        style={{ background: seriesColor(monitor.colorSlot) }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{monitor.name}</div>
        <div className="text-xs text-[var(--text-muted)]">
          {monitor.resWidth}×{monitor.resHeight} · {monitor.diagonal}" ·{' '}
          {formatNumber(p.widthIn)}×{formatNumber(p.heightIn)} in · {Math.round(p.ppi)} PPI
        </div>
      </div>
      <div className="flex flex-none gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(monitor)}
          className="min-h-9 cursor-pointer rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm font-semibold"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(monitor)}
          className="min-h-9 cursor-pointer rounded-lg border border-[var(--danger)] px-2.5 py-1.5 text-sm font-semibold text-[var(--danger)]"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
