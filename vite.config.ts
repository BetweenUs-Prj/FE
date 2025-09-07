import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // RecommendationService (places, stations)
      '/api/places': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      '/api/place-stations': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      '/api/stations': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      '/api/recommendations': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // PromiseService (meetings) - assuming it will use port 8083
      '/api/meetings': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      // Fallback for any other API calls
      '/api': {
        target: 'http://54.180.60.200:8081',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
