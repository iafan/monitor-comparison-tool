import type { Monitor } from '../types'
import { MonitorCard } from './MonitorCard'

interface Props {
  monitors: Monitor[]
  onToggle: (id: string) => void
  onEdit: (monitor: Monitor) => void
  onDelete: (monitor: Monitor) => void
}

export function MonitorList({ monitors, onToggle, onEdit, onDelete }: Props) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-base font-semibold text-[var(--text-secondary)]">Monitors</h2>
      {monitors.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)]">No monitors yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
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
