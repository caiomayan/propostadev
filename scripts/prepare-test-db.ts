import "dotenv/config";
import { Pool } from "pg";
import { spawnSync } from "node:child_process";
if (!process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_TEST === process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL_TEST para uma base dedicada.");
const url = new URL(process.env.DATABASE_URL_TEST);
const name = url.pathname.slice(1);
if (!/^[a-z0-9_]+_test$/.test(name)) throw new Error("O nome da base de teste deve terminar em _test.");
url.pathname = "/postgres";
const admin = new Pool({ connectionString: url.toString() });
try { if (!(await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [name])).rowCount) await admin.query(`CREATE DATABASE "${name}"`); } finally { await admin.end(); }
const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST } });
if (result.status !== 0) process.exit(result.status ?? 1);
