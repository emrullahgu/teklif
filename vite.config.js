import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        bordro: resolve(__dirname, 'bordro.html'),
        'beyaz-yaka': resolve(__dirname, 'beyaz-yaka.html'),
        kontrol: resolve(__dirname, 'kontrol.html'),
        osos: resolve(__dirname, 'osos.html')
      }
    }
  }
})
