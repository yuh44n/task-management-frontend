import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_APP_API_URL || 'https://task-management-backend-8obs.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
