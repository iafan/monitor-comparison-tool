import { useCallback, useEffect, useState } from 'react'
import type { Preferences } from '../types'
import { loadPreferences, savePreferences } from '../lib/storage'

export function usePreferences() {
  const [preferences, setState] = useState<Preferences>(() => loadPreferences())

  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const update = useCallback((patch: Partial<Preferences>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  return { preferences, update }
}
