"use server";
import { and, eq } from "drizzle-orm";
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
