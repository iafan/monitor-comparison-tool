// Renders the SEO static pages into dist/. Run AFTER `npm run build` (it reuses
// the app's built CSS and writes alongside it). Kept as a separate command
// (`npm run build-seo-pages`) so the normal build stays fast.
//
// Uses Vite's SSR module loader to import the TSX renderer directly (transpiled
// on the fly, sharing the app's aliases/config) — no separate bundling step.
import { createServer } from 'vite'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = 'dist'

const assetsDir = join(DIST, 'assets')
if (!existsSync(assetsDir)) {
  console.error('No dist/ found — run `npm run build` first.')
  process.exit(1)
}
const cssFile = (await readdir(assetsDir)).find((f) => f.endsWith('.css'))
if (!cssFile) {
  console.error('No built CSS in dist/assets — run `npm run build` first.')
  process.exit(1)
}
const cssHref = `assets/${cssFile}`

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})
try {
  const { renderStaticPages, renderSitemap, renderPageIndex, renderHomeLinksFooter } =
    await vite.ssrLoadModule('/src/seo/render.tsx')
  const pages = renderStaticPages({ cssHref })
  for (const page of pages) {
    const dir = join(DIST, page.path)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'index.html'), page.html)
    console.log(`wrote ${join(page.path, 'index.html')} (${page.html.length} bytes)`)
  }
  await writeFile(join(DIST, 'sitemap.xml'), renderSitemap())
  console.log('wrote sitemap.xml')

  // Internal debug index of every generated page — deliberately NOT in the
  // sitemap. Written after the sitemap so it can never leak into it.
  const index = renderPageIndex()
  await mkdir(join(DIST, index.path), { recursive: true })
  await writeFile(join(DIST, index.path, 'index.html'), index.html)
  console.log(`wrote ${join(index.path, 'index.html')} (debug index, unlisted)`)

  // Inject a crawlable "Monitor guides" footer into the SPA shell so the landing
  // pages are reachable by internal links. It goes after #root, which React
  // owns and never touches, so the app is unaffected.
  const indexPath = join(DIST, 'index.html')
  const shell = await readFile(indexPath, 'utf8')
  const footer = renderHomeLinksFooter()
  if (shell.includes('</body>') && !shell.includes('Monitor guides')) {
    await writeFile(indexPath, shell.replace('</body>', `    ${footer}\n  </body>`))
    console.log('injected home guides footer into index.html')
  }

  console.log(`\n${pages.length} SEO page(s) generated.`)
} finally {
  await vite.close()
}
