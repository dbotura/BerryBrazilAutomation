import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const uiPort = Number(process.env.VITE_PORT || 5173)
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: uiPort,
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  }
})
