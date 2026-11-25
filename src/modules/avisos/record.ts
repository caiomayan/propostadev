import { sql } from "drizzle-orm";
import type { db } from "@/lib/db";
import type { AvisoType } from "./links";

// Gravação dentro da transação da ação que gera o Aviso: a pessoa certa sai do banco (nunca do formulário).
type Executor = Pick<typeof db, "execute">;

/** Aviso para o dono da conta do Prestador (perfil_prestador.id). */
export async function avisarPrestador(tx: Executor, type: AvisoType, projectId: string, providerId: string): Promise<void> {
  await tx.execute(sql`INSERT INTO aviso (usuario_id, tipo, projeto_id) SELECT usuario_id, ${type}::aviso_tipo, ${projectId}::uuid FROM perfil_prestador WHERE id = ${providerId}::uuid`);
}

/** Aviso para o Cliente dono do Projeto. */
export async function avisarClienteDoProjeto(tx: Executor, type: AvisoType, projectId: string): Promise<void> {
  await tx.execute(sql`INSERT INTO aviso (usuario_id, tipo, projeto_id) SELECT cliente_id, ${type}::aviso_tipo, id FROM projeto WHERE id = ${projectId}::uuid`);
}
