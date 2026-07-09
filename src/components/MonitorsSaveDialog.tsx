import { useEffect, useRef, useState } from 'react'
import { Dialog } from './Dialog'

interface Props {
  json: string
  onClose: () => void
}

const taClass =
  'h-[46vh] max-h-[360px] min-h-[200px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--page-plane)] p-3 font-mono text-xs text-[var(--text-primary)]'

/** Shows the exported monitor JSON in a pre-selected textarea, with a copy button. */
export function MonitorsSaveDialog({ json, onClose }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  // Select the whole thing on open so the user can copy immediately.
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      ref.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog title="Save monitors" onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <p className="text-sm text-[var(--text-secondary)]">
          Copy this JSON to back up your monitors or move them to another device.
        </p>
        <textarea ref={ref} readOnly value={json} onFocus={(e) => e.currentTarget.select()} className={taClass} />
        <div className="mt-1 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copy}
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
