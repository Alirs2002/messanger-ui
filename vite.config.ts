// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/messenger/api": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: "https://api.mresalat.ir",
          Referer: "https://api.mresalat.ir/",
        },
      },
      "/messenger/websocket": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        ws: true,
        secure: false,
        headers: {
          Origin: "https://api.mresalat.ir",
        },
      },
    },
  },
});
