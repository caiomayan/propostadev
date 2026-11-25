import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type ExternalPrice = { sourceName: string; sourceUrl: string; min: string; max: string; excerpt: string | null; collectedAt: Date };

/** Última linha válida (OK) de cada fonte do Tipo de serviço. Uma coleta que falhou não apaga nem substitui o valor anterior. */
export async function latestExternalPrices(serviceTypeId: string): Promise<ExternalPrice[]> {
  const { rows } = await db.execute<{ name: string; url: string; min: string; max: string; excerpt: string | null; collected_at: Date }>(sql`
    SELECT DISTINCT ON (fonte_url) fonte_nome AS name, fonte_url AS url, valor_min::text AS min, valor_max::text AS max, trecho AS excerpt, coletado_em AS collected_at
    FROM preco_mercado_externo WHERE tipo_servico_id = ${serviceTypeId} AND status = 'OK'
    ORDER BY fonte_url, coletado_em DESC`);
  return rows.map((row) => ({ sourceName: row.name, sourceUrl: row.url, min: row.min, max: row.max, excerpt: row.excerpt, collectedAt: new Date(row.collected_at) }))
    .sort((a, b) => a.sourceName.localeCompare(b.sourceName, "pt-BR") || a.sourceUrl.localeCompare(b.sourceUrl));
}
