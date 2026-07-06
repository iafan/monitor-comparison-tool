import { useState } from 'react'
import { seriesColor } from '../constants'
import { makeClassId, modelsInClass } from '../data'
import { physical } from '../lib/geometry'
import { UNIT_LABELS, formatLength } from '../lib/units'
import type { Monitor, Unit } from '../types'

interface Props {
  monitor: Monitor
  unit: Unit
  onToggle: (id: string) => void
  onEdit: (monitor: Monitor) => void
  onDelete: (monitor: Monitor) => void
}

export function MonitorCard({ monitor, unit, onToggle, onEdit, onDelete }: Props) {
  const p = physical(monitor)
  const [showMatches, setShowMatches] = useState(false)
  // Map to a class — its own if created from one, otherwise derived from geometry —
  // then find the catalogued models that share that class.
  const classId = monitor.classId ?? makeClassId(monitor)
  const matches = modelsInClass(classId)

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
          {formatLength(p.widthIn, unit, false)}×{formatLength(p.heightIn, unit, false)}{' '}
          {UNIT_LABELS[unit]} · {Math.round(p.ppi)} PPI ·{' '}
          {monitor.curveRadius ? `${monitor.curveRadius}R` : 'Flat'}
        </div>
        {matches.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)]">No matching monitors in the database</div>
        ) : (
          <div className="text-xs">
            <button
              type="button"
              onClick={() => setShowMatches((v) => !v)}
              aria-expanded={showMatches}
              className="cursor-pointer text-[var(--text-secondary)] underline"
            >
              {matches.length} matching monitor{matches.length === 1 ? '' : 's'} in the database
            </button>
            {showMatches && (
              <ol className="mt-1 list-decimal pl-5 text-[var(--text-muted)]">
                {matches.map((m) => (
                  <li key={m.id}>{m.name}</li>
                ))}
              </ol>
            )}
          </div>
        )}
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
