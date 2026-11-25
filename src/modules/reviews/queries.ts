import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Avaliação verificada = o autor tem Proposta ACEITA daquele Prestador em Projeto próprio.
 * É derivada (sem coluna) e usa EXISTS, nunca JOIN: dois Aceites do mesmo Cliente não duplicam a linha.
 */
export const reviewIsVerified = (alias = "a") => sql.raw(`EXISTS (SELECT 1 FROM proposta pr JOIN projeto pj ON pj.id = pr.projeto_id WHERE pr.prestador_id = ${alias}.prestador_id AND pr.status = 'ACEITA' AND pj.cliente_id = ${alias}.usuario_id)`);

/** Selo de confiança: valor mínimo da média das Avaliações verificadas (ADR 0004, decisão 2). */
export const TRUST_MIN_AVERAGE = "4.0";

/**
 * Agregados por Prestador (prestador_id, rating, count, verified, trusted) para `LEFT JOIN ... r ON r.prestador_id = ...`.
 * `trusted` é o Selo de confiança, derivado na mesma agregação: e-mail confirmado do dono do Perfil, ao menos uma verificada
 * e média das verificadas >= 4,0 comparada em numeric no banco. Sem linha (nenhuma Avaliação) o selo também não vale.
 */
export const reputationSubquery = sql`(SELECT g.prestador_id, g.rating, g.count, g.verified,
  (g.verified >= 1 AND g.verified_avg >= ${sql.raw(TRUST_MIN_AVERAGE)} AND coalesce((SELECT u.email_verified FROM perfil_prestador pf JOIN "user" u ON u.id = pf.usuario_id WHERE pf.id = g.prestador_id), false)) AS trusted
  FROM (SELECT a.prestador_id, avg(a.nota)::text AS rating, count(*)::int AS count,
    (count(*) FILTER (WHERE ${reviewIsVerified("a")}))::int AS verified,
    avg(a.nota) FILTER (WHERE ${reviewIsVerified("a")}) AS verified_avg
    FROM avaliacao a GROUP BY a.prestador_id) g)`;

export type TrustCriteria = { emailVerified: boolean; verifiedCount: number; verifiedAverage: string | null; averageOk: boolean; trusted: boolean };
/** Os três critérios do Selo de confiança de um Prestador, para o checklist do painel. Sem Avaliações a média é null. */
export async function getTrustCriteria(providerId: string): Promise<TrustCriteria> {
  // A média aparece truncada em 1 casa (3,96 nunca vira "4,0"); o veredito sai do numeric exato, no banco.
  const result = await db.execute<TrustCriteria>(sql`
    SELECT coalesce(u.email_verified, false) AS "emailVerified", coalesce(r.verified, 0)::int AS "verifiedCount",
      to_char(trunc(r.verified_avg, 1), 'FM9990.0') AS "verifiedAverage",
      coalesce(r.verified_avg >= ${sql.raw(TRUST_MIN_AVERAGE)}, false) AS "averageOk",
      (coalesce(u.email_verified, false) AND coalesce(r.verified, 0) >= 1 AND coalesce(r.verified_avg >= ${sql.raw(TRUST_MIN_AVERAGE)}, false)) AS trusted
    FROM perfil_prestador pf JOIN "user" u ON u.id = pf.usuario_id
    LEFT JOIN (SELECT a.prestador_id, (count(*) FILTER (WHERE ${reviewIsVerified("a")}))::int AS verified, avg(a.nota) FILTER (WHERE ${reviewIsVerified("a")}) AS verified_avg FROM avaliacao a WHERE a.prestador_id = ${providerId}::uuid GROUP BY a.prestador_id) r ON r.prestador_id = pf.id
    WHERE pf.id = ${providerId}::uuid`);
  return result.rows[0] ?? { emailVerified: false, verifiedCount: 0, verifiedAverage: null, averageOk: false, trusted: false };
}

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
