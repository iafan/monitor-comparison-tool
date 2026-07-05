import { UNIT_LABELS, UNITS } from '../lib/units'
import type { Preferences as Prefs, Unit } from '../types'

interface Props {
  preferences: Prefs
  onChange: (patch: Partial<Prefs>) => void
}

export function Preferences({ preferences, onChange }: Props) {
  const { unit } = preferences

  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-base font-semibold text-[var(--text-secondary)]">Preferences</h2>
      <div className="flex flex-col gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Units</span>
          <div
            className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]"
            role="group"
            aria-label="Length units"
          >
            {UNITS.map((u: Unit) => {
              const selected = u === unit
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onChange({ unit: u })}
                  aria-pressed={selected}
                  className={`min-h-11 min-w-14 px-3 text-sm font-semibold ${
                    selected
                      ? 'bg-[var(--series-1)] text-white'
                      : 'bg-[var(--page-plane)] text-[var(--text-secondary)]'
                  }`}
                >
                  {UNIT_LABELS[u]}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Affects Width/Height and desk size. Diagonal stays in inches.
          </span>
        </div>
      </div>
    </section>
  )
}
