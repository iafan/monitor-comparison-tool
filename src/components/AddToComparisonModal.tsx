import { useState, type ReactNode } from 'react'
import { MONITOR_CLASSES, MONITOR_MODELS, classLabel, getClass } from '../data'
import type { MonitorClass, MonitorModel } from '../data'
import { matchesQuery } from '../lib/search'
import { Dialog } from './Dialog'
import type { Monitor, MonitorInput } from '../types'

interface Props {
  /** The viewer's saved custom-monitor library (the "My monitors" tab). */
  myMonitors: Monitor[]
  onAdd: (input: MonitorInput) => void
  onClose: () => void
  /** Switch to the My Monitors tool (from the empty-state link). */
  onGoToMyMonitors: () => void
}

/** Which catalogue the monitor is being picked from. */
type Source = 'my' | 'class' | 'model'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'my', label: 'My monitors' },
  { value: 'class', label: 'Class' },
  { value: 'model', label: 'Model' },
]

const fieldClass =
  'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--page-plane)] px-3 py-2.5 text-base text-[var(--text-primary)]'
const labelClass = 'flex flex-col gap-1 text-sm text-[var(--text-secondary)]'

/** A short name suggested when a class is picked, e.g. `34" 3440×1440 1800R`. */
function classNameSuggestion(c: MonitorClass): string {
  const curve = c.curveRadius ? ` ${c.curveRadius}R` : ''
  return `${c.diagonal}" ${c.resWidth}×${c.resHeight}${curve}`
}

const rowClass = (selected: boolean) =>
  `block w-full border-b border-[var(--border)] px-3 py-2.5 text-left text-sm last:border-b-0 ${
    selected ? 'bg-[var(--series-1)] text-white' : 'hover:bg-[var(--page-plane)]'
  }`

interface PickListProps<T> {
  /** Caption above the search box. */
  label: string
  placeholder: string
  /** Shown when the search matches nothing. */
  emptyText: string
  query: string
  onQuery: (value: string) => void
  /** Already-filtered items to list. */
  items: T[]
  getId: (item: T) => string
  selectedId: string | null
  onSelect: (id: string) => void
  /** The row's inner content; `selected` lets it tune its own muted colors. */
  renderRow: (item: T, selected: boolean) => ReactNode
}

/** A labelled search box over a scrolling list of selectable rows — the shared
 *  shell behind every "add monitor" source tab (My monitors / Class / Model). */
