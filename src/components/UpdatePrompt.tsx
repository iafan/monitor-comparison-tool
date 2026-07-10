import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Keep the overlay up for at least this long so a fast update doesn't just
// flash — it should read as a deliberate "updating" moment.
const MIN_VISIBLE_MS = 500

/**
 * When a new app version is available, show a small centered "Updating…" overlay
 * (matching the in-app chip overlays) while it applies, then reload. The user can
 * dismiss it by clicking outside the chip; once dismissed, we don't self-reload
 * this session (the new version applies on the next natural load instead).
 */
export function UpdatePrompt() {
  const [visible, setVisible] = useState(false)
  const dismissedRef = useRef(false)
  const shownAtRef = useRef(0)

  const show = () => {
    if (dismissedRef.current) return
    if (shownAtRef.current === 0) shownAtRef.current = Date.now()
    setVisible(true)
  }

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Surface the overlay as soon as a new worker starts downloading, so it's
    // visible for the whole fetch (not just the instant it's ready). Only for a
    // real update, though: `updatefound` also fires on the very first install
    // (no SW yet), and that install never flips `needRefresh`, so showing then
    // would leave "Updating…" up forever. `registration.active` is null on the
    // first install and set once a worker already controls the page.
    onRegisteredSW(_swUrl, registration) {
      registration?.addEventListener('updatefound', () => {
        if (registration.installing && registration.active) show()
      })
    },
  })

  // needRefresh flips true once the new version is fully downloaded and waiting.
  // Show the overlay (if not already), then reload after the minimum — unless
  // the user dismissed it in the meantime.
  useEffect(() => {
    if (!needRefresh || dismissedRef.current) return
    show()
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current))
    const t = window.setTimeout(() => {
      if (!dismissedRef.current) updateServiceWorker(true)
    }, wait)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh, updateServiceWorker])

  const dismiss = () => {
    dismissedRef.current = true
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={dismiss}>
      <div
        className="rounded-lg bg-black/55 px-5 py-3 text-xs text-white shadow"
        onClick={(e) => e.stopPropagation()}
      >
        Updating…
      </div>
    </div>
  )
}
