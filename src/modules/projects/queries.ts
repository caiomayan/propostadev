import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, serviceTypes } from "@/lib/db/schema";

const columns = {
  id: projects.id, title: projects.title, description: projects.description, status: projects.status, createdAt: projects.createdAt,
  budgetType: projects.budgetType, budgetMin: projects.budgetMin, budgetMax: projects.budgetMax, desiredDays: projects.desiredDays,
  proposalCount: sql<number>`(SELECT count(*)::int FROM proposta WHERE proposta.projeto_id = ${projects.id} AND proposta.status IN ('ENVIADA', 'PRE_SELECIONADA'))`,
  serviceTypeId: projects.serviceTypeId, serviceName: serviceTypes.name, serviceSlug: serviceTypes.slug,
};
export type ClientProject = Awaited<ReturnType<typeof listClientProjects>>[number];

/** Projetos do Cliente da sessão, do mais recente ao mais antigo. */
export async function listClientProjects(clientId: string) {
  return db.select(columns).from(projects).innerJoin(serviceTypes, eq(serviceTypes.id, projects.serviceTypeId))
    .where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt), desc(projects.id));
}

/** Um Projeto do Cliente; outro Cliente (ou id malformado) recebe null. */
export async function getClientProject(clientId: string, id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const [row] = await db.select(columns).from(projects).innerJoin(serviceTypes, eq(serviceTypes.id, projects.serviceTypeId))
    .where(and(eq(projects.id, id), eq(projects.clientId, clientId))).limit(1);
  return row ?? null;
}

export type ProjectProposal = { id: string; providerSlug: string; providerName: string; amount: string; days: number; message: string; status: string; createdAt: Date };
/** Propostas recebidas, para o dono do Projeto (somente leitura por ora; a triagem é do ticket 06). Sem contatos do Prestador. */
export async function listProjectProposals(clientId: string, projectId: string): Promise<ProjectProposal[]> {
  if (!z.string().uuid().safeParse(projectId).success) return [];
  const result = await db.execute<ProjectProposal>(sql`
    SELECT pr.id, pf.slug AS "providerSlug", pf.nome_exibicao AS "providerName", pr.valor::text AS amount, pr.prazo_dias AS days, pr.mensagem AS message, pr.status, pr.created_at AS "createdAt"
    FROM proposta pr JOIN projeto p ON p.id = pr.projeto_id JOIN perfil_prestador pf ON pf.id = pr.prestador_id
    WHERE p.id = ${projectId}::uuid AND p.cliente_id = ${clientId} AND pr.status <> 'RETIRADA' ORDER BY pr.created_at, pr.id`);
  return result.rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
}
/** Ids dos Prestadores já convidados para o Projeto do Cliente. */
export async function listInvitedProviderIds(clientId: string, projectId: string): Promise<string[]> {
  if (!z.string().uuid().safeParse(projectId).success) return [];
  const result = await db.execute<{ id: string }>(sql`SELECT c.prestador_id AS id FROM convite c JOIN projeto p ON p.id = c.projeto_id WHERE p.id = ${projectId}::uuid AND p.cliente_id = ${clientId}`);
  return result.rows.map((row) => row.id);
}
