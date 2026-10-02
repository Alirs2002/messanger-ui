import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/messenger": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        secure: false,
        ws: true,
        headers: {
          host: "api.mresalat.ir",
          origin: "https://api.mresalat.ir",
        },
      },
    },
  },
});
