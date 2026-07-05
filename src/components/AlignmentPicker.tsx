import { ALIGN_LABELS, ALIGNMENTS, TOPVIEW_ALIGN_LABELS, TOPVIEW_ALIGNS } from '../constants'
import type { Alignment, TopViewAlign } from '../types'

interface Props {
  value: Alignment
  onChange: (alignment: Alignment) => void
  /** Top-view vertical alignment; the strip only renders when showTopView is true. */
  topViewAlign: TopViewAlign
  onTopViewAlignChange: (align: TopViewAlign) => void
  showTopView: boolean
}

/** Where the indicator bar sits inside each top-view cell. */
const BAR_JUSTIFY: Record<TopViewAlign, string> = {
  back: 'justify-start',
  center: 'justify-center',
  front: 'justify-end',
}

export function AlignmentPicker({
  value,
  onChange,
  topViewAlign,
  onTopViewAlignChange,
  showTopView,
}: Props) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-base font-semibold text-[var(--text-secondary)]">Box alignment</h2>
      <div className="flex flex-wrap items-start gap-4">
        <div>
          {showTopView && (
            <p className="mb-1 text-xs text-[var(--text-muted)]">Position</p>
          )}
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
                    className={`size-2 rounded-full ${selected ? 'bg-white' : 'bg-[var(--text-muted)]'}`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {showTopView && (
          <div>
            <p className="mb-1 text-xs text-[var(--text-muted)]">Top view</p>
            <div
              className="flex flex-col gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-1)] p-2.5"
              role="group"
              aria-label="Top view alignment"
            >
              {TOPVIEW_ALIGNS.map((key) => {
                const selected = key === topViewAlign
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTopViewAlignChange(key)}
                    aria-label={TOPVIEW_ALIGN_LABELS[key]}
                    aria-pressed={selected}
                    className={`flex aspect-square min-h-11 w-11 cursor-pointer flex-col ${BAR_JUSTIFY[key]} items-center rounded-md border py-2 ${
                      selected
                        ? 'border-[var(--series-1)] bg-[var(--series-1)]'
                        : 'border-[var(--border)] bg-[var(--page-plane)]'
                    }`}
                  >
                    <span
                      className={`h-[3px] w-3/5 rounded-full ${selected ? 'bg-white' : 'bg-[var(--text-muted)]'}`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
