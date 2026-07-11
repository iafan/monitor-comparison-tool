import { useEffect, useRef } from 'react'

/** The only supported render sizes (CSS px). All even so the 2px blocks tile
 *  evenly. */
type EtchSize = 18 | 24 | 30

interface Props {
  /** Rendered square size in CSS px — one of 18, 24, 30. Defaults to 18. */
  size?: EtchSize
  className?: string
}

// Every pass etches 2×2px blocks; passes rotate through the logo's R/G/B (the
// blue is the logo's, not pure blue) indefinitely.
const BLOCK = 2
const TINTS = [
  [255, 0, 0], // logo red   #ff0000
  [0, 255, 0], // logo green #00ff00
  [77, 132, 255], // logo blue  #4d84ff
] as const
// Four brightness gradations applied to the tint (no fully-black dots).
const GRADATIONS = [0.25, 0.5, 0.75, 1] as const

interface Op {
  x: number
  y: number
}

/**
 * A tiny "loading" animation: a field of 2×2px dots plots itself in like a pen
 * plotter, scanned left→right, top→bottom, one dot per animation frame, with a
 * white cursor head leading the reveal. Each dot's brightness is one of four
 * gradations drawn from a random (size/2)×(size/2) matrix, tinted by the
 * current pass color. Passes cycle through the logo's R → G → B indefinitely,
 * and the matrix is re-randomized before each pass — so the picture constantly
 * shimmers and shifts hue. Dots are confined to the inscribed circle (corners
 * skipped) and the canvas is clipped to that circle.
 *
 * Self-contained and reusable: pass `size` (18/24/30). Honors
 * prefers-reduced-motion by painting a single static tinted field (no loop).
 */
export function EtchingIcon({ size = 18, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // N = logical grid = size. `cell` is the device-px size of one logical cell
    // — an integer so dots stay crisp; the backing store is CSS-scaled to `size`.
    const N = size
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
    const cell = Math.max(1, Math.round((size * dpr) / N))
    const dim = N * cell
    canvas.width = dim
    canvas.height = dim
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const R = N / 2
    const touchesCircle = (x: number, y: number, w: number, h: number) => {
      const nx = Math.max(x, Math.min(R, x + w))
      const ny = Math.max(y, Math.min(R, y + h))
      return (nx - R) ** 2 + (ny - R) ** 2 <= R * R
    }

    // The dot grid: 2×2 blocks within the circle, raster-scanned. One scan is
    // reused for every pass; the matrix below supplies the per-dot brightness.
    const M = N / BLOCK
    const ops: Op[] = []
    for (let by = 0; by < N; by += BLOCK)
      for (let bx = 0; bx < N; bx += BLOCK) {
        if (!touchesCircle(bx, by, BLOCK, BLOCK)) continue
        ops.push({ x: bx, y: by })
      }

    // M×M matrix of gradation indices; re-rolled before every pass.
    const matrix = new Uint8Array(M * M)
    const randomize = () => {
      for (let k = 0; k < matrix.length; k++) matrix[k] = Math.floor(Math.random() * GRADATIONS.length)
    }

    // Paint a dot as its matrix gradation × the pass tint.
    const fill = (o: Op, tint: readonly [number, number, number], c: CanvasRenderingContext2D) => {
      const g = GRADATIONS[matrix[(o.y / BLOCK) * M + o.x / BLOCK]]
      c.fillStyle = `rgb(${Math.round(tint[0] * g)},${Math.round(tint[1] * g)},${Math.round(tint[2] * g)})`
      c.fillRect(o.x * cell, o.y * cell, BLOCK * cell, BLOCK * cell)
    }

    if (reduce) {
      randomize()
      for (const o of ops) fill(o, TINTS[0], ctx)
      return
    }

    // `committed` holds revealed dots; the visible canvas = committed + the
    // white cursor head parked on the dot that's about to be revealed.
    const committed = document.createElement('canvas')
    committed.width = dim
    committed.height = dim
    const cctx = committed.getContext('2d')!

    // A crisp pure-white 2×2 head — no glow/shadow/outline.
    const drawCursor = (o: Op) => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(o.x * cell, o.y * cell, BLOCK * cell, BLOCK * cell)
    }
    const render = (headIndex: number) => {
      ctx.clearRect(0, 0, dim, dim)
      ctx.drawImage(committed, 0, 0)
      drawCursor(ops[headIndex])
    }

    let raf = 0
    let cancelled = false
    let i = 0 // dot index within the current pass
    let pass = 0 // pass counter → selects the tint
    randomize() // matrix for the first pass
    const loop = () => {
      if (cancelled) return
      // Show the white head on the current dot this frame, then commit it in
      // this pass's tint and advance — one dot per animation frame. At the end
      // of a pass, roll to the next tint, re-randomize, and re-etch forever.
      render(i)
      fill(ops[i], TINTS[pass % TINTS.length], cctx)
      if (++i >= ops.length) {
        i = 0
        pass++
        randomize()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [size])

  return (
    <canvas ref={canvasRef} className={className} style={{ borderRadius: '50%', display: 'block' }} aria-hidden="true" />
  )
}
