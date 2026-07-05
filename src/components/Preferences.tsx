import { useEffect, useState } from 'react'
import { UNIT_LABELS, UNITS, formatLength, roundToUnit, toInches } from '../lib/units'
import type { Preferences as Prefs, Unit } from '../types'

interface Props {
  preferences: Prefs
  onChange: (patch: Partial<Prefs>) => void
}

const fieldClass =
  'min-h-11 w-24 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2 text-base text-[var(--text-primary)]'
const pctFieldClass =
  'min-h-11 w-16 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2 text-base text-[var(--text-primary)]'
const labelClass = 'flex flex-col gap-1 text-sm text-[var(--text-secondary)]'

export function Preferences({ preferences, onChange }: Props) {
  const { unit, deskEnabled, deskWidth, deskDepth, deskX, deskY } = preferences

  // Desk fields are edited in the current unit; canonical storage stays in inches.
  const [widthStr, setWidthStr] = useState(String(roundToUnit(deskWidth, unit)))
  const [depthStr, setDepthStr] = useState(String(roundToUnit(deskDepth, unit)))

  // Re-sync the visible values when the unit changes (or desk dims change elsewhere).
  useEffect(() => {
    setWidthStr(String(roundToUnit(deskWidth, unit)))
    setDepthStr(String(roundToUnit(deskDepth, unit)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])

  const commitDesk = (raw: string, key: 'deskWidth' | 'deskDepth') => {
    const num = Number(raw)
    if (raw !== '' && Number.isFinite(num) && num > 0) {
      onChange({ [key]: toInches(num, unit) })
    }
  }

  const commitPercent = (raw: string, key: 'deskX' | 'deskY') => {
    if (raw === '') return
    const num = Number(raw)
    if (Number.isFinite(num)) onChange({ [key]: Math.min(100, Math.max(0, num)) })
  }

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

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={deskEnabled}
            onChange={(e) => onChange({ deskEnabled: e.target.checked })}
            className="size-4"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Show monitors on a desk (top-down)
          </span>
        </label>

        {deskEnabled && (
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {/* Desk dimensions — wrap together */}
            <div className="flex gap-4">
              <label className={labelClass}>
                <span>Desk width ({UNIT_LABELS[unit]})</span>
                <input
                  type="number"
                  min={1}
                  step="any"
                  inputMode="decimal"
                  value={widthStr}
                  onChange={(e) => {
                    setWidthStr(e.target.value)
                    commitDesk(e.target.value, 'deskWidth')
                  }}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span>Desk depth ({UNIT_LABELS[unit]})</span>
                <input
                  type="number"
                  min={1}
                  step="any"
                  inputMode="decimal"
                  value={depthStr}
                  onChange={(e) => {
                    setDepthStr(e.target.value)
                    commitDesk(e.target.value, 'deskDepth')
                  }}
                  className={fieldClass}
                />
              </label>
            </div>

            {/* Monitor placement — X and Y stay on one row */}
            <div className="flex gap-4">
              <label className={labelClass}>
                <span>Monitor X (% from left)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    inputMode="numeric"
                    value={deskX}
                    onChange={(e) => commitPercent(e.target.value, 'deskX')}
                    className={pctFieldClass}
                  />
                  <span className="text-xs whitespace-nowrap text-[var(--text-muted)]">
                    = {formatLength((deskX / 100) * deskWidth, unit)}
                  </span>
                </div>
              </label>
              <label className={labelClass}>
                <span>Monitor Y (% from far edge)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    inputMode="numeric"
                    value={deskY}
                    onChange={(e) => commitPercent(e.target.value, 'deskY')}
                    className={pctFieldClass}
                  />
                  <span className="text-xs whitespace-nowrap text-[var(--text-muted)]">
                    = {formatLength((deskY / 100) * deskDepth, unit)}
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
