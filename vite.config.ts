import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the build works both at the custom domain root
// (https://monitorture.com/) and the project-pages path
// (https://<user>.github.io/monitor-comparison-tool/). Every asset is then
// referenced relative to index.html rather than an absolute base path.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
