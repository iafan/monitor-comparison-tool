import { useEffect, useRef, useState } from 'react'

export interface Size {
  width: number
  height: number
}

/**
 * Tracks an element's rendered pixel size via ResizeObserver. Used by the
 * comparison stage to position overlay labels in pixel space.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
