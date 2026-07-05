import { useEffect, useState } from 'react'
import { CURVATURE_PRESETS, PRESETS } from '../constants'
import { NumberField } from './NumberField'
import type { Monitor, MonitorInput } from '../types'

interface Props {
  /** The monitor being edited, or null when adding a new one. */
  editing: Monitor | null
  onSave: (input: MonitorInput) => void
  onClose: () => void
}

function presetKey(w: number | null, h: number | null): string {
  if (w === null || h === null) return ''
  const match = PRESETS.find((p) => p.resWidth === w && p.resHeight === h)
  return match ? `${match.resWidth}x${match.resHeight}` : ''
}

const fieldClass =
  'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2.5 text-base text-[var(--text-primary)]'
const labelClass = 'flex flex-col gap-1 text-sm text-[var(--text-secondary)]'

export function MonitorFormModal({ editing, onSave, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [resWidth, setResWidth] = useState<number | null>(editing?.resWidth ?? null)
  const [resHeight, setResHeight] = useState<number | null>(editing?.resHeight ?? null)
  const [diagonal, setDiagonal] = useState<number | null>(editing?.diagonal ?? null)
  const [curved, setCurved] = useState(Boolean(editing?.curveRadius))
  const [curveRadius, setCurveRadius] = useState<number | null>(editing?.curveRadius ?? null)
  const preset = presetKey(resWidth, resHeight)
  const radiusPreset =
    curveRadius !== null && CURVATURE_PRESETS.includes(curveRadius) ? String(curveRadius) : ''

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const applyPreset = (value: string) => {
    if (!value) return
    const [w, h] = value.split('x').map(Number)
    setResWidth(w)
    setResHeight(h)
  }

  const setCurvature = (isCurved: boolean) => {
    setCurved(isCurved)
    // Offer a sensible default radius the moment "Curved" is chosen.
    if (isCurved && curveRadius === null) setCurveRadius(1800)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !resWidth || !resHeight || !diagonal) return
    onSave({
      name: trimmed,
      resWidth,
      resHeight,
      diagonal,
      curveRadius: curved && curveRadius ? curveRadius : null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-[var(--surface-1)] p-5 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monitor-form-title"
      >
        <h2 id="monitor-form-title" className="mb-4 text-base font-semibold">
          {editing ? 'Edit monitor' : 'Add monitor'}
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <label className={labelClass}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              placeholder={'e.g. QHD 27"'}
              autoFocus
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span>Preset</span>
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              className={fieldClass}
            >
              <option value="">Custom…</option>
              {PRESETS.map((p) => (
                <option key={p.label} value={`${p.resWidth}x${p.resHeight}`}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className={`${labelClass} min-w-0 flex-1`}>
              <span>Resolution width (px)</span>
              <NumberField
                value={resWidth}
                onCommit={(n) => setResWidth(n)}
                allowEmpty
                required
                min={1}
                step={1}
                inputMode="numeric"
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} min-w-0 flex-1`}>
              <span>Resolution height (px)</span>
              <NumberField
                value={resHeight}
                onCommit={(n) => setResHeight(n)}
                allowEmpty
                required
                min={1}
                step={1}
                inputMode="numeric"
                className={fieldClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            <span>Diagonal size (inches)</span>
            <NumberField
              value={diagonal}
              onCommit={(n) => setDiagonal(n)}
              allowEmpty
              required
              min={1}
              step={0.1}
              inputMode="decimal"
              placeholder="e.g. 31.5"
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span>Screen curvature</span>
            <select
              value={curved ? 'curved' : 'flat'}
              onChange={(e) => setCurvature(e.target.value === 'curved')}
              className={fieldClass}
            >
              <option value="flat">Flat</option>
              <option value="curved">Curved</option>
            </select>
          </label>

          {curved && (
            <div className="flex gap-3">
              <label className={`${labelClass} min-w-0 flex-1`}>
                <span>Typical radius</span>
                <select
                  value={radiusPreset}
                  onChange={(e) => e.target.value && setCurveRadius(Number(e.target.value))}
                  className={fieldClass}
                >
                  <option value="">Custom…</option>
                  {CURVATURE_PRESETS.map((r) => (
                    <option key={r} value={r}>
                      {r}R
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${labelClass} min-w-0 flex-1`}>
                <span>Radius (mm)</span>
                <NumberField
                  value={curveRadius}
                  onCommit={(n) => setCurveRadius(n)}
                  allowEmpty
                  min={100}
                  step={50}
                  inputMode="numeric"
                  placeholder="e.g. 1800"
                  className={fieldClass}
                />
              </label>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {editing ? 'Save changes' : 'Add monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
