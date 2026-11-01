import { defineConfig } from "@playwright/test";
import "dotenv/config";
if (!process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_TEST === process.env.DATABASE_URL) throw new Error("E2E exige DATABASE_URL_TEST dedicado.");
const port = Number(process.env.E2E_PORT ?? 3100);
const origin = `http://localhost:${port}`;
const testEnv = { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST, BETTER_AUTH_URL: origin, DEMO_MODE: "true" };
export default defineConfig({ testDir: "./tests/e2e", fullyParallel: false, workers: 1, timeout: 60000, expect: { timeout: 10000 }, retries: 0, reporter: [["list"], ["html", { open: "never" }]], globalSetup: "./tests/e2e/global-setup.ts", use: { baseURL: origin, actionTimeout: 15000, trace: "retain-on-failure", screenshot: "only-on-failure" }, webServer: { command: `node node_modules/next/dist/bin/next start --port ${port}`, url: `${origin}/entrar`, env: testEnv, reuseExistingServer: false, timeout: 60000 } });

