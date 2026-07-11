import { useEffect, useState, type ReactNode } from 'react'
import { EtchingIcon } from './EtchingIcon'

function resolvedTheme(): 'light' | 'dark' {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** A titled block within the debug page. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">{title}</h2>
      {children}
    </section>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
// Each debug tool is a self-contained section. Add new ones below and drop a
// <Section> for it into Debug().

const ETCH_SIZES = [18, 27, 36, 54, 90, 144]

function EtchingSection({ theme }: { theme: 'light' | 'dark' }) {
  const iconSrc = `${import.meta.env.BASE_URL}${theme === 'dark' ? 'icon-dark.svg' : 'icon.svg'}`
  return (
    <div className="flex flex-wrap items-end gap-6">
      {ETCH_SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <EtchingIcon size={s} />
          </div>
          <span className="text-xs tabular-nums text-[var(--text-muted)]">{s}px</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-4">
          <img src={iconSrc} width={90} height={90} className="size-[90px] rounded-full" alt="Monitorture icon" />
        </div>
        <span className="text-xs text-[var(--text-muted)]">target</span>
      </div>
    </div>
  )
}

/**
 * Hidden debug page, reached at `#t=dbg` (see main.tsx). A generic shell — a
 * title, a global light/dark toggle, and a stack of <Section>s — that hosts
 * throwaway harnesses for components and behaviours. Nothing here is reachable
 * from a normal navigation. Mounted at the root so the app's URL-state sync
 * isn't running to overwrite the debug hash.
 */
export function Debug() {
  const [theme, setTheme] = useState<'light' | 'dark'>(resolvedTheme)

  // Drive the global palette (and any theme-aware component) from the toggle.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-[var(--page-plane)] px-6 py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Debug</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Internal harnesses · open via <code>#t=dbg</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-semibold"
          >
            Theme: {theme}
          </button>
        </div>

        <Section title="EtchingIcon — loading animation">
          <EtchingSection theme={theme} />
        </Section>

        {/* Add future debug sections here. */}
      </div>
    </div>
  )
}
