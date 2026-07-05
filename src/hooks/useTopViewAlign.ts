import { useCallback, useEffect, useState } from 'react'
import type { TopViewAlign } from '../types'
import { loadTopViewAlign, saveTopViewAlign } from '../lib/storage'

export function useTopViewAlign() {
  const [topViewAlign, setState] = useState<TopViewAlign>(() => loadTopViewAlign())

  useEffect(() => {
    saveTopViewAlign(topViewAlign)
  }, [topViewAlign])

  const setTopViewAlign = useCallback((next: TopViewAlign) => setState(next), [])

  return { topViewAlign, setTopViewAlign }
}
