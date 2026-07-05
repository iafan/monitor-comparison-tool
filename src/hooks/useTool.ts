import { useCallback, useEffect, useState } from 'react'
import type { Tool } from '../types'
import { loadTool, saveTool } from '../lib/storage'

export function useTool() {
  const [tool, setToolState] = useState<Tool>(() => loadTool())

  useEffect(() => {
    saveTool(tool)
  }, [tool])

  const setTool = useCallback((next: Tool) => setToolState(next), [])

  return { tool, setTool }
}
