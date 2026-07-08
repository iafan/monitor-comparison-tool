import { lazy, Suspense } from 'react'
import { TopMenu } from './components/TopMenu'
import { MonitorComparison } from './components/MonitorComparison'
import { MonitorCheck } from './components/MonitorCheck'
import { MonitorGeometry } from './components/MonitorGeometry'
import { useAppState } from './hooks/useAppState'

// three.js is a heavy dependency, so the Monitor Simulator (and everything it imports) is
// code-split into its own chunk that only downloads when this tool is opened.
const MonitorSimulator = lazy(() => import('./components/MonitorSimulator'))

export function App() {
  const app = useAppState()

  return (
    <>
      <TopMenu tool={app.tool} onToolChange={app.setTool} theme={app.theme} onToggleTheme={app.toggleTheme} />
      <main className="mx-auto max-w-[900px] px-4 pt-6 pb-12">
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
          <Suspense
            fallback={
              <p className="py-12 text-center text-sm text-[var(--text-muted)]">Loading simulator…</p>
            }
          >
            <MonitorSimulator
              simulator={app.simulator}
              setSimulator={app.setSimulator}
              monitors={app.monitors}
              unit={app.preferences.unit}
              theme={app.theme}
            />
          </Suspense>
        )}
      </main>
    </>
  )
}
