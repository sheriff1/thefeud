import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true, // Allow external access
    allowedHosts: [
      '9c57-2600-4040-225a-9800-f1cb-d38d-7816-e06f.ngrok-free.app' // Add the ngrok domain
    ],
    headers: {
      'Cache-Control': 'no-store', // Disable caching
    }
  }
})
