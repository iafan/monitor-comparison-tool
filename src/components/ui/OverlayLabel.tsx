import type { ReactNode } from 'react'

/**
 * Static caption pill overlaid on imagery or a test pattern — a semi-transparent
 * black pill with white text that stays legible on any background. `show` fades
 * it via opacity so it can be hidden on label-free thumbnails/previews. Callers
 * supply any positioning (absolute placement, transforms) through `className`.
 */
export function OverlayLabel({
  children,
  show = true,
  className = '',
}: {
  children: ReactNode
  show?: boolean
  className?: string
}) {
  return (
    <span
      className={`pointer-events-none rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </span>
  )
}
