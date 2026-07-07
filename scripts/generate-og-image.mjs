// Generates the Open Graph / social share image (public/og-image.png, 1200×630).
//
// Usage:
//   node scripts/generate-og-image.mjs [outputPath]
//     outputPath  default: public/og-image.png
//
// The card mirrors the app: on the left the logo, wordmark and tagline; on the
// right a faithful, to-scale rendering of four real database monitors (a mix of
// flat and curved) — a front view of nested rectangles above a top view of
// curvature arcs, both sharing one scale and horizontal center, exactly as the
// comparison tool draws them (no labels). The logo is read from public/icon.svg
// so it never drifts from the real favicon.
//
// Rendering uses playwright-core + a Chromium. This repo's sandbox ships both;
// elsewhere run `npm i -D playwright-core && npx playwright install chromium`
// (or point CHROMIUM_PATH at an existing Chromium). This is a manual maintenance
// script — it is not part of the app build, so playwright-core is not a package
// dependency. Re-run it whenever the logo, palette, or copy changes.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const out = process.argv[2] || 'public/og-image.png'
const logoSvg = readFileSync('public/icon.svg', 'utf8')

// The eight series colors, dark-theme values (vivid on the card's dark background).
const SERIES = ['#4d8bef', '#2bb04a', '#ef5652', '#e0a92a', '#9a7cf1', '#e563b4', '#22b4d6', '#f0813f']

// Four real monitors from the database — two flat, two curved (1800R & 2300R).
// Distinct panel sizes so the front view nests cleanly.
const MONITORS = [
  { resWidth: 2560, resHeight: 1440, diagonal: 27, curveRadius: null }, // flat
  { resWidth: 2560, resHeight: 1440, diagonal: 31.5, curveRadius: null }, // flat
  { resWidth: 3440, resHeight: 1440, diagonal: 34, curveRadius: 1800 }, // 1800R
  { resWidth: 3840, resHeight: 1600, diagonal: 37.5, curveRadius: 2300 }, // 2300R
]

// Physical panel size in inches from resolution + diagonal (matches src/lib/geometry).
function physical(m) {
  const diagPx = Math.hypot(m.resWidth, m.resHeight)
  return { w: (m.diagonal * m.resWidth) / diagPx, h: (m.diagonal * m.resHeight) / diagPx }
}
// Top-view arc points in inches: apex (screen center, farthest from viewer) at y=0,
// edges curving toward the viewer at +y (matches src/components/TopView). Flat = a line.
function arcPoints(w, R) {
  if (!R) return [[-w / 2, 0], [w / 2, 0]]
  const rIn = R / 25.4
  const theta = w / rIn
  const N = 48
  const pts = []
  for (let i = 0; i <= N; i++) {
    const b = -theta / 2 + (theta * i) / N
    pts.push([rIn * Math.sin(b), rIn * (1 - Math.cos(b))])
  }
  return pts
}

// Assign colors by descending panel area — the app's on-screen order (largest first,
// which also draws first so it sits behind).
const items = MONITORS.map((m) => ({ ...m, ...physical(m) }))
  .map((m) => ({ ...m, area: m.w * m.h, arc: arcPoints(physical(m).w, m.curveRadius) }))
  .sort((a, b) => b.area - a.area)
  .map((m, i) => ({ ...m, color: SERIES[i] }))

const maxW = Math.max(...items.map((m) => m.w))
const maxH = Math.max(...items.map((m) => m.h))
const maxSag = Math.max(...items.map((m) => m.arc[m.arc.length - 1][1]))

// One shared scale (px per inch) and horizontal center for both views.
const scale = 12
const margin = 6
const gap = 26 // vertical gap between front and top views
const drawW = maxW * scale
const cx = margin + drawW / 2
const apexY = margin + maxH * scale + gap // top-view back line: aligned apexes
const svgW = drawW + margin * 2
const svgH = apexY + maxSag * scale + margin

// Front view: rectangles centered on both axes (app's "center" alignment), largest behind.
const rects = items
  .map(
    (m) =>
      `<rect x="${(margin + ((maxW - m.w) / 2) * scale).toFixed(1)}" y="${(margin + ((maxH - m.h) / 2) * scale).toFixed(1)}" width="${(m.w * scale).toFixed(1)}" height="${(m.h * scale).toFixed(1)}" rx="4" fill="none" stroke="${m.color}" stroke-width="5"/>`,
  )
  .join('')
// Top view: arcs centered horizontally, apexes (farthest point) aligned at the back line.
const tops = items
  .map((m) => {
    const pts = m.arc.map(([x, y]) => `${(cx + x * scale).toFixed(1)},${(apexY + y * scale).toFixed(1)}`).join(' ')
    return `<polyline points="${pts}" fill="none" stroke="${m.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  })
  .join('')
const stageSvg = `<svg viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}" width="${svgW.toFixed(1)}" height="${svgH.toFixed(1)}">${rects}${tops}</svg>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1200px; height:630px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: radial-gradient(120% 140% at 80% 15%, #232320 0%, #141413 55%, #0d0d0c 100%);
    color:#fff; display:flex; align-items:center; padding:64px 72px; gap:44px; overflow:hidden;
  }
  .left { flex:1 1 auto; min-width:0; }
  .brandrow { display:flex; align-items:center; gap:22px; margin-bottom:34px; }
  .logo { width:96px; height:96px; border-radius:20px; overflow:hidden; box-shadow:0 6px 30px rgba(0,0,0,.5); flex:none; }
  .logo svg { display:block; width:100%; height:100%; }
  .wordmark { font-size:74px; font-weight:800; letter-spacing:-1.5px; }
  .tagline { font-size:40px; font-weight:700; line-height:1.15; margin-bottom:18px; }
  .sub { font-size:28px; font-weight:400; color:#b9b8b1; line-height:1.4; max-width:580px; }
  .stage { flex:none; display:flex; align-items:center; }
  .stage svg { display:block; }
</style></head><body>
  <div class="left">
    <div class="brandrow">
      <div class="logo">${logoSvg}</div>
      <div class="wordmark">Monitorture</div>
    </div>
    <div class="tagline">Because choosing a monitor is hard.</div>
    <div class="sub">Compare monitor sizes side by side, drawn to scale — resolution, aspect ratio, PPI, and curvature.</div>
  </div>
  <div class="stage">${stageSvg}</div>
</body></html>`

/** Find a usable Chromium: explicit env, then any build under PLAYWRIGHT_BROWSERS_PATH, else Playwright's default. */
function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (base && existsSync(base)) {
    for (const dir of readdirSync(base)) {
      if (!dir.startsWith('chromium-') || dir.includes('headless')) continue
      for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
        const p = join(base, dir, sub)
        if (existsSync(p)) return p
      }
    }
  }
  return undefined // let Playwright resolve its own default
}

const executablePath = resolveChromiumPath()
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

const { size } = statSync(out)
console.log(`Wrote ${out} (1200×630, ${size} bytes)`)
