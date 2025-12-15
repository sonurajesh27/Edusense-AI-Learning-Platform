import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    hmr: {
      overlay: true
    },
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ]
  }
})
