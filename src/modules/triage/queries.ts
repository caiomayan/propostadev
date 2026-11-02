import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, serviceTypes, triageGoals, triageGoalServices } from "@/lib/db/schema";
import { getPriceAverage } from "@/modules/catalog/queries";
import { reputationSubquery } from "@/modules/reviews/queries";
import type { Budget } from "./validation";
import type { Range } from "./position";

export const MIN_SAMPLE = 3;
export const COMPATIBLE_LIMIT = 12;

const activeOffer = sql`o.ativo AND p.ativo AND t.ativo AND c.ativo AND o.deleted_at IS NULL`;
const fromActive = sql`FROM oferta_servico o JOIN perfil_prestador p ON p.id = o.prestador_id
  JOIN tipo_servico t ON t.id = o.tipo_servico_id JOIN categoria c ON c.id = t.categoria_id`;

export type ServiceTypeSummary = { id: string; slug: string; name: string; description: string | null; category: string };

export async function findServiceType(slug: string): Promise<ServiceTypeSummary | null> {
  if (!slug) return null;
  const [row] = await db.select({ id: serviceTypes.id, slug: serviceTypes.slug, name: serviceTypes.name, description: serviceTypes.description, category: categories.name })
    .from(serviceTypes).innerJoin(categories, eq(categories.id, serviceTypes.categoryId))
    .where(and(eq(serviceTypes.slug, slug), eq(serviceTypes.active, true), eq(categories.active, true))).limit(1);
  return row ?? null;
}

export type Goal = { slug: string; label: string; hint: string | null; services: { slug: string; name: string; description: string | null }[] };
/** Objetivos em linguagem simples, na ordem do seed, com os Tipos de serviço ativos que cada um sugere. */
export async function getGoals(): Promise<Goal[]> {
  const rows = await db.select({ goal: triageGoals.slug, label: triageGoals.label, hint: triageGoals.hint, goalPosition: triageGoals.position, slug: serviceTypes.slug, name: serviceTypes.name, description: serviceTypes.description, position: triageGoalServices.position })
    .from(triageGoals).leftJoin(triageGoalServices, eq(triageGoalServices.goalId, triageGoals.id))
    .leftJoin(serviceTypes, and(eq(serviceTypes.id, triageGoalServices.serviceTypeId), eq(serviceTypes.active, true)))
    .orderBy(asc(triageGoals.position), asc(triageGoalServices.position));
  const goals = new Map<string, Goal>();
  for (const row of rows) {
    const goal = goals.get(row.goal) ?? { slug: row.goal, label: row.label, hint: row.hint, services: [] };
    if (row.slug && row.name) goal.services.push({ slug: row.slug, name: row.name, description: row.description });
    goals.set(row.goal, goal);
  }
  return [...goals.values()].filter((goal) => goal.services.length > 0);
}

export type ReferencePrice = {
  /** Média dos preços FIXO (regra S07: ≥ 3 prestadores distintos); null se insuficiente. Duas casas. */
  mediaFixos: string | null;
  fixosN: number;
  /** Faixa de preços anunciados por projeto; null com n < 3. */
  faixa: Range | null;
  /** Prestadores distintos com preço por projeto (FIXO, A_PARTIR_DE, INTERVALO). */
  n: number;
  suficiente: boolean;
};

/**
 * Preço de referência de um Tipo de serviço. Faixa: FIXO e A_PARTIR_DE pelo mínimo, INTERVALO pelos dois
 * extremos; POR_HORA e SOB_CONSULTA ficam fora. Com n < 3 prestadores, "dados insuficientes".
 */
export async function precoReferencia(tipoServicoId: string): Promise<ReferencePrice> {
  const [type] = await db.select({ slug: serviceTypes.slug }).from(serviceTypes).where(eq(serviceTypes.id, tipoServicoId)).limit(1);
  if (!type) return { mediaFixos: null, fixosN: 0, faixa: null, n: 0, suficiente: false };
  const [average, range] = await Promise.all([
    getPriceAverage(type.slug),
    db.execute<{ min: string | null; max: string | null; n: number }>(sql`
      SELECT min(o.preco_minimo)::text AS min,
             max(CASE WHEN o.tipo_preco = 'INTERVALO' THEN o.preco_maximo ELSE o.preco_minimo END)::text AS max,
             count(DISTINCT p.id)::int AS n
      ${fromActive}
      WHERE ${activeOffer} AND o.tipo_servico_id = ${tipoServicoId}::uuid AND o.tipo_preco IN ('FIXO', 'A_PARTIR_DE', 'INTERVALO')`),
  ]);
  const row = range.rows[0];
  const n = row?.n ?? 0;
  const suficiente = n >= MIN_SAMPLE;
  return {
    mediaFixos: average.average === null ? null : Number(average.average).toFixed(2),
    fixosN: average.count,
    faixa: suficiente && row.min !== null && row.max !== null ? { min: row.min, max: row.max } : null,
    n,
    suficiente,
  };
}

