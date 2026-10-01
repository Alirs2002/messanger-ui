// codes/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // مسیرهای API REST
      "/api": {
        target: "http://www.mresalat.ir", // آدرس پایه سرور را اینجا قرار بده (مثلا http://localhost:8080)
        changeOrigin: true,
        secure: false,
      },
      // مسیر اتصال WebSocket (STOMP) - معمولاً در اسپرینگ /ws یا /stomp است
      "/ws": {
        target: "ws://www.mresalat.ir",
        ws: true, // فعال کردن پراکسی وب‌سوکت
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
