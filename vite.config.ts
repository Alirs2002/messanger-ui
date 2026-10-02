import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/conversations": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/messages": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/users": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/groups": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/auth": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/files": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        rewrite: (path) => `/messenger/api${path}`,
      },
      "/messenger": {
        target: "https://api.mresalat.ir",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
