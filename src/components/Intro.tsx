import type { ReactNode } from 'react'

/** The short explanatory paragraph shown at the top of each tool. */
export function Intro({ children }: { children: ReactNode }) {
  return <p className="mb-5 text-sm text-[var(--text-secondary)]">{children}</p>
}
