import { useEffect, useId } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Panel max width; defaults to the monitor-form width. */
  maxWidthClass?: string
}

/**
 * Modal shell: dimmed backdrop, a centered panel (bottom sheet on small
 * screens), Escape-to-close, and click-outside-to-close. Sits above the sticky
 * top nav (z-50). Children are the dialog body below the heading.
 */
export function Dialog({ title, onClose, children, maxWidthClass = 'max-w-[480px]' }: Props) {
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
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="mb-4 text-base font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
