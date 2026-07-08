import { lazy, Suspense, useState } from 'react'
import { TopMenu } from './components/TopMenu'
import { SettingsModal } from './components/SettingsModal'
import { useAppState } from './hooks/useAppState'

// Every tool is code-split into its own chunk so the initial load is just the
// shell (menu + state). The active tool streams in behind a loading fallback,
// making first paint fast; once cached by the service worker it's instant.
const MonitorComparison = lazy(() =>
  import('./components/MonitorComparison').then((m) => ({ default: m.MonitorComparison })),
)
const MonitorCheck = lazy(() =>
  import('./components/MonitorCheck').then((m) => ({ default: m.MonitorCheck })),
)
const MonitorGeometry = lazy(() =>
  import('./components/MonitorGeometry').then((m) => ({ default: m.MonitorGeometry })),
)
const MonitorSimulator = lazy(() => import('./components/MonitorSimulator'))

function ToolLoading() {
  return <p className="py-12 text-center text-sm text-[var(--text-muted)]">Loading…</p>
}

export function App() {
  const app = useAppState()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <TopMenu tool={app.tool} onToolChange={app.setTool} theme={app.theme} onOpenSettings={() => setSettingsOpen(true)} />
      {settingsOpen && (
        <SettingsModal
          themeChoice={app.themeChoice}
          onThemeChange={app.setThemeChoice}
          unit={app.preferences.unit}
          onUnitChange={(u) => app.updatePreferences({ unit: u })}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <main className="mx-auto max-w-[900px] px-4 pt-6 pb-12">
        <Suspense fallback={<ToolLoading />}>
          {app.tool === 'comparison' && (
            <MonitorComparison
              monitors={app.monitors}
              addMonitor={app.addMonitor}
              updateMonitor={app.updateMonitor}
              deleteMonitor={app.deleteMonitor}
              toggleVisibility={app.toggleVisibility}
              alignment={app.alignment}
              setAlignment={app.setAlignment}
              topViewAlign={app.topViewAlign}
              setTopViewAlign={app.setTopViewAlign}
              preferences={app.preferences}
              updatePreferences={app.updatePreferences}
            />
          )}
          {app.tool === 'check' && <MonitorCheck screen={app.checkScreen} setScreen={app.setCheckScreen} />}
          {app.tool === 'geometry' && (
            <MonitorGeometry visibleFrame={app.visibleFrame} setVisibleFrame={app.setVisibleFrame} />
          )}
          {app.tool === 'simulator' && (
            <MonitorSimulator
              simulator={app.simulator}
              setSimulator={app.setSimulator}
              monitors={app.monitors}
              unit={app.preferences.unit}
              theme={app.theme}
            />
          )}
        </Suspense>
      </main>
    </>
  )
}
