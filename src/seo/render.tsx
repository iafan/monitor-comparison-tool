import { renderToStaticMarkup } from 'react-dom/server'
import { getStaticPages, type StaticPage } from './pages'
import { AspectExplainer } from './AspectExplainer'
import { CurvatureConcept } from './CurvatureConcept'
import { CurveExplainer } from './CurveExplainer'
import { ResolutionExplainer } from './ResolutionExplainer'
import { SizeExplainer } from './SizeExplainer'

const SITE = 'https://monitorture.com'

// Inline, before-paint theme sync — mirrors index.html so these static pages
// respect a saved light/dark choice with no flash. Assets are one level up.
const THEME_SCRIPT = `try{var t=localStorage.getItem('monitor-comparison:theme:v1');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function documentHtml(page: StaticPage, body: string, cssHref: string): string {
  const url = `${SITE}/${page.path}/`
  const title = esc(page.title)
  const desc = esc(page.description)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <script>${THEME_SCRIPT}</script>
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/svg+xml" href="../icon.svg" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/svg+xml" href="../icon-dark.svg" media="(prefers-color-scheme: dark)" />
    <link rel="apple-touch-icon" href="../apple-touch-icon.png" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a1a19" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Monitorture" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <link rel="stylesheet" href="../${cssHref}" />
  </head>
  <body>${body}</body>
</html>
`
}

/** Render every static page to a full, self-contained HTML document. */
export function renderStaticPages(opts: { cssHref: string }): { path: string; html: string }[] {
  return getStaticPages().map((page) => {
    let el
    switch (page.kind) {
      case 'size':
        el = <SizeExplainer {...page.props} />
        break
      case 'curve':
        el = <CurveExplainer {...page.props} />
        break
      case 'curve-concept':
        el = <CurvatureConcept {...page.props} />
        break
      case 'aspect':
        el = <AspectExplainer {...page.props} />
        break
      default:
        el = <ResolutionExplainer {...page.props} />
    }
    const body = renderToStaticMarkup(el)
    return { path: page.path, html: documentHtml(page, body, opts.cssHref) }
  })
}

/** An XML sitemap listing the app home plus every generated static page. */
export function renderSitemap(): string {
  const locs = [`${SITE}/`, ...getStaticPages().map((p) => `${SITE}/${p.path}/`)]
  const urls = locs.map((loc) => `  <url>\n    <loc>${esc(loc)}</loc>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
