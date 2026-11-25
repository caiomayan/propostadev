import { sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { avisoHref, type AvisoType } from "./links";

export const AVISOS_LIMIT = 50;

/** Uma consulta só (índice parcial por usuário); só roda para quem está logado. */
export const countUnread = cache(async (userId: string): Promise<number> => {
  const result = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM aviso WHERE usuario_id = ${userId} AND lido_em IS NULL`);
  return result.rows[0]?.n ?? 0;
});

export type AvisoItem = { id: string; type: AvisoType; projectId: string | null; projectTitle: string | null; read: boolean; createdAt: Date };

/** Os 50 mais recentes do usuário, com o título do Projeto numa só consulta. */
export async function listAvisos(userId: string): Promise<AvisoItem[]> {
  const result = await db.execute<{ id: string; type: AvisoType; projectId: string | null; projectTitle: string | null; readAt: string | null; createdAt: string }>(sql`
    SELECT a.id, a.tipo AS type, p.id AS "projectId", p.titulo AS "projectTitle", a.lido_em AS "readAt", a.created_at AS "createdAt"
    FROM aviso a LEFT JOIN projeto p ON p.id = a.projeto_id
    WHERE a.usuario_id = ${userId} ORDER BY a.created_at DESC, a.id LIMIT ${AVISOS_LIMIT}`);
  return result.rows.map((row) => ({ id: row.id, type: row.type, projectId: row.projectId, projectTitle: row.projectTitle, read: row.readAt !== null, createdAt: new Date(row.createdAt) }));
}

/** Marca como lido (só se for do usuário) e devolve o destino. Aviso inexistente ou de outra pessoa não muda nada e leva à lista. */
export async function openAviso(userId: string, avisoId: string): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(avisoId)) return "/painel/avisos";
  const result = await db.execute<{ type: AvisoType; projectId: string | null }>(sql`
    UPDATE aviso SET lido_em = COALESCE(lido_em, now()) WHERE id = ${avisoId}::uuid AND usuario_id = ${userId} RETURNING tipo AS type, projeto_id AS "projectId"`);
  const row = result.rows[0];
  return row ? avisoHref(row.type, row.projectId) : "/painel/avisos";
}

/** Marca todos os Avisos do usuário como lidos. */
export async function markAllRead(userId: string): Promise<void> {
  await db.execute(sql`UPDATE aviso SET lido_em = now() WHERE usuario_id = ${userId} AND lido_em IS NULL`);
}
