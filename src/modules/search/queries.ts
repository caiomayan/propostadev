import "server-only";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, reviews } from "@/lib/db/schema";
import type { Offer } from "@/lib/db/schema";
import type { SearchInput } from "./validation";

export type PublicOffer = Pick<Offer, "id" | "title" | "description" | "priceType" | "priceMin" | "priceMax" | "deadlineType" | "deadlineMinDays" | "deadlineMaxDays"> & {
  providerId: string; slug: string; displayName: string; type: "PESSOA_FISICA" | "PESSOA_JURIDICA"; yearsExperience: number;
  city: string | null; state: string | null; country: string; photoUrl: string | null;
  serviceName: string; serviceSlug: string; rating: string | null; reviewCount: number;
};

const projection = sql`o.id, o.titulo AS title, o.descricao AS description,
  o.tipo_preco AS "priceType", o.preco_minimo AS "priceMin", o.preco_maximo AS "priceMax",
  o.tipo_prazo AS "deadlineType", o.prazo_minimo_dias AS "deadlineMinDays", o.prazo_maximo_dias AS "deadlineMaxDays",
  p.id AS "providerId", p.slug, p.nome_exibicao AS "displayName", p.tipo AS type, p.anos_experiencia AS "yearsExperience",
  p.cidade AS city, p.uf AS state, p.pais AS country, p.foto_url AS "photoUrl", t.nome AS "serviceName", t.slug AS "serviceSlug",
  r.rating, coalesce(r.count, 0)::int AS "reviewCount"`;
const fromPublic = sql`FROM oferta_servico o JOIN perfil_prestador p ON p.id = o.prestador_id
  JOIN tipo_servico t ON t.id = o.tipo_servico_id JOIN categoria c ON c.id = t.categoria_id
  LEFT JOIN (SELECT prestador_id, avg(nota)::text AS rating, count(*)::int AS count FROM avaliacao GROUP BY prestador_id) r ON r.prestador_id = p.id`;
const active = sql`o.ativo AND p.ativo AND t.ativo AND c.ativo AND o.deleted_at IS NULL`;

