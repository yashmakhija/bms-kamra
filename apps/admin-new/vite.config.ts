import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    allowedHosts: [
      "6b38-2405-201-682b-39a8-f4b5-d2a7-2396-8b22.ngrok-free.app",
      "cc54f89cc30847f98e81c7c2c9193d10.serveo.net",
    ],
  },
});
