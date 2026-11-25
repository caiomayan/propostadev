import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { reputationSubquery, reviewIsVerified } from "../../src/modules/reviews/queries";

// Dados de demonstração do MVP 3 para o Selo de confiança. Idempotente e só aditivo: pode rodar de novo sem duplicar nem apagar.
// O selo é derivado (ADR 0004, decisão 2): este módulo não grava selo nenhum. O seed base já cria Avaliações verificadas e
// Prestadores sem nenhuma (ou só com Avaliação anterior), então a demo mostra os dois lados. Aqui só garantimos o critério do
// e-mail confirmado nos Prestadores demo que já têm contratação verificada, para que o selo não dependa do estado da conta.
export async function seedDemoSelo(): Promise<void> {
  await db.execute(sql`
    UPDATE "user" u SET email_verified = true
    FROM perfil_prestador p
    WHERE p.usuario_id = u.id AND p.slug LIKE 'prestador-demo-%' AND u.email LIKE '%@demo.example' AND NOT u.email_verified
      AND EXISTS (SELECT 1 FROM avaliacao a WHERE a.prestador_id = p.id AND ${reviewIsVerified("a")})`);
  const result = await db.execute<{ com: number; sem: number }>(sql`
    SELECT count(*) FILTER (WHERE r.trusted)::int AS com, count(*) FILTER (WHERE NOT coalesce(r.trusted, false))::int AS sem
    FROM perfil_prestador p LEFT JOIN ${reputationSubquery} r ON r.prestador_id = p.id
    WHERE p.slug LIKE 'prestador-demo-%'`);
  const row = result.rows[0];
  console.info(`Selo de confiança na demo: ${row?.com ?? 0} Prestadores com selo e ${row?.sem ?? 0} sem.`);
}
