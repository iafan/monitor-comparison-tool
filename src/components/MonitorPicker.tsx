import { MONITOR_CLASSES, MONITOR_MODELS, classLabel } from '../data'

interface Props {
  /** Selected catalogue id — a class id or a model id. */
  value: string
  onChange: (id: string) => void
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * A single dropdown for choosing "a generic class or a specific monitor",
 * grouped into two optgroups. The value is a catalogue id resolvable with
 * `resolveSelection`. Shared so any tool can offer the same monitor picker.
 */
export function MonitorPicker({ value, onChange, id, className, ...rest }: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      {...rest}
    >
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
