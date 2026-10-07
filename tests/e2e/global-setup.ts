import { spawnSync } from "node:child_process";
export default function globalSetup() {
  for (const file of ["scripts/prepare-test-db.ts", "scripts/seed.ts", "scripts/seed-demo.ts"]) {
    const env: NodeJS.ProcessEnv = { ...process.env, ...(file === "scripts/prepare-test-db.ts" ? {} : { DATABASE_URL: process.env.DATABASE_URL_TEST }), BETTER_AUTH_URL: "http://localhost:3100", ALLOW_DEMO_SEED: "true", NODE_ENV: "test" };
    const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", file], { stdio: "inherit", env });
    if (result.status !== 0) throw new Error(`Preparação E2E falhou: ${file}`);
  }
}
