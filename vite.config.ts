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
        // Split the big, stable libraries that the landing page loads anyway
        // (they're in the eager App-shell import graph) into one long-lived
        // "vendor" chunk. This improves cross-deploy caching without adding
        // bytes to the landing page.
        //
        // IMPORTANT: react, @clerk and @tanstack must share a SINGLE chunk.
        // @clerk and @tanstack both depend on React, and Rollup hoists shared
        // CommonJS interop helpers across the bundle. Splitting these into
        // separate manual chunks (vendor-react / vendor-clerk / vendor-query)
        // produced a circular import *between* the chunks, and ESM cannot
        // resolve a cross-chunk cycle's init order — leaving `React` undefined
        // at module-eval time and crashing the whole app with
        // "Cannot read properties of undefined (reading 'useState')" (blank
        // screen). Keeping them together avoids any cross-chunk cycle.
        //
        // Everything else (Radix, recharts, date-fns, embla, cmdk, …) is left
        // to Rollup's automatic per-route splitting: those libs are only used
        // by lazily-loaded authenticated pages, so they end up in those page
        // chunks and never download on the marketing landing page. Forcing them
        // into the shared "vendor" chunk would drag them onto every page.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("@clerk") ||
            id.includes("@tanstack") ||
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("/wouter/")
          ) {
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
