import { useState } from 'react'
import { parseMonitors } from '../lib/monitorsIo'
import { Dialog } from './Dialog'
import type { MonitorInput } from '../types'

interface Props {
  /** Adds the parsed monitors, skipping duplicates; returns the tally. */
  onImport: (inputs: MonitorInput[]) => { added: number; skipped: number }
  onClose: () => void
}

const taClass =
  'h-[46vh] max-h-[360px] min-h-[200px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--page-plane)] p-3 font-mono text-xs text-[var(--text-primary)]'

/** Paste exported JSON and import non-duplicate monitors into the library. */
export function MonitorsImportDialog({ onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)

  const doImport = () => {
    setError(null)
    let inputs: MonitorInput[]
    try {
      inputs = parseMonitors(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import that JSON.')
      return
    }
    setResult(onImport(inputs))
  }

  return (
    <Dialog title="Import monitors" onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <p className="text-sm text-[var(--text-secondary)]">
          Paste monitor JSON (from Save). New monitors are added; duplicates are skipped.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
            setResult(null)
          }}
          placeholder="Paste exported JSON here…"
          autoFocus
          className={taClass}
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {result && (
          <p className="text-sm text-[var(--text-secondary)]">
            Added {result.added} monitor{result.added === 1 ? '' : 's'}
            {result.skipped > 0 && `, skipped ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'}`}.
          </p>
        )}
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
            onClick={doImport}
            disabled={!text.trim()}
            className="min-h-11 cursor-pointer rounded-lg border border-[var(--series-1)] bg-[var(--series-1)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import
          </button>
        </div>
      </div>
    </Dialog>
  )
}
