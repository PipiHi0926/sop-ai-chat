import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 開發時，/api 請求自動轉發到 FastAPI 後端
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // build 後產出到 frontend/dist，由 FastAPI 靜態托管
    outDir: 'dist',
  },
})
