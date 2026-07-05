import { useCallback, useEffect, useState } from 'react'
import type { Theme } from '../types'
import { loadTheme, saveTheme } from '../lib/storage'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Resolved light/dark theme. Seeds from an explicit stored choice, falling back
 * to the system preference, and mirrors the current value onto the root element's
 * `data-theme` attribute so the CSS palette tokens override the media query.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}
