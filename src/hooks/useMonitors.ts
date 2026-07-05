import { useCallback, useEffect, useState } from 'react'
import type { Monitor, MonitorInput } from '../types'
import { loadMonitors, saveMonitors, uid } from '../lib/storage'

export interface MonitorsApi {
  monitors: Monitor[]
  addMonitor: (input: MonitorInput) => void
  updateMonitor: (id: string, input: MonitorInput) => void
  deleteMonitor: (id: string) => void
  toggleVisibility: (id: string) => void
}

export function useMonitors(): MonitorsApi {
  const [monitors, setMonitors] = useState<Monitor[]>(() => loadMonitors())

  // Persist on every change (also writes the seeded defaults on first load).
  useEffect(() => {
    saveMonitors(monitors)
  }, [monitors])

  const addMonitor = useCallback((input: MonitorInput) => {
    setMonitors((prev) => {
      const nextSlot = prev.length === 0 ? 0 : Math.max(...prev.map((m) => m.colorSlot)) + 1
      return [...prev, { ...input, id: uid(), visible: true, colorSlot: nextSlot }]
    })
  }, [])

  const updateMonitor = useCallback((id: string, input: MonitorInput) => {
    setMonitors((prev) => prev.map((m) => (m.id === id ? { ...m, ...input } : m)))
  }, [])

  const deleteMonitor = useCallback((id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const toggleVisibility = useCallback((id: string) => {
    setMonitors((prev) => prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)))
  }, [])

  return { monitors, addMonitor, updateMonitor, deleteMonitor, toggleVisibility }
}
