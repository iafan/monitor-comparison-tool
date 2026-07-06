import { useCallback, useEffect, useRef, useState } from 'react'
import type { Alignment, Monitor, MonitorInput, Preferences, Theme, Tool, TopViewAlign } from '../types'
import {
  loadAlignment,
  loadMonitors,
  loadPreferences,
  loadTheme,
  loadTool,
  loadTopViewAlign,
  saveAlignment,
  saveMonitors,
  savePreferences,
  saveTheme,
  saveTool,
  saveTopViewAlign,
  seedDefaults,
  uid,
} from '../lib/storage'
import { applyDecoded, decodeState, defaultState, encodeState, type AppState } from '../lib/urlState'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readFragment(): string {
  return window.location.hash.replace(/^#/, '')
}

/**
 * Builds the initial state. A non-empty URL fragment fully determines the view
 * (so shared links are reproducible); otherwise we hydrate from localStorage.
 * `fromUrl` drives ephemeral behaviour: URL-loaded state isn't persisted until
 * the visitor makes their first change.
 */
function initialState(): { state: AppState; fromUrl: boolean } {
  const fragment = readFragment()
  if (fragment) {
    return { state: applyDecoded(defaultState(seedDefaults()), decodeState(fragment)), fromUrl: true }
  }
  return {
    state: {
      tool: loadTool(),
      themeChoice: loadTheme(),
      monitors: loadMonitors(),
      alignment: loadAlignment(),
      topViewAlign: loadTopViewAlign(),
      preferences: loadPreferences(),
      checkScreen: null,
    },
    fromUrl: false,
  }
}

export interface AppStore {
  tool: Tool
  setTool: (t: Tool) => void
  /** Resolved light/dark theme for rendering. */
  theme: Theme
  toggleTheme: () => void
  monitors: Monitor[]
  addMonitor: (input: MonitorInput) => void
  updateMonitor: (id: string, input: MonitorInput) => void
  deleteMonitor: (id: string) => void
  toggleVisibility: (id: string) => void
  alignment: Alignment
  setAlignment: (a: Alignment) => void
  topViewAlign: TopViewAlign
  setTopViewAlign: (a: TopViewAlign) => void
  preferences: Preferences
  updatePreferences: (patch: Partial<Preferences>) => void
  checkScreen: string | null
  setCheckScreen: (screen: string | null) => void
}

export function useAppState(): AppStore {
  const init = useRef(initialState())
  const [state, setState] = useState<AppState>(init.current.state)
  // Persistence is off while showing a URL-loaded view; the first mutation turns it on.
  const persist = useRef(!init.current.fromUrl)

  const resolvedTheme: Theme = state.themeChoice ?? systemTheme()

  // Mirror the resolved theme onto <html> so the CSS palette tokens apply.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  // Keep the URL in sync — replaceState (no history spam, no reload). Empty
  // fragment (all defaults) collapses to a clean URL.
  useEffect(() => {
    const fragment = encodeState(state)
    const url = fragment ? `#${fragment}` : window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }, [state])

  // Persist to localStorage only once the visitor owns this view.
  useEffect(() => {
    if (!persist.current) return
    saveTool(state.tool)
    if (state.themeChoice) saveTheme(state.themeChoice)
    saveMonitors(state.monitors)
    saveAlignment(state.alignment)
    saveTopViewAlign(state.topViewAlign)
    savePreferences(state.preferences)
  }, [state])

  // Re-hydrate when the user edits the URL by hand or navigates back/forward.
  useEffect(() => {
    const onHashChange = () => {
      const fragment = readFragment()
      if (fragment === encodeState(state)) return // our own write
      setState(applyDecoded(defaultState(seedDefaults()), decodeState(fragment)))
      persist.current = false
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [state])

  // All mutations funnel through here so persistence turns on exactly once.
  const mutate = useCallback((updater: (s: AppState) => AppState) => {
    persist.current = true
    setState(updater)
  }, [])

  const setTool = useCallback((tool: Tool) => mutate((s) => ({ ...s, tool })), [mutate])

  const toggleTheme = useCallback(
    () => mutate((s) => ({ ...s, themeChoice: (s.themeChoice ?? systemTheme()) === 'dark' ? 'light' : 'dark' })),
    [mutate],
  )

  const setAlignment = useCallback((alignment: Alignment) => mutate((s) => ({ ...s, alignment })), [mutate])

  const setTopViewAlign = useCallback(
    (topViewAlign: TopViewAlign) => mutate((s) => ({ ...s, topViewAlign })),
    [mutate],
  )

  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => mutate((s) => ({ ...s, preferences: { ...s.preferences, ...patch } })),
    [mutate],
  )

  const setCheckScreen = useCallback(
    (checkScreen: string | null) => mutate((s) => ({ ...s, checkScreen })),
    [mutate],
  )

  const addMonitor = useCallback(
    (input: MonitorInput) =>
      mutate((s) => {
        const nextSlot = s.monitors.length === 0 ? 0 : Math.max(...s.monitors.map((m) => m.colorSlot)) + 1
        return { ...s, monitors: [...s.monitors, { ...input, id: uid(), visible: true, colorSlot: nextSlot }] }
      }),
    [mutate],
  )

  const updateMonitor = useCallback(
    (id: string, input: MonitorInput) =>
      mutate((s) => ({ ...s, monitors: s.monitors.map((m) => (m.id === id ? { ...m, ...input } : m)) })),
    [mutate],
  )

  const deleteMonitor = useCallback(
    (id: string) => mutate((s) => ({ ...s, monitors: s.monitors.filter((m) => m.id !== id) })),
    [mutate],
  )

  const toggleVisibility = useCallback(
    (id: string) =>
      mutate((s) => ({ ...s, monitors: s.monitors.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)) })),
    [mutate],
  )

  return {
    tool: state.tool,
    setTool,
    theme: resolvedTheme,
    toggleTheme,
    monitors: state.monitors,
    addMonitor,
    updateMonitor,
    deleteMonitor,
    toggleVisibility,
    alignment: state.alignment,
    setAlignment,
    topViewAlign: state.topViewAlign,
    setTopViewAlign,
    preferences: state.preferences,
    updatePreferences,
    checkScreen: state.checkScreen,
    setCheckScreen,
  }
}
