import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          framer: ["framer-motion"],
          react:  ["react", "react-dom"],
        },
      },
    },
  },
});
