import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      livegauge: path.resolve(__dirname, '../src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        gauge: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
