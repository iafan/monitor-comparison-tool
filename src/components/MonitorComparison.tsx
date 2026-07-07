import { useState } from 'react'
import { Header } from './Header'
import { ComparisonStage } from './ComparisonStage'
import { TopView } from './TopView'
import { MonitorList } from './MonitorList'
import { DetailsTable } from './DetailsTable'
import { Preferences } from './Preferences'
import { AlignmentPicker } from './AlignmentPicker'
import { DeskSettings } from './DeskSettings'
import { MonitorFormModal } from './MonitorFormModal'
import type { Alignment, Monitor, MonitorInput, Preferences as Prefs, TopViewAlign } from '../types'

interface Props {
  monitors: Monitor[]
  addMonitor: (input: MonitorInput) => void
  updateMonitor: (id: string, input: MonitorInput) => void
  deleteMonitor: (id: string) => void
  toggleVisibility: (id: string) => void
  alignment: Alignment
  setAlignment: (a: Alignment) => void
  topViewAlign: TopViewAlign
  setTopViewAlign: (a: TopViewAlign) => void
  preferences: Prefs
  updatePreferences: (patch: Partial<Prefs>) => void
}

/** null = modal closed; { editing } = open (editing null means "add new"). */
type ModalState = { editing: Monitor | null } | null

export function MonitorComparison({
  monitors,
  addMonitor,
  updateMonitor,
  deleteMonitor,
  toggleVisibility,
  alignment,
  setAlignment,
  topViewAlign,
  setTopViewAlign,
  preferences,
  updatePreferences,
}: Props) {
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
    <>
      <Header onAdd={() => setModal({ editing: null })} />
      <DetailsTable monitors={monitors} unit={unit} />
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
    </>
  )
}
