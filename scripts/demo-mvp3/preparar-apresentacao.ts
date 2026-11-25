// Volta a demo do MVP 3 ao estado de apresentação depois de um ensaio. Só toca contas @demo.example:
// apaga os Interesses no VIP delas (o botão "Tenho interesse" volta a aparecer), volta o VIP delas ao conjunto do seed
// (quem ganhou VIP pelo painel da plataforma ensaiando deixa de ser VIP) e reaplica os dados do MVP 3 (aditivos).
// Nunca grava preços externos fictícios. Uso: DATABASE_URL=<banco> pnpm demo:apresentacao
import { sql } from "drizzle-orm";
import { db, pool } from "../../src/lib/db";
import { seedDemoMvp3 } from ".";

async function main() {
  const removed = await db.execute(sql`
    DELETE FROM interesse_vip i USING perfil_prestador p, "user" u
    WHERE p.id = i.prestador_id AND u.id = p.usuario_id AND u.email LIKE '%@demo.example'`);
  console.info(`Interesses no VIP da demo removidos: ${removed.rowCount ?? 0}.`);
  const reset = await db.execute(sql`
    UPDATE perfil_prestador p SET vip = false FROM "user" u
    WHERE u.id = p.usuario_id AND u.email LIKE '%@demo.example' AND p.vip`);
  console.info(`VIP da demo retirado antes de reaplicar o conjunto do seed: ${reset.rowCount ?? 0}.`);
  const unread = await db.execute(sql`
    UPDATE aviso a SET lido_em = NULL FROM "user" u
    WHERE u.id = a.usuario_id AND u.email LIKE '%@demo.example' AND a.lido_em IS NOT NULL
      AND a.tipo IN ('CONVITE_RECEBIDO', 'PROPOSTA_RECEBIDA', 'PROPOSTA_PRE_SELECIONADA')`);
  console.info(`Avisos da demo de volta a não lidos: ${unread.rowCount ?? 0}.`);
  await seedDemoMvp3({ includeDemoExternalPrices: false });
  console.info("Demo do MVP 3 pronta para a apresentação.");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao preparar a demo."); process.exitCode = 1; }).finally(() => pool.end());
