import { useState } from 'react'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { ComparisonStage } from './components/ComparisonStage'
import { TopView } from './components/TopView'
import { MonitorList } from './components/MonitorList'
import { DetailsTable } from './components/DetailsTable'
import { Preferences } from './components/Preferences'
import { AlignmentPicker } from './components/AlignmentPicker'
import { DeskSettings } from './components/DeskSettings'
import { MonitorFormModal } from './components/MonitorFormModal'
import { useMonitors } from './hooks/useMonitors'
import { useAlignment } from './hooks/useAlignment'
import { useTopViewAlign } from './hooks/useTopViewAlign'
import { usePreferences } from './hooks/usePreferences'
import type { Monitor, MonitorInput } from './types'

/** null = modal closed; { editing } = open (editing null means "add new"). */
type ModalState = { editing: Monitor | null } | null

export function App() {
  const { monitors, addMonitor, updateMonitor, deleteMonitor, toggleVisibility } = useMonitors()
  const { alignment, setAlignment } = useAlignment()
  const { topViewAlign, setTopViewAlign } = useTopViewAlign()
  const { preferences, update: updatePreferences } = usePreferences()
  const [modal, setModal] = useState<ModalState>(null)

  const { unit, deskEnabled, deskWidth, deskDepth, deskX, deskY } = preferences
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
      <TopView
        monitors={monitors}
        alignment={alignment}
        topViewAlign={topViewAlign}
        deskEnabled={deskEnabled}
        deskWidth={deskWidth}
        deskDepth={deskDepth}
        deskX={deskX}
        deskY={deskY}
        unit={unit}
      />
      <MonitorList
        monitors={monitors}
        unit={unit}
        onToggle={toggleVisibility}
        onEdit={(monitor) => setModal({ editing: monitor })}
        onDelete={handleDelete}
      />
      <DetailsTable monitors={monitors} unit={unit} />
      <Preferences preferences={preferences} onChange={updatePreferences} />
      <AlignmentPicker
        value={alignment}
        onChange={setAlignment}
        topViewAlign={topViewAlign}
        onTopViewAlignChange={setTopViewAlign}
        showTopView={hasCurved || deskEnabled}
      />
      <DeskSettings preferences={preferences} onChange={updatePreferences} />

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
