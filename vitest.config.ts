import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**"],
      exclude: [
        "src/types/**",
        "src/app/**",
        "src/components/**",
        "src/hooks/**",
        "src/lib/db/**",
        "src/lib/mock-data.ts",
        "src/lib/team-persistence.ts",
        "src/lib/config.ts",
        "src/middleware.ts",
        "src/modules/**/*.model.ts",
        "src/modules/auth/auth.options.ts",
        "src/modules/auth/auth.controller.ts",
      ],
    },
  },
});
