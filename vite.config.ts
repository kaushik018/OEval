import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Only load Replit plugins in development and when running in Replit
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          // Dynamically import Replit plugins only when needed
          ...(await Promise.all([
            import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
            import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
          ]).catch(() => [])), // Ignore errors if plugins are not available
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
