import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The data grid is the command center's primary control, so deferring it
    // would only delay first utility. Keep a tight ceiling above the modular
    // AG Grid entry chunk (about 1.05 MB raw / 300 KB gzip).
    chunkSizeWarningLimit: 1100,
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