function PickList<T>({
  label,
  placeholder,
  emptyText,
  query,
  onQuery,
  items,
  getId,
  selectedId,
  onSelect,
  renderRow,
}: PickListProps<T>) {
  return (
    <div className={`${labelClass} min-h-0 flex-1`}>
      <span>{label}</span>
      <input
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      <ul className="mt-1 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--border)]">
        {items.length === 0 && (
          <li className="px-3 py-2.5 text-sm text-[var(--text-muted)]">{emptyText}</li>
        )}
        {items.map((item) => {
          const id = getId(item)
          const selected = selectedId === id
          return (
            <li key={id}>
              <button type="button" onClick={() => onSelect(id)} aria-pressed={selected} className={rowClass(selected)}>
                {renderRow(item, selected)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AddToComparisonModal({ myMonitors, onAdd, onClose, onGoToMyMonitors }: Props) {
  const [source, setSource] = useState<Source>('my')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [myQuery, setMyQuery] = useState('')
  const [classQuery, setClassQuery] = useState('')
  const [modelQuery, setModelQuery] = useState('')

  const switchSource = (s: Source) => {
    setSource(s)
    setSelectedId(null)
  }

  const myMatches = (m: Monitor) => {
    const curve = m.curveRadius ? `${m.curveRadius}r` : 'flat'
    return matchesQuery(myQuery, `${m.name} ${m.resWidth}×${m.resHeight} ${m.diagonal} ${curve}`)
  }
  const classMatches = (c: MonitorClass) => matchesQuery(classQuery, `${classLabel(c)} ${c.id}`)
  const modelMatches = (m: MonitorModel) => {
    const cls = getClass(m.classId)
    return matchesQuery(modelQuery, `${m.brand} ${m.name} ${m.panelType} ${cls ? classLabel(cls) : ''}`)
  }

  const filteredMy = myMonitors.filter(myMatches)
  const filteredClasses = MONITOR_CLASSES.filter(classMatches)
  const filteredModels = MONITOR_MODELS.filter(modelMatches)

  const buildInput = (): MonitorInput | null => {
    if (!selectedId) return null
    if (source === 'my') {
      const m = myMonitors.find((x) => x.id === selectedId)
      if (!m) return null
      return {
        name: m.name,
        resWidth: m.resWidth,
        resHeight: m.resHeight,
        diagonal: m.diagonal,
        curveRadius: m.curveRadius,
        classId: undefined,
        modelId: undefined,
      }
    }
    if (source === 'class') {
      const c = getClass(selectedId)
      if (!c) return null
      return {
        name: classNameSuggestion(c),
        resWidth: c.resWidth,
        resHeight: c.resHeight,
        diagonal: c.diagonal,
        curveRadius: c.curveRadius,
        classId: c.id,
        modelId: undefined,
      }
    }
    const m = MONITOR_MODELS.find((x) => x.id === selectedId)
    const c = m && getClass(m.classId)
    if (!m || !c) return null
    return {
      name: m.name,
      resWidth: c.resWidth,
      resHeight: c.resHeight,
      diagonal: c.diagonal,
      curveRadius: c.curveRadius,
      classId: c.id,
      modelId: m.id,
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = buildInput()
    if (input) onAdd(input)
  }

  return (
    <Dialog title="Add monitor" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div
          className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]"
          role="group"
          aria-label="Where to pick the monitor from"
        >
          {SOURCES.map((s) => {
            const selected = s.value === source
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => switchSource(s.value)}
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

        {/* Stable body height so switching tabs never resizes the dialog: track the
            viewport (good on mobile) but floor and cap it; lists scroll within. */}
        <div className="flex h-[60vh] max-h-[460px] min-h-[320px] flex-col gap-3.5">
          {source === 'my' &&
            (myMonitors.length === 0 ? (
              <div className={`${labelClass} min-h-0 flex-1`}>
                <p className="my-auto text-center text-sm text-[var(--text-muted)]">
                  Your My Monitors list is empty. Add your monitors in the{' '}
                  <button
                    type="button"
                    onClick={onGoToMyMonitors}
                    className="cursor-pointer font-semibold whitespace-nowrap text-[var(--series-1)] underline"
                  >
                    My Monitors
                  </button>{' '}
                  tool to pick them here and use them across the other tools.
                </p>
              </div>
            ) : (
              <PickList
                label="Pick one of your monitors"
                placeholder="Search by name, resolution or curvature…"
                emptyText="No matching monitors"
                query={myQuery}
                onQuery={setMyQuery}
                items={filteredMy}
                getId={(m) => m.id}
                selectedId={selectedId}
                onSelect={setSelectedId}
                renderRow={(m, selected) => (
                  <>
                    <span className="font-semibold">{m.name}</span>
                    <span className={selected ? 'text-white/80' : 'text-[var(--text-muted)]'}>
                      {' '}
                      · {m.resWidth}×{m.resHeight} · {m.diagonal}" · {m.curveRadius ? `${m.curveRadius}R` : 'Flat'}
                    </span>
                  </>
                )}
              />
            ))}

          {source === 'class' && (
            <PickList
              label="Pick a class"
              placeholder="Search by size, resolution or curvature…"
              emptyText="No matching classes"
              query={classQuery}
              onQuery={setClassQuery}
              items={filteredClasses}
              getId={(c) => c.id}
              selectedId={selectedId}
              onSelect={setSelectedId}
              renderRow={(c) => classLabel(c)}
            />
          )}

          {source === 'model' && (
            <PickList
              label="Pick a model"
              placeholder="Search by brand, model or panel…"
              emptyText="No matching models"
              query={modelQuery}
              onQuery={setModelQuery}
              items={filteredModels}
              getId={(m) => m.id}
              selectedId={selectedId}
              onSelect={setSelectedId}
              renderRow={(m, selected) => {
                const cls = getClass(m.classId)
                const meta = [cls && classLabel(cls), m.panelType, m.releaseYear].filter(Boolean).join(' · ')
                return (
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{m.name}</span>
                    <span className={`text-xs ${selected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{meta}</span>
                  </span>
                )
              }}
            />
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
            disabled={!selectedId}
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add monitor
          </button>
        </div>
      </form>
    </Dialog>
  )
}
