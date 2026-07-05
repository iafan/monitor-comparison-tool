import { ALIGN_LABELS, ALIGNMENTS } from '../constants'
import type { Alignment } from '../types'

interface Props {
  value: Alignment
  onChange: (alignment: Alignment) => void
}

export function AlignmentPicker({ value, onChange }: Props) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-base font-semibold text-[var(--text-secondary)]">Box alignment</h2>
      <div
        className="grid max-w-[180px] grid-cols-3 gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] p-2.5"
        role="group"
        aria-label="Box alignment"
      >
        {ALIGNMENTS.map((key) => {
          const selected = key === value
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-label={ALIGN_LABELS[key]}
              aria-pressed={selected}
              className={`flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-md border ${
                selected
                  ? 'border-[var(--series-1)] bg-[var(--series-1)]'
                  : 'border-[var(--border)] bg-[var(--page-plane)]'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  selected ? 'bg-white' : 'bg-[var(--text-muted)]'
                }`}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
