import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(process.cwd(), "shared"),
      "@": path.resolve(process.cwd(), "client", "src"),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", "dist-test/**"],
  },
});
