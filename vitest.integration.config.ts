import { defineConfig } from "vitest/config";
import path from "node:path";
import "dotenv/config";
if (!process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_TEST === process.env.DATABASE_URL) throw new Error("DATABASE_URL_TEST deve ser uma base dedicada, diferente de DATABASE_URL.");
process.env.DATABASE_URL_DEVELOPMENT = process.env.DATABASE_URL;
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
export default defineConfig({ resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/server-only.ts") } }, test: { include: ["tests/integration/**/*.test.ts"], environment: "node", fileParallelism: false, testTimeout: 20000 } });
