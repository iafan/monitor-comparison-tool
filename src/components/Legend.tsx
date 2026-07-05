import { seriesColor } from '../constants'
import type { Monitor } from '../types'

interface Props {
  monitors: Monitor[]
}

export function Legend({ monitors }: Props) {
  return (
    <section className="mb-3 flex min-h-6 flex-wrap gap-x-4 gap-y-2" aria-label="Monitor legend">
      {monitors
        .filter((m) => m.visible)
        .map((m) => (
          <span
            key={m.id}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]"
          >
            <span
              className="size-3 flex-none rounded-[3px]"
              style={{ background: seriesColor(m.colorSlot) }}
            />
            {m.name}
          </span>
        ))}
    </section>
  )
}
