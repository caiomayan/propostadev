import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
export async function mutationAllowed(userId: string, scope: string) {
  const result = await db.execute<{ count: number }>(sql`INSERT INTO mutation_rate_limit (key, count, window_started_at) VALUES (${`${scope}:${userId}`}, 1, now()) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN mutation_rate_limit.window_started_at < now() - interval '1 minute' THEN 1 ELSE mutation_rate_limit.count + 1 END, window_started_at = CASE WHEN mutation_rate_limit.window_started_at < now() - interval '1 minute' THEN now() ELSE mutation_rate_limit.window_started_at END RETURNING count`);
  return result.rows[0].count <= 20;
}
export function mutationError(error: unknown) {
  const cause = error instanceof Error && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") {
    if ("constraint" in cause && cause.constraint === "oferta_ativa_por_tipo_unique") return "Já existe uma oferta ativa para esse tipo. Pause a oferta anterior ou edite o registro existente.";
    return "Esse registro já existe. Recarregue a página e edite o registro existente.";
  }
  return "Não foi possível salvar. Tente novamente em alguns instantes.";
}
