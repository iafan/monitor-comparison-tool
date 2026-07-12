import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the build works both at the custom domain root
// (https://monitorture.com/) and the project-pages path
// (https://<user>.github.io/monitor-comparison-tool/). Every asset is then
// referenced relative to index.html rather than an absolute base path.
export default defineConfig({
  base: './',
  // Listen on all interfaces so the dev server is reachable from other devices
  // on the LAN (e.g. a phone) via the printed Network URL, not just localhost.
  server: { host: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // We drive the update ourselves (see UpdatePrompt): show a brief overlay,
      // then reload — unless the user dismisses it. 'prompt' keeps the plugin
      // from silently reloading, and we register the SW via useRegisterSW.
      registerType: 'prompt',
      injectRegister: null,
      // The app ships its own public/manifest.webmanifest (linked from
      // index.html), so let the plugin manage only the service worker.
      manifest: false,
      workbox: {
        // Precache the whole build for full offline use, including the (large)
        // lazy-loaded 3D simulator chunk. Content-hashed filenames make this
        // safe; a new build swaps the precache and old caches are cleaned up.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Control the page on first install (offline works from the first visit).
        // skipWaiting stays off so a new version waits for our update overlay
        // instead of activating — and reloading — on its own.
        clientsClaim: true,
        skipWaiting: false,
        // The SPA is hash-routed, so it only ever lives at the site root — that
        // is the ONLY navigation that should resolve to the cached shell. An
        // allowlist of just "/" means every other path is served as-is from the
        // network: the prerendered SEO pages (their own directories) and static
        // files (sitemap.xml, robots.txt) are all real pre-generated files, so
        // the SW must never hand them the shell instead — its relative
        // (base:'./') asset URLs would 404 under the subpath and blank the page.
        // An allowlist (vs. a denylist enumerating page URL shapes) needs no
        // upkeep as new page types are added and can't silently miss one.
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/$/],
      },
    }),
  ],
})
