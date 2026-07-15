/**
 * True when the app is running as an installed PWA (its own window), false in a
 * normal browser tab. We register the service worker only when installed, so the
 * browser behaves like a plain website (always fresh from the network) while the
 * installed app keeps its offline cache. `navigator.standalone` is the iOS Safari
 * signal; the display-mode media queries cover everyone else.
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
