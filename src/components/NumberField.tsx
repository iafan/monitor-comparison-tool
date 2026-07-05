import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Committed value, or null when empty (only reachable if allowEmpty). */
  value: number | null
  onCommit: (value: number | null) => void
  /** Allow the field to be left blank (commits null); otherwise blur reverts. */
  allowEmpty?: boolean
  /** Constrain the committed number, e.g. (n) => Math.min(100, Math.max(0, n)). */
  clamp?: (n: number) => number
  /** Typed display number → stored number (e.g. cm → inches). */
  parse?: (displayValue: number) => number
  /** Stored number → display string (e.g. inches → "140"). */
  format?: (value: number) => string
  min?: number
  max?: number
  step?: number | 'any'
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  inputMode?: 'numeric' | 'decimal'
  className?: string
  'aria-label'?: string
}

function display(value: number | null, format?: (v: number) => string): string {
  if (value === null) return ''
  return format ? format(value) : String(value)
}

/**
 * Number input that keeps its own editable text so the field can be blanked
 * mid-edit. Valid input commits live; blur normalizes the text back to the
 * committed (and clamped) value. While unfocused it re-syncs from `value`, so
 * external changes — including a unit switch that changes `format` — flow in.
 */
export function NumberField({
  value,
  onCommit,
  allowEmpty = false,
  clamp,
  parse,
  format,
  ...input
}: Props) {
  const [text, setText] = useState(() => display(value, format))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(display(value, format))
  }, [value, format])

  const toStored = (n: number): number => {
    const parsed = parse ? parse(n) : n
    return clamp ? clamp(parsed) : parsed
  }

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw === '') {
      if (allowEmpty) onCommit(null)
      return
    }
    const n = Number(raw)
    if (Number.isFinite(n)) onCommit(toStored(n))
  }

  const handleBlur = (raw: string) => {
    focused.current = false
    const n = Number(raw)
    if (raw === '' || !Number.isFinite(n)) {
      if (raw === '' && allowEmpty) {
        onCommit(null)
        setText('')
      } else {
        setText(display(value, format)) // revert to the last committed value
      }
      return
    }
    const stored = toStored(n)
    onCommit(stored)
    setText(display(stored, format))
  }

  return (
    <input
      type="number"
      value={text}
      onFocus={() => {
        focused.current = true
      }}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={(e) => handleBlur(e.target.value)}
      {...input}
    />
  )
}
