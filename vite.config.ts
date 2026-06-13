import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      output: {
        // Only split the big, stable libraries that the landing page loads
        // anyway (they're in the eager App-shell import graph). Pulling them
        // into their own long-lived chunks improves cross-deploy caching
        // without adding bytes to the landing page.
        //
        // Everything else (Radix, recharts, date-fns, embla, cmdk, …) is left
        // to Rollup's automatic per-route splitting: those libs are only used
        // by lazily-loaded authenticated pages, so they end up in those page
        // chunks and never download on the marketing landing page. Forcing them
        // into a shared "vendor" chunk would drag them onto every page.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@clerk")) return "vendor-clerk";
          if (id.includes("@tanstack")) return "vendor-query";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("/wouter/")
          ) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
});
