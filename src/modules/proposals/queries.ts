import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { uuidSchema } from "./validation";

export type OpportunityBudget = { tipo: "FAIXA" | "ATE" | "NAO_SEI"; min: string | null; max: string | null };
export type Opportunity = {
  id: string; title: string; description: string; serviceTypeId: string; serviceName: string;
  budget: OpportunityBudget; desiredDays: number | null; createdAt: Date; status: "ABERTO" | "ENCERRADO" | "CANCELADO";
  /** Só o primeiro nome. O e-mail e o nome completo do Cliente nunca saem daqui. */
  clientFirstName: string;
  invited: boolean;
  proposal: { id: string; amount: string; days: number; message: string; status: "ENVIADA" | "PRE_SELECIONADA" | "RECUSADA" | "ACEITA" | "RETIRADA"; updatedAt: Date } | null;
  /** Projeto aberto em que o Prestador tem Oferta ativa no tipo: pode propor. */
  eligible: boolean;
};

export type ProviderStanding = { state: "sem-perfil" } | { state: "inativo"; providerId: string } | { state: "sem-oferta"; providerId: string } | { state: "ok"; providerId: string };

/** Situação do Prestador logado para ver Oportunidades: perfil, ativo e com Oferta ativa. */
export async function getProviderStanding(userId: string): Promise<ProviderStanding> {
  const result = await db.execute<{ id: string; active: boolean; offers: number }>(sql`
    SELECT p.id, p.ativo AS active, count(o.id)::int AS offers
    FROM perfil_prestador p
    LEFT JOIN oferta_servico o ON o.prestador_id = p.id AND o.ativo AND o.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM tipo_servico t JOIN categoria c ON c.id = t.categoria_id WHERE t.id = o.tipo_servico_id AND t.ativo AND c.ativo)
    WHERE p.usuario_id = ${userId} GROUP BY p.id`);
  const row = result.rows[0];
  if (!row) return { state: "sem-perfil" };
  if (!row.active) return { state: "inativo", providerId: row.id };
  return row.offers > 0 ? { state: "ok", providerId: row.id } : { state: "sem-oferta", providerId: row.id };
}

type Row = {
  id: string; title: string; description: string; serviceTypeId: string; serviceName: string; budgetType: OpportunityBudget["tipo"]; budgetMin: string | null; budgetMax: string | null;
  desiredDays: number | null; createdAt: Date; status: Opportunity["status"]; clientFirstName: string; invited: boolean; eligible: boolean;
  proposalId: string | null; proposalAmount: string | null; proposalDays: number | null; proposalMessage: string | null; proposalStatus: NonNullable<Opportunity["proposal"]>["status"] | null; proposalUpdatedAt: Date | null;
};
const toOpportunity = (row: Row): Opportunity => ({
  id: row.id, title: row.title, description: row.description, serviceTypeId: row.serviceTypeId, serviceName: row.serviceName,
  budget: { tipo: row.budgetType, min: row.budgetMin, max: row.budgetMax }, desiredDays: row.desiredDays, createdAt: new Date(row.createdAt), status: row.status,
  clientFirstName: row.clientFirstName, invited: row.invited, eligible: row.eligible,
  proposal: row.proposalId && row.proposalAmount && row.proposalDays !== null && row.proposalMessage && row.proposalStatus && row.proposalUpdatedAt
    ? { id: row.proposalId, amount: row.proposalAmount, days: row.proposalDays, message: row.proposalMessage, status: row.proposalStatus, updatedAt: new Date(row.proposalUpdatedAt) } : null,
});

