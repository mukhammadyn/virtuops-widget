import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',  // ← добавь это
    'process.env': '{}',                      // ← и это на всякий случай
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'VirtuOpsWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
  },
})
