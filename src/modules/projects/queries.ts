import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, serviceTypes } from "@/lib/db/schema";

const columns = {
  id: projects.id, title: projects.title, description: projects.description, status: projects.status, createdAt: projects.createdAt,
  budgetType: projects.budgetType, budgetMin: projects.budgetMin, budgetMax: projects.budgetMax, desiredDays: projects.desiredDays,
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
