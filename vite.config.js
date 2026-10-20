import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0, 127.0.0.1, localhost)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle pdfjs-dist in dev mode so Vite doesn't try to re-transform it every time
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires manualChunks as a function, not a plain object
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) return 'pdf-lib';
          if (id.includes('mammoth')) return 'docx-lib';
        },
      },
    },
  },
})
