import { useRef } from 'react'
import type { TouchEvent } from 'react'

interface Options {
  /** Fired on release after a downward swipe clears the threshold. */
  onSwipeDown: () => void
  /** Minimum downward travel, in px, to count as a dismiss (default 80). */
  threshold?: number
  /** Turn the gesture off (e.g. when no full-screen surface is open). Default true. */
  enabled?: boolean
}

interface Handlers {
  onTouchStart?: (e: TouchEvent) => void
  onTouchEnd?: (e: TouchEvent) => void
}

/**
 * Pluggable "swipe down to dismiss" gesture for full-screen surfaces. Spread the
 * returned handlers onto the element:
 *
 *   <div {...useSwipeDown({ onSwipeDown: close, enabled: active !== null })} />
 *
 * A single touch travelling mostly downward past the threshold fires onSwipeDown
 * on release. Taps and horizontal drags are ignored, so it coexists with
 * tap-to-toggle behaviour on the same surface (a tap simply never clears the
 * threshold). Touch-only by nature, so it engages on phones/tablets and stays
 * out of the way on pointer devices.
 */
export function useSwipeDown({ onSwipeDown, threshold = 80, enabled = true }: Options): Handlers {
  const start = useRef<{ x: number; y: number } | null>(null)

  if (!enabled) return {}

  return {
    onTouchStart: (e) => {
      // Only track single-finger gestures; ignore pinch/zoom.
      start.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    },
    onTouchEnd: (e) => {
      const s = start.current
      start.current = null
      const t = e.changedTouches[0]
      if (!s || !t) return
      const dy = t.clientY - s.y
      const dx = t.clientX - s.x
      // Downward, past the threshold, and clearly more vertical than horizontal.
      if (dy >= threshold && dy > Math.abs(dx) * 1.5) onSwipeDown()
    },
  }
}