// O Prestador (perfil ativo) vê Projetos ABERTOS dos tipos em que tem Oferta ativa. A coluna u.name é reduzida
// ao primeiro nome no SQL; nenhuma outra coluna de "user" é selecionada.
const select = (providerId: string) => sql`
  SELECT p.id, p.titulo AS title, p.descricao AS description, p.tipo_servico_id AS "serviceTypeId", t.nome AS "serviceName",
    p.orcamento_tipo AS "budgetType", p.orcamento_min::text AS "budgetMin", p.orcamento_max::text AS "budgetMax", p.prazo_desejado_dias AS "desiredDays",
    p.created_at AS "createdAt", p.status, split_part(btrim(u.name), ' ', 1) AS "clientFirstName",
    EXISTS (SELECT 1 FROM convite c WHERE c.projeto_id = p.id AND c.prestador_id = ${providerId}::uuid) AS invited,
    (p.status = 'ABERTO' AND EXISTS (SELECT 1 FROM oferta_servico o WHERE o.prestador_id = ${providerId}::uuid AND o.tipo_servico_id = p.tipo_servico_id AND o.ativo AND o.deleted_at IS NULL)) AS eligible,
    pr.id AS "proposalId", pr.valor::text AS "proposalAmount", pr.prazo_dias AS "proposalDays", pr.mensagem AS "proposalMessage", pr.status AS "proposalStatus", pr.updated_at AS "proposalUpdatedAt"
  FROM projeto p JOIN tipo_servico t ON t.id = p.tipo_servico_id JOIN "user" u ON u.id = p.cliente_id
  LEFT JOIN proposta pr ON pr.projeto_id = p.id AND pr.prestador_id = ${providerId}::uuid`;

export async function listOpportunities(userId: string): Promise<{ standing: ProviderStanding; items: Opportunity[] }> {
  const standing = await getProviderStanding(userId);
  if (standing.state !== "ok") return { standing, items: [] };
  const result = await db.execute<Row>(sql`${select(standing.providerId)}
    WHERE p.status = 'ABERTO' AND EXISTS (SELECT 1 FROM oferta_servico o WHERE o.prestador_id = ${standing.providerId}::uuid AND o.tipo_servico_id = p.tipo_servico_id AND o.ativo AND o.deleted_at IS NULL)
    ORDER BY invited DESC, p.created_at DESC, p.id`);
  return { standing, items: result.rows.map(toOpportunity) };
}

/** Uma Oportunidade: aberta e do tipo do Prestador, ou um Projeto em que ele já enviou Proposta (somente leitura). */
export async function getOpportunity(userId: string, projectId: string): Promise<{ standing: ProviderStanding; item: Opportunity | null }> {
  const standing = await getProviderStanding(userId);
  if (standing.state === "sem-perfil" || !uuidSchema.safeParse(projectId).success) return { standing, item: null };
  const result = await db.execute<Row>(sql`${select(standing.providerId)} WHERE p.id = ${projectId}::uuid`);
  const item = result.rows[0] ? toOpportunity(result.rows[0]) : null;
  if (!item) return { standing, item: null };
  const visible = item.proposal !== null || (standing.state === "ok" && item.eligible);
  return { standing, item: visible ? item : null };
}

export type MyProposal = { id: string; projectId: string; projectTitle: string; projectStatus: Opportunity["status"]; serviceName: string; amount: string; days: number; status: NonNullable<Opportunity["proposal"]>["status"]; createdAt: Date; updatedAt: Date };
export async function listMyProposals(userId: string): Promise<MyProposal[]> {
  const result = await db.execute<MyProposal>(sql`
    SELECT pr.id, p.id AS "projectId", p.titulo AS "projectTitle", p.status AS "projectStatus", t.nome AS "serviceName", pr.valor::text AS amount, pr.prazo_dias AS days,
      pr.status, pr.created_at AS "createdAt", pr.updated_at AS "updatedAt"
    FROM proposta pr JOIN perfil_prestador pf ON pf.id = pr.prestador_id JOIN projeto p ON p.id = pr.projeto_id JOIN tipo_servico t ON t.id = p.tipo_servico_id
    WHERE pf.usuario_id = ${userId} ORDER BY pr.updated_at DESC, pr.id`);
  return result.rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) }));
}
