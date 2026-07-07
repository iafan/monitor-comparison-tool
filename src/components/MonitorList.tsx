import type { Monitor, Unit } from '../types'
import { MonitorCard } from './MonitorCard'

interface Props {
  monitors: Monitor[]
  unit: Unit
  onAdd: () => void
  onToggle: (id: string) => void
  onEdit: (monitor: Monitor) => void
  onDelete: (monitor: Monitor) => void
}

export function MonitorList({ monitors, unit, onAdd, onToggle, onEdit, onDelete }: Props) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--text-secondary)]">Monitors</h2>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Add monitor
        </button>
      </div>
      {monitors.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)]">No monitors yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              unit={unit}
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
