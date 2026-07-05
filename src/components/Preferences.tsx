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

  // Inputs keep their own editable string so the field can be blanked while
  // typing; the stored value only updates from valid input, and blur normalizes
  // the text back to the committed (and, for percents, clamped) value.
  const [widthStr, setWidthStr] = useState(String(roundToUnit(deskWidth, unit)))
  const [depthStr, setDepthStr] = useState(String(roundToUnit(deskDepth, unit)))
  const [xStr, setXStr] = useState(String(deskX))
  const [yStr, setYStr] = useState(String(deskY))

  // Re-sync the desk-size text when the unit changes (percents are unit-free).
  useEffect(() => {
    setWidthStr(String(roundToUnit(deskWidth, unit)))
    setDepthStr(String(roundToUnit(deskDepth, unit)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])

  const changeDesk = (raw: string, key: 'deskWidth' | 'deskDepth', set: (s: string) => void) => {
    set(raw)
    const num = Number(raw)
    if (raw !== '' && Number.isFinite(num) && num > 0) onChange({ [key]: toInches(num, unit) })
  }

  const blurDesk = (
    raw: string,
    key: 'deskWidth' | 'deskDepth',
    current: number,
    set: (s: string) => void,
  ) => {
    const num = Number(raw)
    const inches = raw !== '' && Number.isFinite(num) && num > 0 ? toInches(num, unit) : current
    onChange({ [key]: inches })
    set(String(roundToUnit(inches, unit)))
  }

  const changePercent = (raw: string, key: 'deskX' | 'deskY', set: (s: string) => void) => {
    set(raw)
    const num = Number(raw)
    if (raw !== '' && Number.isFinite(num)) onChange({ [key]: Math.min(100, Math.max(0, num)) })
  }

  const blurPercent = (
    raw: string,
    key: 'deskX' | 'deskY',
    current: number,
    set: (s: string) => void,
  ) => {
    const num = Number(raw)
    const value = raw !== '' && Number.isFinite(num) ? Math.min(100, Math.max(0, num)) : current
    onChange({ [key]: value })
    set(String(value))
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
                  onChange={(e) => changeDesk(e.target.value, 'deskWidth', setWidthStr)}
                  onBlur={(e) => blurDesk(e.target.value, 'deskWidth', deskWidth, setWidthStr)}
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
                  onChange={(e) => changeDesk(e.target.value, 'deskDepth', setDepthStr)}
                  onBlur={(e) => blurDesk(e.target.value, 'deskDepth', deskDepth, setDepthStr)}
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
                    value={xStr}
                    onChange={(e) => changePercent(e.target.value, 'deskX', setXStr)}
                    onBlur={(e) => blurPercent(e.target.value, 'deskX', deskX, setXStr)}
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
                    value={yStr}
                    onChange={(e) => changePercent(e.target.value, 'deskY', setYStr)}
                    onBlur={(e) => blurPercent(e.target.value, 'deskY', deskY, setYStr)}
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
