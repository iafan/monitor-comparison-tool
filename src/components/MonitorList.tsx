import type { Monitor, Unit } from '../types'
import { MonitorCard } from './MonitorCard'

interface Props {
  monitors: Monitor[]
  unit: Unit
  /** Per-monitor swatch colors (comparison). Omit for plain library cards. */
  colors?: Record<string, string>
  onAdd: () => void
  /** Provide to show include-in-comparison checkboxes. */
  onToggle?: (id: string) => void
  /** Provide to show per-card Edit buttons. */
  onEdit?: (monitor: Monitor) => void
  onDelete: (monitor: Monitor) => void
  title?: string
  addLabel?: string
  emptyText?: string
}

export function MonitorList({
  monitors,
  unit,
  colors,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  title = 'Monitors',
  addLabel = '+ Add monitor',
  emptyText = 'No monitors yet.',
}: Props) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--text-secondary)]">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {addLabel}
        </button>
      </div>
      {monitors.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--text-muted)]">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              unit={unit}
              color={colors?.[m.id]}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
