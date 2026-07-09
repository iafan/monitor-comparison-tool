import { useState } from 'react'
import { serializeMonitors } from '../lib/monitorsIo'
import { Dialog } from './Dialog'
import { Intro } from './Intro'
import { MonitorCustomForm } from './MonitorCustomForm'
import { MonitorList } from './MonitorList'
import { MonitorsImportDialog } from './MonitorsImportDialog'
import { MonitorsSaveDialog } from './MonitorsSaveDialog'
import type { Monitor, MonitorInput, Unit } from '../types'

interface Props {
  myMonitors: Monitor[]
  addMyMonitor: (input: MonitorInput) => void
  updateMyMonitor: (id: string, input: MonitorInput) => void
  deleteMyMonitor: (id: string) => void
  importMyMonitors: (inputs: MonitorInput[]) => { added: number; skipped: number }
  unit: Unit
}

/** null = closed; { editing } = form open (editing null means "add new"). */
type FormState = { editing: Monitor | null } | null

export function MyMonitors({
  myMonitors,
  addMyMonitor,
  updateMyMonitor,
  deleteMyMonitor,
  importMyMonitors,
  unit,
}: Props) {
  const [form, setForm] = useState<FormState>(null)
  const [io, setIo] = useState<null | 'save' | 'import'>(null)

  const handleSave = (input: MonitorInput) => {
    if (form?.editing) updateMyMonitor(form.editing.id, input)
    else addMyMonitor(input)
    setForm(null)
  }

  const handleDelete = (monitor: Monitor) => {
    if (window.confirm(`Remove "${monitor.name}" from My Monitors?`)) deleteMyMonitor(monitor.id)
  }

  const linkClass = 'cursor-pointer text-sm font-semibold text-[var(--series-1)] underline'

  return (
    <>
      <Intro>
        Save the monitors you own or are considering. They become available across the other tools —
        pick them in the Size Comparison and 3D Simulator without re-entering their specs.
      </Intro>
      <MonitorList
        monitors={myMonitors}
        unit={unit}
        onAdd={() => setForm({ editing: null })}
        onEdit={(monitor) => setForm({ editing: monitor })}
        onDelete={handleDelete}
        title="My monitors"
        addLabel="+ Add monitor"
        emptyText="No monitors yet. Add a monitor to build your list — you can then use it in the other tools."
      />

      {/* Back up / transfer the library as JSON. Save only makes sense with entries. */}
      <div className="flex gap-4">
        {myMonitors.length > 0 && (
          <button type="button" onClick={() => setIo('save')} className={linkClass}>
            Save
          </button>
        )}
        <button type="button" onClick={() => setIo('import')} className={linkClass}>
          Import
        </button>
      </div>

      {form && (
        <Dialog title={form.editing ? 'Edit monitor' : 'Add monitor'} onClose={() => setForm(null)}>
          <MonitorCustomForm editing={form.editing} onSave={handleSave} onClose={() => setForm(null)} />
        </Dialog>
      )}

      {io === 'save' && (
        <MonitorsSaveDialog json={serializeMonitors(myMonitors)} onClose={() => setIo(null)} />
      )}
      {io === 'import' && (
        <MonitorsImportDialog onImport={importMyMonitors} onClose={() => setIo(null)} />
      )}
    </>
  )
}
