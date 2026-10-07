import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() { try { await migrate(drizzle(pool), { migrationsFolder: "./drizzle" }); console.info("Migrations aplicadas."); } finally { await pool.end(); } }
main().catch(() => { console.error("Não foi possível aplicar migrations. Confira a conexão e o estado do banco."); process.exitCode = 1; });
