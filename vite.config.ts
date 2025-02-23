import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  base: process.env.NODE_ENV === 'production' ? '/3d-room-design/' : '/',
  // base:'/3d-room-design/',
})
