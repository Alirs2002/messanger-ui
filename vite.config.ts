// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/messenger/api': {
        target: 'https://api.mresalat.ir',
        changeOrigin: true,
      },
      '/messenger/websocket': {
        target: 'https://api.mresalat.ir',
        changeOrigin: true,
        ws: true,
        secure: false,
        headers: {
          Origin: 'https://api.mresalat.ir', // این هدر جلوی 403 را در لایه Handshake می‌گیرد
        },
      },
    },
  },
});
