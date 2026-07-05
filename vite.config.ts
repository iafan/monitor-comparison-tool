import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Project pages are served from https://<user>.github.io/monitor-comparison-tool/,
// so assets must be referenced under that base path.
export default defineConfig({
  base: '/monitor-comparison-tool/',
  plugins: [react(), tailwindcss()],
})
