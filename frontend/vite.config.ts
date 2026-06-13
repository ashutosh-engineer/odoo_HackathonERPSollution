import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/shiv': {
        target: 'http://localhost:8069',
        changeOrigin: true,
        secure: false,
      },
      '/web': {
        target: 'http://localhost:8069',
        changeOrigin: true,
        secure: false,
      },
      '/web/static': {
        target: 'http://localhost:8069',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
