import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { describeDbError } from "./db-error";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() { try { await migrate(drizzle(pool), { migrationsFolder: "./drizzle" }); console.info("Migrations aplicadas."); } finally { await pool.end(); } }
// O código do erro (ex.: 28P01 = senha recusada, ENOTFOUND = host errado) é o que diz a causa no log do build.
main().catch((error: unknown) => { console.error(`Não foi possível aplicar migrations: ${describeDbError(error)}`); process.exitCode = 1; });
