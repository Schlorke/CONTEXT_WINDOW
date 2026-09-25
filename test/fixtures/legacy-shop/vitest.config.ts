import { defineConfig } from "vitest/config";

export default defineConfig({ esbuild: { jsx: "automatic" }, test: { include: ["characterization/**/*.test.tsx"] } });
