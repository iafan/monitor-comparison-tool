import { useEffect, useState } from 'react'
import { PRESETS } from '../constants'
import type { Monitor, MonitorInput } from '../types'

interface Props {
  /** The monitor being edited, or null when adding a new one. */
  editing: Monitor | null
  onSave: (input: MonitorInput) => void
  onClose: () => void
}

function presetKey(w: number | '', h: number | ''): string {
  if (w === '' || h === '') return ''
  const match = PRESETS.find((p) => p.resWidth === w && p.resHeight === h)
  return match ? `${match.resWidth}x${match.resHeight}` : ''
}

const fieldClass =
  'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2.5 text-base text-[var(--text-primary)]'
const labelClass = 'flex flex-col gap-1 text-sm text-[var(--text-secondary)]'

export function MonitorFormModal({ editing, onSave, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [resWidth, setResWidth] = useState<number | ''>(editing?.resWidth ?? '')
  const [resHeight, setResHeight] = useState<number | ''>(editing?.resHeight ?? '')
  const [diagonal, setDiagonal] = useState<number | ''>(editing?.diagonal ?? '')
  const preset = presetKey(resWidth, resHeight)

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !resWidth || !resHeight || !diagonal) return
    onSave({ name: trimmed, resWidth, resHeight, diagonal })
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
            <label className={`${labelClass} flex-1`}>
              <span>Res. width (px)</span>
              <input
                type="number"
                value={resWidth}
                onChange={(e) => setResWidth(e.target.value === '' ? '' : Number(e.target.value))}
                required
                min={1}
                step={1}
                inputMode="numeric"
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} flex-1`}>
              <span>Res. height (px)</span>
              <input
                type="number"
                value={resHeight}
                onChange={(e) => setResHeight(e.target.value === '' ? '' : Number(e.target.value))}
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
            <input
              type="number"
              value={diagonal}
              onChange={(e) => setDiagonal(e.target.value === '' ? '' : Number(e.target.value))}
              required
              min={1}
              step={0.1}
              inputMode="decimal"
              placeholder="e.g. 31.5"
              className={fieldClass}
            />
          </label>

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
