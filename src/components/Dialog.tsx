import { useEffect, useId } from 'react'

interface Props {
  /** Optional caption. Omit when the dialog's own sections carry the titles. */
  title?: string
  /** Accessible name when there's no visible title (e.g. a multi-section dialog). */
  ariaLabel?: string
  onClose: () => void
  children: React.ReactNode
  /** Panel max width; defaults to the monitor-form width. */
  maxWidthClass?: string
}

/**
 * Modal shell: dimmed backdrop, a centered panel (bottom sheet on small
 * screens), Escape-to-close, and click-outside-to-close. Sits above the sticky
 * top nav (z-50). Children are the dialog body below the (optional) heading.
 */
export function Dialog({ title, ariaLabel, onClose, children, maxWidthClass = 'max-w-[480px]' }: Props) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-t-2xl bg-[var(--surface-1)] p-5 sm:rounded-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
      >
        {title && (
          <h2 id={titleId} className="mb-4 text-base font-semibold">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}

/** A titled section within a Dialog — the heading matches the dialog title's font. */
export function DialogSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}
