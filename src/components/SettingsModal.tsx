import { UNIT_LABELS, UNITS } from '../lib/units'
import type { Theme, Unit } from '../types'
import { Dialog } from './Dialog'

interface Props {
  /** Raw theme preference: null = Auto (follow the system). */
  themeChoice: Theme | null
  onThemeChange: (choice: Theme | null) => void
  unit: Unit
  onUnitChange: (unit: Unit) => void
  onClose: () => void
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" />
    <path
      strokeLinecap="round"
      d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
    />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
  </svg>
)

// null models "Auto"; the two concrete themes carry an icon, Auto is a text label.
const THEME_OPTIONS: { value: Theme | null; label: string; icon?: React.ReactNode }[] = [
  { value: null, label: 'Auto' },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
]

const segClass = (selected: boolean) =>
  `flex min-h-11 flex-1 items-center justify-center gap-1.5 px-3 text-sm font-semibold ${
    selected ? 'bg-[var(--series-1)] text-white' : 'bg-[var(--page-plane)] text-[var(--text-secondary)]'
  }`

export function SettingsModal({ themeChoice, onThemeChange, unit, onUnitChange, onClose }: Props) {
  return (
    <Dialog title="Settings" onClose={onClose} maxWidthClass="max-w-[420px]">
      <div className="flex flex-col gap-5">
        {/* Theme */}
        <div className="flex flex-col gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Theme</span>
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
        </div>

        {/* Units */}
        <div className="flex flex-col gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Units</span>
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
        </div>
      </div>
    </Dialog>
  )
}