export type CompatibleProvider = {
  providerId: string; slug: string; displayName: string; type: "PESSOA_FISICA" | "PESSOA_JURIDICA"; yearsExperience: number;
  city: string | null; state: string | null; country: string; photoUrl: string | null;
  offerTitle: string; priceType: "FIXO" | "A_PARTIR_DE" | "INTERVALO" | "POR_HORA" | "SOB_CONSULTA"; priceMin: string | null; priceMax: string | null;
  deadlineType: "FIXO" | "INTERVALO" | "A_PARTIR_DE" | "A_COMBINAR"; deadlineMinDays: number | null; deadlineMaxDays: number | null;
  /** true/false; null = desconhecido (sem teto, SOB_CONSULTA ou POR_HORA). */
  cabeOrcamento: boolean | null;
  /** true/false; null = desconhecido (prazo flexível ou oferta A_COMBINAR). */
  cabePrazo: boolean | null;
  rating: string | null; reviewCount: number; verificadas: number;
};

const tri = (column: string) => sql.raw(`CASE WHEN "${column}" IS TRUE THEN 2 WHEN "${column}" IS NULL THEN 1 ELSE 0 END`);

/**
 * Prestadores compatíveis: perfis ativos com Oferta ativa no Tipo de serviço, com os motivos explícitos.
 * Ordem: cabeOrcamento, cabePrazo (verdadeiro, depois desconhecido, depois falso), verificadas desc, nota desc, nome, id. Até 12.
 */
export async function prestadoresCompativeis(input: { tipoServicoId: string; orcamento: Budget; prazoDias: number | null }): Promise<CompatibleProvider[]> {
  const ceiling = input.orcamento.tipo === "NAO_SEI" ? null : input.orcamento.max;
  const result = await db.execute<CompatibleProvider>(sql`
    WITH candidates AS (
      SELECT p.id AS "providerId", p.slug, p.nome_exibicao AS "displayName", p.tipo AS type, p.anos_experiencia AS "yearsExperience",
        p.cidade AS city, p.uf AS state, p.pais AS country, p.foto_url AS "photoUrl",
        o.titulo AS "offerTitle", o.tipo_preco AS "priceType", o.preco_minimo::text AS "priceMin", o.preco_maximo::text AS "priceMax",
        o.tipo_prazo AS "deadlineType", o.prazo_minimo_dias AS "deadlineMinDays", o.prazo_maximo_dias AS "deadlineMaxDays",
        CASE WHEN ${ceiling}::numeric IS NULL OR o.tipo_preco IN ('SOB_CONSULTA', 'POR_HORA') OR o.preco_minimo IS NULL THEN NULL ELSE o.preco_minimo <= ${ceiling}::numeric END AS "cabeOrcamento",
        CASE WHEN ${input.prazoDias}::int IS NULL OR o.prazo_minimo_dias IS NULL THEN NULL ELSE o.prazo_minimo_dias <= ${input.prazoDias}::int END AS "cabePrazo",
        r.rating, coalesce(r.count, 0)::int AS "reviewCount", coalesce(r.verified, 0)::int AS verificadas
      ${fromActive}
      LEFT JOIN ${reputationSubquery} r ON r.prestador_id = p.id
      WHERE ${activeOffer} AND o.tipo_servico_id = ${input.tipoServicoId}::uuid
    )
    SELECT * FROM candidates
    ORDER BY ${tri("cabeOrcamento")} DESC, ${tri("cabePrazo")} DESC, verificadas DESC, rating::numeric DESC NULLS LAST, "displayName", "providerId"
    LIMIT ${COMPATIBLE_LIMIT}`);
  return result.rows;
}
