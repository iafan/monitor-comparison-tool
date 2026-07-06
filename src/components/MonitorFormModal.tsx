import { useEffect, useState } from 'react'
import { CURVATURE_PRESETS, PRESETS } from '../constants'
import { MONITOR_CLASSES, MONITOR_MODELS, classLabel, getClass } from '../data'
import type { MonitorClass, MonitorModel } from '../data'
import { NumberField } from './NumberField'
import type { Monitor, MonitorInput } from '../types'

interface Props {
  /** The monitor being edited, or null when adding a new one. */
  editing: Monitor | null
  onSave: (input: MonitorInput) => void
  onClose: () => void
}

/** How the geometry is being sourced in the form. */
type Source = 'custom' | 'class' | 'model'

function presetKey(w: number | null, h: number | null): string {
  if (w === null || h === null) return ''
  const match = PRESETS.find((p) => p.resWidth === w && p.resHeight === h)
  return match ? `${match.resWidth}x${match.resHeight}` : ''
}

/** A short editable name suggested when a class is picked, e.g. `34" 3440×1440 1800R`. */
function classNameSuggestion(c: MonitorClass): string {
  const curve = c.curveRadius ? ` ${c.curveRadius}R` : ''
  return `${c.diagonal}" ${c.resWidth}×${c.resHeight}${curve}`
}

const fieldClass =
  'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2.5 text-base text-[var(--text-primary)]'
const labelClass = 'flex flex-col gap-1 text-sm text-[var(--text-secondary)]'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'class', label: 'Class' },
  { value: 'model', label: 'Model' },
]

