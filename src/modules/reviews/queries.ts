import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Avaliação verificada = o autor tem Proposta ACEITA daquele Prestador em Projeto próprio.
 * É derivada (sem coluna) e usa EXISTS, nunca JOIN: dois Aceites do mesmo Cliente não duplicam a linha.
 */
export const reviewIsVerified = (alias = "a") => sql.raw(`EXISTS (SELECT 1 FROM proposta pr JOIN projeto pj ON pj.id = pr.projeto_id WHERE pr.prestador_id = ${alias}.prestador_id AND pr.status = 'ACEITA' AND pj.cliente_id = ${alias}.usuario_id)`);

/** Agregados por Prestador (prestador_id, rating, count, verified) para `LEFT JOIN ... r ON r.prestador_id = ...`. */
export const reputationSubquery = sql`(SELECT a.prestador_id, avg(a.nota)::text AS rating, count(*)::int AS count, (count(*) FILTER (WHERE ${reviewIsVerified("a")}))::int AS verified FROM avaliacao a GROUP BY a.prestador_id)`;

/** O usuário já pode criar a Avaliação deste Prestador? (Proposta ACEITA do Prestador em Projeto do usuário.) */
export async function canCreateReview(userId: string, providerId: string): Promise<boolean> {
  const result = await db.execute<{ ok: boolean }>(sql`SELECT EXISTS (SELECT 1 FROM proposta pr JOIN projeto pj ON pj.id = pr.projeto_id WHERE pr.prestador_id = ${providerId}::uuid AND pr.status = 'ACEITA' AND pj.cliente_id = ${userId}) AS ok`);
  return result.rows[0]?.ok === true;
}

export type OwnReview = { id: string; rating: number; comment: string | null; verified: boolean };
/** Avaliação do usuário a um Prestador (qualquer: nova ou do MVP 1), com a flag derivada. */
export async function getOwnReview(userId: string, providerId: string): Promise<OwnReview | null> {
  const result = await db.execute<OwnReview>(sql`SELECT a.id, a.nota AS rating, a.comentario AS comment, ${reviewIsVerified("a")} AS verified FROM avaliacao a WHERE a.usuario_id = ${userId} AND a.prestador_id = ${providerId}::uuid LIMIT 1`);
  return result.rows[0] ?? null;
}
