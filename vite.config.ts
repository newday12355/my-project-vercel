import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",   // makes assets load correctly on Vercel
  build: {
    rollupOptions: {
      input: 'index.html',   // entry file
    }
  }
})
