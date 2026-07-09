import type { Theme, Tool } from '../types'

interface Props {
  tool: Tool
  onToolChange: (tool: Tool) => void
  theme: Theme
  onOpenSettings: () => void
}

const TOOL_LABELS: Record<Tool, string> = {
  comparison: 'Monitor Size Comparison',
  myMonitors: 'My Monitors',
  check: 'Monitor Check',
  geometry: 'Monitor Geometry',
  simulator: 'Monitor Simulator in 3D',
}

const TOOL_ORDER: Tool[] = ['comparison', 'simulator', 'myMonitors', 'check', 'geometry']

export function TopMenu({ tool, onToolChange, theme, onOpenSettings }: Props) {
  const isDark = theme === 'dark'

  // Clicking the logo returns to a clean "/" URL and reloads, so the app
  // re-reads the stored defaults (dropping any shared-link view in the hash).
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault()
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    window.location.reload()
  }

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-1)]">
      <nav className="mx-auto grid max-w-[900px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2">
        <a
          href="./"
          onClick={goHome}
          title="Monitorture — reset to your saved view"
          className="size-8 justify-self-start"
        >
          <img
            src={isDark ? './icon-dark.svg' : './icon.svg'}
            alt="Monitorture home"
            className="size-8 cursor-pointer rounded-full"
          />
        </a>

        <label className="relative flex items-center justify-self-center">
          <span className="sr-only">Select tool</span>
          <select
            value={tool}
            onChange={(e) => onToolChange(e.target.value as Tool)}
            className="min-h-11 cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-1)] py-2 pr-9 pl-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            {TOOL_ORDER.map((t) => (
              <option key={t} value={t}>
                {TOOL_LABELS[t]}
              </option>
            ))}
          </select>
          {/* Custom chevron, since appearance-none removes the native one. */}
          <svg
            className="pointer-events-none absolute right-3 size-4 text-[var(--text-secondary)]"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="flex size-11 flex-none cursor-pointer items-center justify-center justify-self-end text-[var(--text-primary)]"
        >
          <span className="sr-only">Open settings</span>
          {/* Lucide "menu" (hamburger), sized to sit optically next to the logo circle */}
          <svg
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </div>
  )
}