function searchConditions(input: SearchInput) {
  const conditions: SQL[] = [active];
  if (input.q) {
    const escaped = `%${input.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(sql`unaccent(concat_ws(' ', p.nome_exibicao, o.titulo, o.descricao, t.nome, c.nome)) ILIKE unaccent(${escaped}) ESCAPE '\\'`);
  }
  if (input.categoria) conditions.push(sql`c.slug = ${input.categoria}`);
  if (input.tipo) conditions.push(sql`t.slug = ${input.tipo}`);
  if (input.pessoa) conditions.push(sql`p.tipo = ${input.pessoa}`);
  if (input.experiencia_min !== undefined) conditions.push(sql`p.anos_experiencia >= ${input.experiencia_min}`);
  if (input.nota_min !== undefined) conditions.push(sql`r.rating::numeric >= ${input.nota_min}`);
  if (input.modelo_preco) conditions.push(sql`o.tipo_preco = ${input.modelo_preco}`);
  if (input.preco_min) conditions.push(input.modelo_preco === "INTERVALO" ? sql`o.preco_maximo >= ${input.preco_min}::numeric` : sql`o.preco_minimo >= ${input.preco_min}::numeric`);
  if (input.preco_max) conditions.push(sql`o.preco_minimo <= ${input.preco_max}::numeric`);
  if (input.prazo_ate !== undefined) conditions.push(sql`((o.tipo_prazo = 'FIXO' AND o.prazo_minimo_dias <= ${input.prazo_ate}) OR (o.tipo_prazo = 'INTERVALO' AND o.prazo_maximo_dias <= ${input.prazo_ate}))`);
  return sql.join(conditions, sql` AND `);
}

export async function searchProviders(input: SearchInput) {
  const eligible = sql`SELECT ${projection}, row_number() OVER (PARTITION BY p.id ORDER BY o.titulo, o.id) AS choice ${fromPublic} WHERE ${searchConditions(input)}`;
  const order = input.ordenar === "nota" ? sql`rating::numeric DESC NULLS LAST, "reviewCount" DESC, "displayName", "providerId"`
    : input.ordenar === "experiencia" ? sql`"yearsExperience" DESC, "displayName", "providerId"`
    : input.ordenar === "preco" ? sql`"priceMin" ASC, "displayName", "providerId"` : sql`"displayName", "providerId"`;
  const [rows, count] = await Promise.all([
    db.execute<PublicOffer>(sql`WITH eligible AS (${eligible}) SELECT * FROM eligible WHERE choice = 1 ORDER BY ${order} LIMIT 12 OFFSET ${(input.pagina - 1) * 12}`),
    db.execute<{ count: number }>(sql`WITH eligible AS (${eligible}) SELECT count(*)::int AS count FROM eligible WHERE choice = 1`),
  ]);
  return { results: rows.rows, total: count.rows[0]?.count ?? 0 };
}

export async function getComparison(ids: string[]) {
  const validIds = [...new Set(ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))].slice(0, 3);
  if (!validIds.length) return { offers: [] as PublicOffer[], removed: ids.length > 0 };
  const rows = await db.execute<PublicOffer>(sql`SELECT ${projection} ${fromPublic} WHERE ${active} AND o.id IN (${sql.join(validIds.map((id) => sql`${id}::uuid`), sql`, `)})`);
  const selected: PublicOffer[] = [];
  for (const id of validIds) {
    const offer = rows.rows.find((row) => row.id === id);
    if (offer && !selected.some((item) => item.providerId === offer.providerId)) selected.push(offer);
  }
  return { offers: selected, removed: selected.length !== ids.length };
}

export async function getPublicProvider(slug: string) {
  const [provider] = await db.select({ id: providers.id, slug: providers.slug, type: providers.type, displayName: providers.displayName, description: providers.description, yearsExperience: providers.yearsExperience, city: providers.city, state: providers.state, country: providers.country, photoUrl: providers.photoUrl, contactEmail: providers.contactEmail, phone: providers.phone, whatsapp: providers.whatsapp, siteUrl: providers.siteUrl, githubUrl: providers.githubUrl, linkedinUrl: providers.linkedinUrl }).from(providers).where(and(eq(providers.slug, slug), eq(providers.active, true))).limit(1);
  if (!provider) return null;
  const [offerRows, stats] = await Promise.all([
    db.execute<PublicOffer>(sql`SELECT ${projection} ${fromPublic} WHERE ${active} AND p.id = ${provider.id}::uuid ORDER BY o.titulo, o.id`),
    db.execute<{ rating: string | null; count: number }>(sql`SELECT avg(nota)::text AS rating, count(*)::int AS count FROM avaliacao WHERE prestador_id = ${provider.id}::uuid`),
  ]);
  return { ...provider, offers: offerRows.rows, rating: stats.rows[0]?.rating ?? null, reviewCount: stats.rows[0]?.count ?? 0 };
}

export async function getProviderReviews(providerId: string, page: number, userId?: string) {
  const [rows, own, owner] = await Promise.all([
    db.execute<{ id: string; name: string; rating: number; comment: string | null; createdAt: Date; updatedAt: Date }>(sql`SELECT a.id, u.name, a.nota AS rating, a.comentario AS comment, a.created_at AS "createdAt", a.updated_at AS "updatedAt" FROM avaliacao a JOIN "user" u ON u.id = a.usuario_id WHERE a.prestador_id = ${providerId}::uuid ORDER BY a.created_at DESC, a.id DESC LIMIT 10 OFFSET ${(page - 1) * 10}`),
    userId ? db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment }).from(reviews).where(and(eq(reviews.providerId, providerId), eq(reviews.userId, userId))).limit(1) : Promise.resolve([]),
    userId ? db.select({ id: providers.id }).from(providers).where(and(eq(providers.id, providerId), eq(providers.userId, userId))).limit(1) : Promise.resolve([]),
  ]);
  return { reviews: rows.rows, own: own[0] ?? null, isOwner: owner.length > 0 };
}
