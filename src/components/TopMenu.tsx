import type { Theme, Tool } from '../types'

interface Props {
  tool: Tool
  onToolChange: (tool: Tool) => void
  theme: Theme
  onToggleTheme: () => void
}

const TOOL_LABELS: Record<Tool, string> = {
  comparison: 'Monitor Size Comparison',
  check: 'Monitor Check',
  geometry: 'Monitor Geometry',
}

const TOOL_ORDER: Tool[] = ['comparison', 'check', 'geometry']

export function TopMenu({ tool, onToolChange, theme, onToggleTheme }: Props) {
  const isDark = theme === 'dark'
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-1)]">
      <nav className="mx-auto grid max-w-[900px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2">
        <img
          src={isDark ? './icon-dark.svg' : './icon.svg'}
          alt="Monitorture"
          className="size-8 justify-self-start rounded-full"
        />

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
          onClick={onToggleTheme}
          aria-pressed={isDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex size-11 flex-none cursor-pointer items-center justify-center justify-self-end rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)]"
        >
          <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          {isDark ? (
            /* Sun — click to go light */
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="4.5" />
              <path
                strokeLinecap="round"
                d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
              />
            </svg>
          ) : (
            /* Moon — click to go dark */
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
            </svg>
          )}
        </button>
      </nav>
    </div>
  )
}
