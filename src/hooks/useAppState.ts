import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Alignment, Monitor, MonitorInput, Preferences, Theme, Tool, TopViewAlign } from '../types'
import { sortMonitors } from '../lib/geometry'
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
  uid,
} from '../lib/storage'
import { applyDecoded, decodeState, encodeState, type AppState } from '../lib/urlState'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readFragment(): string {
  return window.location.hash.replace(/^#/, '')
}

/** The viewer's own persisted state — the baseline a URL's view-overrides apply onto. */
function storedState(): AppState {
  return {
    tool: loadTool(),
    themeChoice: loadTheme(),
    monitors: loadMonitors(),
    alignment: loadAlignment(),
    topViewAlign: loadTopViewAlign(),
    preferences: loadPreferences(),
    checkScreen: null,
  }
}

/**
 * Builds the initial state. The baseline is always the viewer's stored state; a
 * URL fragment then overrides only the fields relevant to that shared *view*
 * (so a `#t=g` permalink keeps your own monitors intact when you switch back).
 * `fromUrl` drives ephemeral behaviour: an opened link isn't persisted until the
 * viewer edits the content.
 */
function initialState(): { state: AppState; fromUrl: boolean } {
  const fragment = readFragment()
  const base = storedState()
  if (fragment) return { state: applyDecoded(base, decodeState(fragment)), fromUrl: true }
  return { state: base, fromUrl: false }
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

  // Monitors are always exposed and serialized in a stable order (physical area,
  // then name) — independent of the order they were added. Everything downstream
  // (table, on-screen views, card list, URL) reads this same sorted view.
  const monitors = useMemo(() => sortMonitors(state.monitors), [state.monitors])
  const encoded = useMemo(() => encodeState({ ...state, monitors }), [state, monitors])

  // Mirror the resolved theme onto <html> so the CSS palette tokens apply.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  // Keep the URL in sync — replaceState (no history spam, no reload). Empty
  // fragment (all defaults) collapses to a clean URL.
  useEffect(() => {
    const url = encoded ? `#${encoded}` : window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }, [encoded])

  // Persist the view to localStorage only once the visitor owns it. (Theme is
  // handled separately in toggleTheme — it's always saved and never gated.)
  useEffect(() => {
    if (!persist.current) return
    saveTool(state.tool)
    saveMonitors(monitors)
    saveAlignment(state.alignment)
    saveTopViewAlign(state.topViewAlign)
    savePreferences(state.preferences)
  }, [state, monitors])

  // Re-hydrate when the user edits the URL by hand or navigates back/forward.
  useEffect(() => {
    const onHashChange = () => {
      const fragment = readFragment()
      if (fragment === encoded) return // our own write
      // Re-hydrate from stored baseline + the new fragment; keep the viewer's theme.
      setState((s) => ({ ...applyDecoded(storedState(), decodeState(fragment)), themeChoice: s.themeChoice }))
      persist.current = false
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [encoded])

  // Content/settings edits funnel through here so persistence turns on.
  const mutate = useCallback((updater: (s: AppState) => AppState) => {
    persist.current = true
    setState(updater)
  }, [])

  // Navigation (tool / check screen) is not a content edit — it must NOT flip the
  // ephemeral flag, so merely browsing an opened link never adopts its monitors.
  const navigate = useCallback((updater: (s: AppState) => AppState) => setState(updater), [])

  const setTool = useCallback((tool: Tool) => navigate((s) => ({ ...s, tool })), [navigate])

  // Theme is the viewer's own preference: always persisted, never in the URL, and
  // it doesn't flip the ephemeral flag (flipping dark mode on a shared link must
  // not adopt that link's monitors into the viewer's localStorage).
  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setState((s) => ({ ...s, themeChoice: next }))
  }, [resolvedTheme])

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
    (checkScreen: string | null) => navigate((s) => ({ ...s, checkScreen })),
    [navigate],
  )

  const addMonitor = useCallback(
    (input: MonitorInput) =>
      mutate((s) => ({ ...s, monitors: [...s.monitors, { ...input, id: uid(), visible: true }] })),
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
    monitors,
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
