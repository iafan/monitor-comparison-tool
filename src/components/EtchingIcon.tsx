import { useEffect, useRef, useState } from 'react'

interface Props {
  /**
   * Rendered square size in CSS px. Rounded to a multiple of 3 so the two
   * passes (3→1 px blocks) tile evenly. Defaults to 18 — sized to sit next to
   * body text, smaller than the 32px logo.
   */
  size?: number
  className?: string
}

// Coarse→fine block sizes for the two etching passes.
const PASSES = [3, 1] as const
// Wall-clock budget per pass (ms): the coarse pass lands deliberately, the fine
// pass sweeps quickly, so the icon appears to sharpen into focus.
const PASS_MS: Record<number, number> = { 3: 850, 1: 1500 }
// Pause on the finished icon before clearing and re-etching.
const HOLD_MS = 550

function isDarkTheme(): boolean {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark') return true
  if (attr === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

interface Op {
  x: number
  y: number
  w: number
  h: number
  fill: string
  dwell: number
}

/**
 * A tiny thematic "loading" animation: the app's own icon plots itself in, like
 * a pen plotter etching an image — two coarse-to-fine passes (3px, then 1px
 * blocks) scanned left→right, top→bottom. A white cursor head sits on
 * each block for a beat before it's filled with the block's real color, so you
 * watch it draw. Only blocks touching the icon's circle are etched (the corners
 * are skipped), and the canvas is clipped to that circle. Loops.
 *
 * Self-contained and reusable: pass `size`. Theme-aware via the resolved
 * `data-theme` on <html> (re-inits if the theme flips while mounted). Honors
 * prefers-reduced-motion by painting the finished icon with no animation.
 */
export function EtchingIcon({ size = 18, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dark, setDark] = useState(isDarkTheme)

  // Track theme flips so the etched icon matches the active palette.
  useEffect(() => {
    const sync = () => setDark(isDarkTheme())
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // N = logical grid (a multiple of 9). `cell` is the device-px size of one
    // logical cell — kept an integer so blocks stay crisp; the backing store is
    // then CSS-scaled down to `size` px.
    const N = Math.max(3, Math.round(size / 3) * 3)
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
    const cell = Math.max(1, Math.round((size * dpr) / N))
    const dim = N * cell
    canvas.width = dim
    canvas.height = dim
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const img = new Image()
    img.decoding = 'async'
    img.width = N
    img.height = N

    let raf = 0
    let cancelled = false

    img.onload = () => {
      if (cancelled) return

      // Sample the icon at the logical grid — one averaged color per cell
      // (smoothing on downsamples the 1200px art into representative pixels).
      const off = document.createElement('canvas')
      off.width = N
      off.height = N
      const octx = off.getContext('2d')
      if (!octx) return
      octx.drawImage(img, 0, 0, N, N)
      const data = octx.getImageData(0, 0, N, N).data

      const R = N / 2
      // Keep a block only if it touches the inscribed circle (nearest point to
      // center within R). Edge blocks are kept; border-radius clips the overflow.
      const touchesCircle = (x: number, y: number, w: number, h: number) => {
        const nx = Math.max(x, Math.min(R, x + w))
        const ny = Math.max(y, Math.min(R, y + h))
        return (nx - R) ** 2 + (ny - R) ** 2 <= R * R
      }
      const avgColor = (x: number, y: number, w: number, h: number) => {
        let r = 0,
          g = 0,
          b = 0,
          n = 0
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const i = (yy * N + xx) * 4
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            n++
          }
        return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`
      }

      // Ordered op list: three passes, each raster-scanned L→R, T→B.
      const ops: Op[] = []
      for (const B of PASSES) {
        const passOps: Op[] = []
        for (let by = 0; by < N; by += B)
          for (let bx = 0; bx < N; bx += B) {
            const w = Math.min(B, N - bx)
            const h = Math.min(B, N - by)
            if (!touchesCircle(bx, by, w, h)) continue
            passOps.push({ x: bx, y: by, w, h, fill: avgColor(bx, by, w, h), dwell: 0 })
          }
        const dwell = (PASS_MS[B] ?? 800) / Math.max(1, passOps.length)
        for (const o of passOps) o.dwell = dwell
        ops.push(...passOps)
      }

      const fill = (o: Op, c: CanvasRenderingContext2D) => {
        c.fillStyle = o.fill
        c.fillRect(o.x * cell, o.y * cell, o.w * cell, o.h * cell)
      }

      if (reduce) {
        for (const o of ops) fill(o, ctx)
        return
      }

      // `committed` holds painted blocks; the visible canvas = committed + the
      // white cursor head on the block that's about to be filled.
      const committed = document.createElement('canvas')
      committed.width = dim
      committed.height = dim
      const cctx = committed.getContext('2d')!

      const drawCursor = (o: Op) => {
        const x = o.x * cell,
          y = o.y * cell,
          w = o.w * cell,
          h = o.h * cell
        ctx.save()
        ctx.shadowColor = 'rgba(255,255,255,0.9)'
        ctx.shadowBlur = cell * 1.5
        ctx.fillStyle = '#fff'
        ctx.fillRect(x, y, w, h)
        ctx.restore()
        // Faint dark edge so the head reads on light areas of the icon.
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
      }
      const render = (headIndex: number) => {
        ctx.clearRect(0, 0, dim, dim)
        ctx.drawImage(committed, 0, 0)
        if (headIndex < ops.length) drawCursor(ops[headIndex])
      }

      let i = 0
      let acc = 0
      let holding = 0
      let last = 0
      const loop = (t: number) => {
        if (cancelled) return
        if (!last) last = t
        const dt = t - last
        last = t

        if (i >= ops.length) {
          // Done — hold the finished icon, then clear and re-etch.
          holding += dt
          if (holding >= HOLD_MS) {
            cctx.clearRect(0, 0, dim, dim)
            i = 0
            acc = 0
            holding = 0
          }
          render(ops.length)
          raf = requestAnimationFrame(loop)
          return
        }

        acc += dt
        // Commit every block the cursor has dwelt on, then park it on the next.
        while (i < ops.length && acc >= ops[i].dwell) {
          acc -= ops[i].dwell
          fill(ops[i], cctx)
          i++
        }
        render(i)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    img.src = `${import.meta.env.BASE_URL}${dark ? 'icon-dark.svg' : 'icon.svg'}`

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [size, dark])

  return (
    <canvas ref={canvasRef} className={className} style={{ borderRadius: '50%', display: 'block' }} aria-hidden="true" />
  )
}
