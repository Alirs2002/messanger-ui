import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // فقط یک پروکسی جامع برای مسیرهای API نیاز داریم
      "/messenger/api": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        ws: true,
        // هیچ rewrite ای اینجا لازم نیست، مسیر عیناً به بک‌اند می‌رود
      },
      // در بخش proxy فایل vite.config.ts این را اضافه کنید:
      //"/fa/messenger": {
      //target: "https://www.mresalat.ir", // یا api.mresalat.ir بسته به اینکه در لایو به کدام دامین می‌خورد
      //changeOrigin: true,
      //secure: false,
      //},
    },
  },
});
