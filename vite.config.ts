import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,       // 점유 시 실패(증분 금지)
    hmr: { clientPort: 5173 },
    proxy: { 
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  preview: {
    host: 'localhost',
    port: 4173,             // 기본 프리뷰 포트
    strictPort: true
  }
});
