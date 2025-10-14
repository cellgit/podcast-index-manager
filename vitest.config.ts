import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  test: {
    environment: "node",
    globals: true,
    setupFiles: [resolve(rootDir, "tests/setup-env.ts")],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: resolve(rootDir, "coverage"),
  include: ["src/**/*.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
});
