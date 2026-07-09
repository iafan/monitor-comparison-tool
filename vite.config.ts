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
        // Any in-app navigation resolves to the cached shell when offline.
        navigateFallback: 'index.html',
        // …but NOT the prerendered SEO pages (their own `…-WxH/` directory) or
        // static files (sitemap.xml, robots.txt). Those must be served as-is
        // from the network, never replaced by the SPA shell. Without this, a
        // returning visitor's service worker hijacks the navigation and returns
        // index.html, whose relative (base:'./') asset URLs then 404 under the
        // subpath — a blank page. The SPA itself is hash-routed, so it only ever
        // lives at the root and never needs the fallback for a real subpath.
        navigateFallbackDenylist: [/\d+x\d+\/$/, /\.[^/]+$/],
      },
    }),
  ],
})
