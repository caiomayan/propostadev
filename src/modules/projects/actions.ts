"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { accountTypeDenial } from "@/lib/auth/account-type";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { parseDraft } from "@/modules/triage/validation";
import { findServiceType } from "@/modules/triage/queries";
import { MAX_INVITES } from "@/modules/proposals/validation";

// A autorização vem sempre da sessão: o formulário nunca informa o Cliente.
export async function publishProject(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  const denied = accountTypeDenial(session, "CLIENTE");
  if (!session || denied) return { error: denied === "Entre para continuar." ? "Entre como Cliente para publicar o projeto." : denied ?? "Entre para publicar o projeto." };
  const parsed = parseDraft(form);
  if (!parsed.ok) return { error: "Confira os dados do projeto na Triagem.", fields: Object.fromEntries(Object.entries(parsed.errors).map(([key, message]) => [key, [message]])) };
  const serviceType = await findServiceType(parsed.draft.tipo);
  if (!serviceType) return { error: "Selecione um tipo de serviço disponível." };
  if (!await mutationAllowed(session.user.id, "project")) return { error: "Muitas alterações. Aguarde um minuto." };
  const { draft } = parsed;
  let createdId: string;
  try {
    const [created] = await db.insert(projects).values({
      clientId: session.user.id, serviceTypeId: serviceType.id, title: draft.titulo, description: draft.descricao,
      budgetType: draft.orcamento.tipo, budgetMin: draft.orcamento.min, budgetMax: draft.orcamento.max, desiredDays: draft.prazoDias, status: "ABERTO",
    }).returning({ id: projects.id });
    createdId = created.id;
  } catch { return { error: "Não foi possível publicar o projeto. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel", "layout");
  redirect(`/painel/projetos/${createdId}?publicado=1`);
}

// Só o dono cancela, e só um Projeto ABERTO: um único UPDATE condicional decide.
export async function cancelProject(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  const denied = accountTypeDenial(session, "CLIENTE");
  if (!session || denied) return { error: denied ?? "Entre para cancelar o projeto." };
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Projeto inválido." };
  if (!await mutationAllowed(session.user.id, "project")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const changed = await db.update(projects).set({ status: "CANCELADO", updatedAt: new Date() })
      .where(and(eq(projects.id, id.data), eq(projects.clientId, session.user.id), eq(projects.status, "ABERTO"))).returning({ id: projects.id });
    if (!changed.length) return { error: "Projeto não encontrado, já encerrado ou sem permissão." };
  } catch { return { error: "Não foi possível cancelar o projeto. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel", "layout");
  return { success: "Projeto cancelado." };
}

// Convite: só o dono de um Projeto ABERTO, só para Prestador compatível (perfil ativo + Oferta ativa no tipo), no máximo 10 por Projeto.
export async function inviteProvider(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  const denied = accountTypeDenial(session, "CLIENTE");
  if (!session || denied) return { error: denied ?? "Entre para convidar prestadores." };
  const projectId = z.string().uuid().safeParse(form.get("projetoId"));
  const providerId = z.string().uuid().safeParse(form.get("prestadorId"));
  if (!projectId.success || !providerId.success) return { error: "Convite inválido." };
  if (!await mutationAllowed(session.user.id, "invite")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const outcome = await db.transaction(async (tx) => {
      // O bloqueio da linha do Projeto serializa convites concorrentes e torna o limite de 10 confiável.
      const locked = await tx.execute<{ service_type_id: string }>(sql`SELECT tipo_servico_id AS service_type_id FROM projeto WHERE id = ${projectId.data}::uuid AND cliente_id = ${session.user.id} AND status = 'ABERTO' FOR UPDATE`);
      if (!locked.rows.length) return "projeto" as const;
      const compatible = await tx.execute(sql`SELECT 1 FROM perfil_prestador p JOIN oferta_servico o ON o.prestador_id = p.id JOIN tipo_servico t ON t.id = o.tipo_servico_id JOIN categoria c ON c.id = t.categoria_id
        WHERE p.id = ${providerId.data}::uuid AND p.ativo AND o.tipo_servico_id = ${locked.rows[0].service_type_id}::uuid AND o.ativo AND o.deleted_at IS NULL AND t.ativo AND c.ativo LIMIT 1`);
      if (!compatible.rows.length) return "incompativel" as const;
      const count = await tx.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM convite WHERE projeto_id = ${projectId.data}::uuid`);
      const already = await tx.execute(sql`SELECT 1 FROM convite WHERE projeto_id = ${projectId.data}::uuid AND prestador_id = ${providerId.data}::uuid`);
      if (already.rows.length) return "ja" as const;
      if (count.rows[0].n >= MAX_INVITES) return "limite" as const;
      await tx.execute(sql`INSERT INTO convite (projeto_id, prestador_id) VALUES (${projectId.data}::uuid, ${providerId.data}::uuid)`);
      return "ok" as const;
    });
    if (outcome === "projeto") return { error: "Projeto não encontrado, não está aberto ou você não tem permissão." };
    if (outcome === "incompativel") return { error: "Só é possível convidar prestadores compatíveis com este projeto." };
    if (outcome === "ja") return { error: "Este prestador já foi convidado." };
    if (outcome === "limite") return { error: `Você já convidou ${MAX_INVITES} prestadores, o limite deste projeto.` };
  } catch { return { error: "Não foi possível enviar o convite. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel", "layout");
  return { success: "Convite enviado." };
}
