// Notify IndexNow-participating search engines (Bing, Yandex, Seznam, Naver —
// NOT Google, which is Search-Console only) that our URLs changed, so they
// re-crawl promptly. Reads the generated sitemap for the URL list. Run AFTER
// `npm run build-seo-pages`, as the deploy's last step.
//
// The key is a public shared token: it is also served at
// https://monitorture.com/<key>.txt (public/<key>.txt) so IndexNow can verify
// we own the host. Not a secret — safe to commit.
//
// `--dry-run` prints the payload without submitting.
import { readFile } from 'node:fs/promises'

const HOST = 'monitorture.com'
const KEY = 'c7da2b54bc77b0050aa74e63a1d4c4b7'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

try {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8')
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (urlList.length === 0) {
    console.warn('ping-indexnow: no URLs in dist/sitemap.xml — nothing to submit.')
    process.exit(0)
  }

  const payload = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }

  if (process.argv.includes('--dry-run')) {
    console.log(`ping-indexnow [dry-run]: would submit ${urlList.length} URL(s)`)
    console.log(JSON.stringify(payload, null, 2))
    process.exit(0)
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  // 200 and 202 both mean accepted. Never fail the deploy on a ping problem.
  console.log(`ping-indexnow: submitted ${urlList.length} URL(s) — ${res.status} ${res.statusText}`)
  if (!res.ok) console.warn('ping-indexnow: non-OK response (ignored):', await res.text().catch(() => ''))
} catch (err) {
  console.warn('ping-indexnow: skipped due to error (ignored):', err?.message ?? err)
}
