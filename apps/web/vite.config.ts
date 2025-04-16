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
      "0010-2405-201-682b-39a8-50d8-eea6-c674-2ec3.ngrok-free.app",
    ],
  },
});
