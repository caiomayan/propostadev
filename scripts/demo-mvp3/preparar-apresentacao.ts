// Volta a demo do MVP 3 ao estado de apresentação depois de um ensaio. Só toca contas @demo.example:
// apaga os Interesses no VIP delas (o botão "Tenho interesse" volta a aparecer) e reaplica os dados do MVP 3 (aditivos).
// Nunca grava preços externos fictícios. Uso: DATABASE_URL=<banco> pnpm demo:apresentacao
import { sql } from "drizzle-orm";
import { db, pool } from "../../src/lib/db";
import { seedDemoMvp3 } from ".";

async function main() {
  const removed = await db.execute(sql`
    DELETE FROM interesse_vip i USING perfil_prestador p, "user" u
    WHERE p.id = i.prestador_id AND u.id = p.usuario_id AND u.email LIKE '%@demo.example'`);
  console.info(`Interesses no VIP da demo removidos: ${removed.rowCount ?? 0}.`);
  await seedDemoMvp3({ includeDemoExternalPrices: false });
  console.info("Demo do MVP 3 pronta para a apresentação.");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao preparar a demo."); process.exitCode = 1; }).finally(() => pool.end());
