import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, serviceTypes } from "@/lib/db/schema";

export async function getCatalog() {
  const [categoryRows, types] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.active, true)).orderBy(asc(categories.name)),
    db.select({ id: serviceTypes.id, name: serviceTypes.name, slug: serviceTypes.slug, categoryId: serviceTypes.categoryId, description: serviceTypes.description }).from(serviceTypes).innerJoin(categories, eq(categories.id, serviceTypes.categoryId)).where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(asc(serviceTypes.name)),
  ]);
  return { categories: categoryRows, types };
}

export async function getPriceAverage(typeSlug: string) {
  const result = await db.execute<{ average: string | null; count: number }>(sql`
    SELECT avg(o.preco_minimo)::text AS average, count(DISTINCT p.id)::int AS count
    FROM oferta_servico o JOIN perfil_prestador p ON p.id = o.prestador_id
    JOIN tipo_servico t ON t.id = o.tipo_servico_id JOIN categoria c ON c.id = t.categoria_id
    WHERE o.ativo AND p.ativo AND t.ativo AND c.ativo AND o.deleted_at IS NULL
      AND o.tipo_preco = 'FIXO' AND t.slug = ${typeSlug}
  `);
  const row = result.rows[0];
  return { average: row?.count >= 3 ? row.average : null, count: row?.count ?? 0 };
}