export function MonitorFormModal({ editing, onSave, onClose }: Props) {
  const [source, setSource] = useState<Source>('custom')
  const [name, setName] = useState(editing?.name ?? '')
  const [resWidth, setResWidth] = useState<number | null>(editing?.resWidth ?? null)
  const [resHeight, setResHeight] = useState<number | null>(editing?.resHeight ?? null)
  const [diagonal, setDiagonal] = useState<number | null>(editing?.diagonal ?? null)
  const [curved, setCurved] = useState(Boolean(editing?.curveRadius))
  const [curveRadius, setCurveRadius] = useState<number | null>(editing?.curveRadius ?? null)
  // Provenance: which class/model this geometry came from (undefined once edited by hand).
  const [classId, setClassId] = useState<string | undefined>(editing?.classId)
  const [modelId, setModelId] = useState<string | undefined>(editing?.modelId)
  const [classQuery, setClassQuery] = useState('')
  const [modelQuery, setModelQuery] = useState('')

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

  // Any hand-edit in Custom detaches the monitor from a class/model.
  const clearProvenance = () => {
    setClassId(undefined)
    setModelId(undefined)
  }

  const applyPreset = (value: string) => {
    if (!value) return
    const [w, h] = value.split('x').map(Number)
    setResWidth(w)
    setResHeight(h)
    clearProvenance()
  }

  const setCurvature = (isCurved: boolean) => {
    setCurved(isCurved)
    // Offer a sensible default radius the moment "Curved" is chosen.
    if (isCurved && curveRadius === null) setCurveRadius(1800)
    clearProvenance()
  }

  const selectClass = (c: MonitorClass) => {
    setResWidth(c.resWidth)
    setResHeight(c.resHeight)
    setDiagonal(c.diagonal)
    setCurved(Boolean(c.curveRadius))
    setCurveRadius(c.curveRadius)
    setClassId(c.id)
    setModelId(undefined)
  }

  const selectModel = (m: MonitorModel) => {
    const c = getClass(m.classId)
    if (!c) return
    setResWidth(c.resWidth)
    setResHeight(c.resHeight)
    setDiagonal(c.diagonal)
    setCurved(Boolean(c.curveRadius))
    setCurveRadius(c.curveRadius)
    setClassId(c.id)
    setModelId(m.id)
  }

  const q = (s: string) => s.trim().toLowerCase()
  const classMatches = (c: MonitorClass) => {
    const needle = q(classQuery)
    return !needle || classLabel(c).toLowerCase().includes(needle) || c.id.includes(needle)
  }
  const modelMatches = (m: MonitorModel) => {
    const needle = q(modelQuery)
    if (!needle) return true
    const cls = getClass(m.classId)
    const hay = `${m.brand} ${m.name} ${m.panelType} ${cls ? classLabel(cls) : ''}`.toLowerCase()
    return hay.includes(needle)
  }
  const filteredClasses = MONITOR_CLASSES.filter(classMatches)
  const filteredModels = MONITOR_MODELS.filter(modelMatches)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // Name is arbitrary only for Custom; Class/Model derive a fixed name from the selection.
    let finalName = name.trim()
    if (source === 'class') {
      const c = classId ? getClass(classId) : undefined
      if (!c) return
      finalName = classNameSuggestion(c)
    } else if (source === 'model') {
      const m = MONITOR_MODELS.find((x) => x.id === modelId)
      if (!m) return
      finalName = m.name
    }
    if (!finalName || !resWidth || !resHeight || !diagonal) return
    onSave({
      name: finalName,
      resWidth,
      resHeight,
      diagonal,
      curveRadius: curved && curveRadius ? curveRadius : null,
      classId,
      modelId,
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
          {/* Source selector — Custom keeps the manual fields (incl. name); Class/Model pick from the catalogue. */}
          <div
            className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]"
            role="group"
            aria-label="How to define the monitor"
          >
            {SOURCES.map((s) => {
              const selected = s.value === source
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  aria-pressed={selected}
                  className={`min-h-11 flex-1 px-3 text-sm font-semibold ${
                    selected
                      ? 'bg-[var(--series-1)] text-white'
                      : 'bg-[var(--page-plane)] text-[var(--text-secondary)]'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Fixed-height body (matches the Custom tab) so the dialog doesn't resize when switching tabs. */}
          <div className="flex min-h-[402px] flex-col gap-3.5">
          {source === 'custom' && (
            <>
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
                <select value={preset} onChange={(e) => applyPreset(e.target.value)} className={fieldClass}>
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
                    onCommit={(n) => {
                      setResWidth(n)
                      clearProvenance()
                    }}
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
                    onCommit={(n) => {
                      setResHeight(n)
                      clearProvenance()
                    }}
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
                  onCommit={(n) => {
                    setDiagonal(n)
                    clearProvenance()
                  }}
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
                      onChange={(e) => {
                        if (e.target.value) {
                          setCurveRadius(Number(e.target.value))
                          clearProvenance()
                        }
                      }}
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
                      onCommit={(n) => {
                        setCurveRadius(n)
                        clearProvenance()
                      }}
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
            </>
          )}

          {source === 'class' && (
            <div className={labelClass}>
              <span>Pick a class</span>
              <input
                type="text"
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                placeholder="Search by size, resolution or curvature…"
                className={fieldClass}
              />
              <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--border)]">
                {filteredClasses.length === 0 && (
                  <li className="px-3 py-2.5 text-sm text-[var(--text-muted)]">No matching classes</li>
                )}
                {filteredClasses.map((c) => {
                  const selected = classId === c.id && !modelId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => selectClass(c)}
                        aria-pressed={selected}
                        className={`block w-full border-b border-[var(--border)] px-3 py-2.5 text-left text-sm last:border-b-0 ${
                          selected ? 'bg-[var(--series-1)] text-white' : 'hover:bg-[var(--page-plane)]'
                        }`}
                      >
                        {classLabel(c)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {source === 'model' && (
            <div className={labelClass}>
              <span>Pick a model</span>
              <input
                type="text"
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder="Search by brand, model or panel…"
                className={fieldClass}
              />
              <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--border)]">
                {filteredModels.length === 0 && (
                  <li className="px-3 py-2.5 text-sm text-[var(--text-muted)]">No matching models</li>
                )}
                {filteredModels.map((m) => {
                  const selected = modelId === m.id
                  const cls = getClass(m.classId)
                  const meta = [cls && classLabel(cls), m.panelType, m.releaseYear]
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => selectModel(m)}
                        aria-pressed={selected}
                        className={`flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-3 py-2.5 text-left last:border-b-0 ${
                          selected ? 'bg-[var(--series-1)] text-white' : 'hover:bg-[var(--page-plane)]'
                        }`}
                      >
                        <span className="text-sm font-semibold">{m.name}</span>
                        <span
                          className={`text-xs ${selected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}
                        >
                          {meta}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          </div>

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
