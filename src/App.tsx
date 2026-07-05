import { useState } from 'react'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { ComparisonStage } from './components/ComparisonStage'
import { TopView } from './components/TopView'
import { MonitorList } from './components/MonitorList'
import { DetailsTable } from './components/DetailsTable'
import { AlignmentPicker } from './components/AlignmentPicker'
import { MonitorFormModal } from './components/MonitorFormModal'
import { useMonitors } from './hooks/useMonitors'
import { useAlignment } from './hooks/useAlignment'
import { useTopViewAlign } from './hooks/useTopViewAlign'
import type { Monitor, MonitorInput } from './types'

/** null = modal closed; { editing } = open (editing null means "add new"). */
type ModalState = { editing: Monitor | null } | null

export function App() {
  const { monitors, addMonitor, updateMonitor, deleteMonitor, toggleVisibility } = useMonitors()
  const { alignment, setAlignment } = useAlignment()
  const { topViewAlign, setTopViewAlign } = useTopViewAlign()
  const [modal, setModal] = useState<ModalState>(null)

  const hasCurved = monitors.some((m) => m.visible && m.curveRadius)

  const handleSave = (input: MonitorInput) => {
    if (modal?.editing) {
      updateMonitor(modal.editing.id, input)
    } else {
      addMonitor(input)
    }
    setModal(null)
  }

  const handleDelete = (monitor: Monitor) => {
    if (window.confirm(`Delete "${monitor.name}"?`)) {
      deleteMonitor(monitor.id)
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-4 pb-12">
      <Header onAdd={() => setModal({ editing: null })} />
      <Legend monitors={monitors} />
      <ComparisonStage monitors={monitors} alignment={alignment} />
      <TopView monitors={monitors} alignment={alignment} topViewAlign={topViewAlign} />
      <MonitorList
        monitors={monitors}
        onToggle={toggleVisibility}
        onEdit={(monitor) => setModal({ editing: monitor })}
        onDelete={handleDelete}
      />
      <DetailsTable monitors={monitors} />
      <AlignmentPicker
        value={alignment}
        onChange={setAlignment}
        topViewAlign={topViewAlign}
        onTopViewAlignChange={setTopViewAlign}
        showTopView={hasCurved}
      />

      {modal && (
        <MonitorFormModal
          editing={modal.editing}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
