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
      // Update silently in the background — no reload prompt.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
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
        // Any in-app navigation resolves to the cached shell when offline.
        navigateFallback: 'index.html',
      },
    }),
  ],
})
