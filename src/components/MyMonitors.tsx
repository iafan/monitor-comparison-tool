import { useState } from 'react'
import { Dialog } from './Dialog'
import { Intro } from './Intro'
import { MonitorCustomForm } from './MonitorCustomForm'
import { MonitorList } from './MonitorList'
import type { Monitor, MonitorInput, Unit } from '../types'

interface Props {
  myMonitors: Monitor[]
  addMyMonitor: (input: MonitorInput) => void
  updateMyMonitor: (id: string, input: MonitorInput) => void
  deleteMyMonitor: (id: string) => void
  unit: Unit
}

/** null = closed; { editing } = open (editing null means "add new"). */
type ModalState = { editing: Monitor | null } | null

export function MyMonitors({ myMonitors, addMyMonitor, updateMyMonitor, deleteMyMonitor, unit }: Props) {
  const [modal, setModal] = useState<ModalState>(null)

  const handleSave = (input: MonitorInput) => {
    if (modal?.editing) updateMyMonitor(modal.editing.id, input)
    else addMyMonitor(input)
    setModal(null)
  }

  const handleDelete = (monitor: Monitor) => {
    if (window.confirm(`Remove "${monitor.name}" from My Monitors?`)) deleteMyMonitor(monitor.id)
  }

  return (
    <>
      <Intro>
        Save the monitors you own or are considering. They become available across the other tools —
        pick them in the Size Comparison and 3D Simulator without re-entering their specs.
      </Intro>
      <MonitorList
        monitors={myMonitors}
        unit={unit}
        onAdd={() => setModal({ editing: null })}
        onEdit={(monitor) => setModal({ editing: monitor })}
        onDelete={handleDelete}
        title="My monitors"
        addLabel="+ Add monitor"
        emptyText="No monitors yet. Add a monitor to build your list — you can then use it in the other tools."
      />

      {modal && (
        <Dialog title={modal.editing ? 'Edit monitor' : 'Add monitor'} onClose={() => setModal(null)}>
          <MonitorCustomForm editing={modal.editing} onSave={handleSave} onClose={() => setModal(null)} />
        </Dialog>
      )}
    </>
  )
}
