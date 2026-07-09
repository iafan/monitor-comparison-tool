import { useMemo, useState } from 'react'
import { assignColors } from '../constants'
import { Intro } from './Intro'
import { ComparisonStage } from './ComparisonStage'
import { TopView } from './TopView'
import { MonitorList } from './MonitorList'
import { DetailsTable } from './DetailsTable'
import { AlignmentPicker } from './AlignmentPicker'
import { DeskSettings } from './DeskSettings'
import { AddToComparisonModal } from './AddToComparisonModal'
import type { Alignment, Monitor, MonitorInput, Preferences as Prefs, TopViewAlign } from '../types'

interface Props {
  monitors: Monitor[]
  /** The viewer's saved custom-monitor library, offered in the Add dialog. */
  myMonitors: Monitor[]
  /** Switch to the My Monitors tool (from the Add dialog's empty-state link). */
  onManageMonitors: () => void
  addMonitor: (input: MonitorInput) => void
  deleteMonitor: (id: string) => void
  toggleVisibility: (id: string) => void
  alignment: Alignment
  setAlignment: (a: Alignment) => void
  topViewAlign: TopViewAlign
  setTopViewAlign: (a: TopViewAlign) => void
  preferences: Prefs
  updatePreferences: (patch: Partial<Prefs>) => void
}

export function MonitorComparison({
  monitors,
  myMonitors,
  onManageMonitors,
  addMonitor,
  deleteMonitor,
  toggleVisibility,
  alignment,
  setAlignment,
  topViewAlign,
  setTopViewAlign,
  preferences,
  updatePreferences,
}: Props) {
  const [adding, setAdding] = useState(false)

  const { unit, deskEnabled, deskWidth, deskDepth, deskX, deskY } = preferences
  const hasCurved = monitors.some((m) => m.visible && m.curveRadius)
  // Colors are assigned by enabled position (top to bottom), shared by every view.
  const colors = useMemo(() => assignColors(monitors), [monitors])

  const handleAdd = (input: MonitorInput) => {
    addMonitor(input)
    setAdding(false)
  }

  const handleDelete = (monitor: Monitor) => {
    if (window.confirm(`Remove "${monitor.name}" from the list?`)) {
      deleteMonitor(monitor.id)
    }
  }

  return (
    <>
      <Intro>
        See how monitors stack up side by side — physical size, resolution, pixel density, and
        curvature, all drawn to scale. Add the models you're weighing to compare their real
        dimensions.
      </Intro>
      <DetailsTable monitors={monitors} unit={unit} colors={colors} />
      <ComparisonStage monitors={monitors} alignment={alignment} colors={colors} />
      <TopView
        monitors={monitors}
        alignment={alignment}
        topViewAlign={topViewAlign}
        colors={colors}
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
        colors={colors}
        onAdd={() => setAdding(true)}
        onToggle={toggleVisibility}
        onDelete={handleDelete}
      />
      <AlignmentPicker
        value={alignment}
        onChange={setAlignment}
        topViewAlign={topViewAlign}
        onTopViewAlignChange={setTopViewAlign}
        showTopView={hasCurved || deskEnabled}
      />
      <DeskSettings preferences={preferences} onChange={updatePreferences} />

      {adding && (
        <AddToComparisonModal
          myMonitors={myMonitors}
          onAdd={handleAdd}
          onClose={() => setAdding(false)}
          onGoToMyMonitors={onManageMonitors}
        />
      )}
    </>
  )
}
