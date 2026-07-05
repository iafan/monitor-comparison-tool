import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Crosshatch geometry test card drawn at the true device resolution: a square
 * grid centered on screen (so a line runs through the exact center), two
 * circles to reveal aspect/roundness and pincushion/barrel distortion, and a
 * 1px white border hugging the very edge to check for overscan clipping.
 */
function GeometryCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      // Integer CSS dimensions (not the fractional getBoundingClientRect) so the
      // far right/bottom edge lands exactly on device pixels — otherwise the
      // outline there falls on a sub-pixel and disappears.
      const cssW = parent.clientWidth
      const cssH = parent.clientHeight
      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const lw = Math.max(1, Math.round(dpr)) // grid line ≈ 1 CSS px
      const cxf = w / 2
      const cyf = h / 2
      const cell = Math.max(8, Math.round(Math.min(w, h) / 14)) // ~14 square cells on the short side

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'

      // Grid lines stepping out from the true center in ± pairs (center drawn below).
      for (let k = 1; cxf + k * cell < w; k++) {
        ctx.fillRect(Math.round(cxf + k * cell - lw / 2), 0, lw, h)
        ctx.fillRect(Math.round(cxf - k * cell - lw / 2), 0, lw, h)
      }
      for (let k = 1; cyf + k * cell < h; k++) {
        ctx.fillRect(0, Math.round(cyf + k * cell - lw / 2), w, lw)
        ctx.fillRect(0, Math.round(cyf - k * cell - lw / 2), w, lw)
      }

      // A 1px line can't sit on the middle of an even pixel count, so widen the
      // center bar by one pixel when needed to keep equal margins on both sides
      // (2px straddling the center on an even-dimension screen, 1px on an odd one).
      const bar = (dim: number) => {
        let size = lw
        if ((dim - size) % 2 !== 0) size += 1
        return { pos: (dim - size) / 2, size }
      }
      const vb = bar(w)
      const hb = bar(h)
      ctx.fillRect(vb.pos, 0, vb.size, h)
      ctx.fillRect(0, hb.pos, w, hb.size)

      // Alignment circles: one touching the shorter-dimension sides, one touching
      // the longer-dimension sides (clipped top/bottom or left/right), and a small
      // central one — all should read as true circles if aspect and linearity are right.
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.arc(cxf, cyf, Math.min(w, h) / 2 - lw, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cxf, cyf, Math.max(w, h) / 2 - lw, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cxf, cyf, cell * 2, 0, Math.PI * 2)
      ctx.stroke()

      // Edge outline — drawn last so it stays crisp against the grid.
      ctx.fillRect(0, 0, w, lw)
      ctx.fillRect(0, h - lw, w, lw)
      ctx.fillRect(0, 0, lw, h)
      ctx.fillRect(w - lw, 0, lw, h)
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(parent)
    window.addEventListener('resize', draw)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [])

  return <canvas ref={ref} className="block" />
}

export function MonitorGeometry() {
  const [active, setActive] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const hintTimer = useRef<number | undefined>(undefined)

  const open = useCallback(() => {
    setActive(true)
    surfaceRef.current?.requestFullscreen?.().catch(() => {})
  }, [])

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    setActive(false)
  }, [])

  const pokeHint = useCallback(() => {
    setShowHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setShowHint(false), 2500)
  }, [])

  useEffect(() => {
    if (!active) return
    pokeHint()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) setActive(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
      window.clearTimeout(hintTimer.current)
    }
  }, [active, close, pokeHint])

  return (
    <section>
      <p className="mb-5 text-sm text-[var(--text-secondary)]">
        Full-screen patterns for checking display geometry — edges, linearity, centering, and
        overscan. Pick a card to go full screen; <kbd>Esc</kbd> or click to exit.
      </p>

      <button
        type="button"
        onClick={open}
        className="flex w-full max-w-[420px] cursor-pointer flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 text-left"
      >
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg border border-[var(--border)]">
          <GeometryCanvas />
        </span>
        <span className="px-1 text-sm font-semibold text-[var(--text-primary)]">Geometry test card</span>
        <span className="px-1 pb-1 text-xs text-[var(--text-muted)]">
          Crosshatch grid, circles, and edge outline
        </span>
      </button>

      {/* Fullscreen surface: always mounted so requestFullscreen has a target. */}
      <div
        ref={surfaceRef}
        onMouseMove={active ? pokeHint : undefined}
        onClick={active ? close : undefined}
        className={active ? 'fixed inset-0 z-50 h-full w-full cursor-none bg-black' : 'hidden'}
        role={active ? 'img' : undefined}
        aria-label={active ? 'Geometry test card' : undefined}
      >
        {active && <GeometryCanvas />}
        {active && (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4 transition-opacity duration-300 ${
              showHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
              <span>Geometry</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  close()
                }}
                className="cursor-pointer rounded px-2 py-1 hover:bg-white/15"
                aria-label="Exit test"
              >
                Esc ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
