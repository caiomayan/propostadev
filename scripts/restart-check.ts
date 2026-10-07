import "dotenv/config";
import { request } from "@playwright/test";
import { Pool } from "pg";
import { mkdir, readFile, writeFile } from "node:fs/promises";

async function main() {
  const database = process.env.DATABASE_URL_TEST;
  if (!database || database === process.env.DATABASE_URL || !new URL(database).pathname.endsWith("_test")) throw new Error("Verificação exige banco de teste dedicado.");
  await mkdir("artifacts/restart", { recursive: true });
  const mode = process.argv[2];
  if (mode !== "before" && mode !== "after") throw new Error("Use before ou after.");
  const pool = new Pool({ connectionString: database });
  const client = await request.newContext({ baseURL: "http://localhost:3100", ...(mode === "after" ? { storageState: "artifacts/restart/session.json" } : {}) });
  try {
    if (mode === "before") {
      const response = await client.post("/api/auth/sign-in/email", { headers: { origin: "http://localhost:3100" }, data: { email: "prestador1@demo.example", password: process.env.DEMO_PASSWORD ?? "Demo-local-2026!" } });
      if (!response.ok()) throw new Error("Não foi possível abrir a sessão de teste.");
      await client.storageState({ path: "artifacts/restart/session.json" });
    }
    const response = await client.get("/api/auth/get-session");
    const session = await response.json();
    if (session?.user?.email !== "prestador1@demo.example") throw new Error("A sessão não persistiu.");
    const result = await pool.query<{ users: number; profiles: number; offers: number; reviews: number }>('SELECT (SELECT count(*)::int FROM "user") AS users, (SELECT count(*)::int FROM perfil_prestador) AS profiles, (SELECT count(*)::int FROM oferta_servico) AS offers, (SELECT count(*)::int FROM avaliacao) AS reviews');
    const counts = result.rows[0];
    if (mode === "before") await writeFile("artifacts/restart/counts.json", JSON.stringify(counts));
    else if (JSON.stringify(counts) !== await readFile("artifacts/restart/counts.json", "utf8")) throw new Error("As contagens mudaram após reiniciar.");
    console.info(mode === "before" ? "Sessão e contagens de teste registradas antes do restart." : "Sessão e dados preservados após reiniciar aplicativo e PostgreSQL.");
  } finally { await client.dispose(); await pool.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha no restart."); process.exitCode = 1; });
