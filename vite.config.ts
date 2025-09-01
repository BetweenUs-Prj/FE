import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force stub out WebSocket modules to prevent runtime errors
      'sockjs-client': path.resolve(__dirname, './src/__stubs__/empty.js'),
      '@stomp/stompjs': path.resolve(__dirname, './src/__stubs__/empty.js'),
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
        secure: false,
        timeout: 20000
      }
    }
  },
  preview: {
    host: 'localhost',
    port: 4173,             // 기본 프리뷰 포트
    strictPort: true
  }
});
