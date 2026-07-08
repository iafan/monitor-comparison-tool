import { MONITOR_CLASSES, MONITOR_MODELS, classLabel } from '../data'

interface Props {
  /** Selected catalogue id — a class id, a model id, or a custom `@…` token. */
  value: string
  onChange: (id: string) => void
  /** The viewer's own monitors, listed as a top "My monitors" section. */
  custom?: { value: string; label: string }[]
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * A single dropdown for choosing "one of my monitors, a generic class, or a
 * specific model", grouped into optgroups. The value is a token resolvable with
 * `resolveSelection`. Shared so any tool can offer the same monitor picker.
 */
export function MonitorPicker({ value, onChange, custom, id, className, ...rest }: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      {...rest}
    >
      {custom && custom.length > 0 && (
        <optgroup label="My monitors">
          {custom.map((c, i) => (
            <option key={`${c.value}-${i}`} value={c.value}>
              {c.label}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Monitor classes">
        {MONITOR_CLASSES.map((c) => (
          <option key={c.id} value={c.id}>
            {classLabel(c)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Specific models">
        {MONITOR_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </optgroup>
    </select>
  )
}
