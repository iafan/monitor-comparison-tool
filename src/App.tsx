import { TopMenu } from './components/TopMenu'
import { MonitorComparison } from './components/MonitorComparison'
import { MonitorCheck } from './components/MonitorCheck'
import { MonitorGeometry } from './components/MonitorGeometry'
import { useTool } from './hooks/useTool'
import { useTheme } from './hooks/useTheme'

export function App() {
  const { tool, setTool } = useTool()
  const { theme, toggle } = useTheme()

  return (
    <>
      <TopMenu tool={tool} onToolChange={setTool} theme={theme} onToggleTheme={toggle} />
      <main className="mx-auto max-w-[900px] px-4 pt-6 pb-12">
        {tool === 'comparison' && <MonitorComparison />}
        {tool === 'check' && <MonitorCheck />}
        {tool === 'geometry' && <MonitorGeometry />}
      </main>
    </>
  )
}
