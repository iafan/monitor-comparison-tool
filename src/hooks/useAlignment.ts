import { useCallback, useEffect, useState } from 'react'
import type { Alignment } from '../types'
import { loadAlignment, saveAlignment } from '../lib/storage'

export function useAlignment() {
  const [alignment, setAlignmentState] = useState<Alignment>(() => loadAlignment())

  useEffect(() => {
    saveAlignment(alignment)
  }, [alignment])

  const setAlignment = useCallback((next: Alignment) => setAlignmentState(next), [])

  return { alignment, setAlignment }
}
