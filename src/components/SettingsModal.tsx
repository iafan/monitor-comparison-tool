import { useState } from 'react'
import { Copy, Moon, Sun } from 'lucide-react'
import { UNIT_LABELS, UNITS } from '../lib/units'
import type { Theme, Unit } from '../types'
import { Dialog, DialogSection } from './Dialog'

interface Props {
  /** Raw theme preference: null = Auto (follow the system). */
  themeChoice: Theme | null
  onThemeChange: (choice: Theme | null) => void
  unit: Unit
  onUnitChange: (unit: Unit) => void
  onClose: () => void
}

// null models "Auto"; the two concrete themes carry an icon, Auto is a text label.
const THEME_OPTIONS: { value: Theme | null; label: string; icon?: React.ReactNode }[] = [
  { value: null, label: 'Auto' },
  { value: 'light', label: 'Light', icon: <Sun className="size-5" aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="size-5" aria-hidden="true" /> },
]

const segClass = (selected: boolean) =>
  `flex min-h-11 flex-1 items-center justify-center gap-1.5 px-3 text-sm font-semibold ${
    selected ? 'bg-[var(--series-1)] text-white' : 'bg-[var(--page-plane)] text-[var(--text-secondary)]'
  }`

export function SettingsModal({ themeChoice, onThemeChange, unit, onUnitChange, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const copyPermalink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing else to do.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog ariaLabel="Settings" onClose={onClose} maxWidthClass="max-w-[420px]">
      <div className="flex flex-col gap-5">
        <DialogSection title="Theme">
          <div
            className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]"
            role="group"
            aria-label="Theme"
          >
            {THEME_OPTIONS.map((opt) => {
              const selected = themeChoice === opt.value
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onThemeChange(opt.value)}
                  aria-pressed={selected}
                  title={opt.label}
                  className={segClass(selected)}
                >
                  {opt.icon ?? opt.label}
                  {opt.icon && <span className="sr-only">{opt.label}</span>}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Auto follows your device's light/dark setting.
          </span>
        </DialogSection>

        <DialogSection title="Units">
          <div
            className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]"
            role="group"
            aria-label="Length units"
          >
            {UNITS.map((u) => {
              const selected = u === unit
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUnitChange(u)}
                  aria-pressed={selected}
                  className={segClass(selected)}
                >
                  {UNIT_LABELS[u]}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Affects Width/Height and desk size. Diagonal stays in inches.
          </span>
        </DialogSection>

        <DialogSection title="Share">
          <button
            type="button"
            onClick={copyPermalink}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-[var(--series-1)]"
          >
            <Copy className="size-4 flex-none" aria-hidden="true" />
            <span className="underline">{copied ? 'Copied!' : 'Copy permalink to this view'}</span>
          </button>
        </DialogSection>
      </div>
    </Dialog>
  )
}
