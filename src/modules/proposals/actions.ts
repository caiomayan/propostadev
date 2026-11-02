"use server";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { accountTypeDenial } from "@/lib/auth/account-type";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { parseProposal, uuidSchema } from "./validation";

// Todas as ações do Prestador partem da sessão: o perfil vem do usuário logado, nunca do formulário.
async function providerContext() {
  const session = await getSession();
  const denied = accountTypeDenial(session, "PRESTADOR");
  if (!session || denied) return { error: denied === "Entre para continuar." ? "Entre como Prestador para enviar propostas." : denied ?? "Entre para continuar." };
  const result = await db.execute<{ id: string; active: boolean }>(sql`SELECT id, ativo AS active FROM perfil_prestador WHERE usuario_id = ${session.user.id} LIMIT 1`);
  const provider = result.rows[0];
  if (!provider) return { error: "Crie seu perfil antes de enviar propostas." };
  if (!provider.active) return { error: "Reative seu perfil antes de enviar propostas." };
  if (!await mutationAllowed(session.user.id, "proposal")) return { error: "Muitas alterações. Aguarde um minuto." };
  return { providerId: provider.id };
}

/** Uma Proposta por Projeto: só para Projeto ABERTO em que o Prestador tem Oferta ativa no Tipo de serviço. */
export async function submitProposal(_: ActionState, form: FormData): Promise<ActionState> {
  const context = await providerContext();
  if ("error" in context) return { error: context.error };
  const projectId = uuidSchema.safeParse(form.get("projetoId"));
  if (!projectId.success) return { error: "Projeto inválido." };
  const parsed = parseProposal(form);
  if (!parsed.ok) return { error: "Confira os campos da proposta.", fields: parsed.fields };
  const { valor, prazo, mensagem } = parsed.data;
  let created: { id: string }[];
  try {
    // Um único INSERT ... SELECT decide se o Projeto está aberto e se há Oferta ativa no tipo.
    created = (await db.execute<{ id: string }>(sql`
      INSERT INTO proposta (projeto_id, prestador_id, valor, prazo_dias, mensagem)
      SELECT p.id, ${context.providerId}::uuid, ${valor}::numeric, ${prazo}::int, ${mensagem}
      FROM projeto p
      WHERE p.id = ${projectId.data}::uuid AND p.status = 'ABERTO'
        AND EXISTS (SELECT 1 FROM oferta_servico o JOIN tipo_servico t ON t.id = o.tipo_servico_id
          WHERE o.prestador_id = ${context.providerId}::uuid AND o.tipo_servico_id = p.tipo_servico_id AND o.ativo AND o.deleted_at IS NULL AND t.ativo)
      RETURNING id`)).rows;
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return { error: "Você já enviou uma proposta para este projeto. Edite a proposta existente." };
    return { error: "Não foi possível enviar a proposta. Tente novamente em alguns instantes." };
  }
  if (!created.length) return { error: "Este projeto não está disponível para propostas: ele pode ter sido encerrado ou você não tem oferta ativa neste tipo de serviço." };
  revalidatePath("/painel", "layout");
  redirect(`/painel/oportunidades/${projectId.data}?enviada=1`);
}

// Editar e retirar: só o dono da Proposta, só ENVIADA ou PRE_SELECIONADA, só com o Projeto ABERTO.
const editable = sql`pr.status IN ('ENVIADA', 'PRE_SELECIONADA') AND EXISTS (SELECT 1 FROM projeto p WHERE p.id = pr.projeto_id AND p.status = 'ABERTO')`;

export async function updateProposal(_: ActionState, form: FormData): Promise<ActionState> {
  const context = await providerContext();
  if ("error" in context) return { error: context.error };
  const id = uuidSchema.safeParse(form.get("propostaId"));
  if (!id.success) return { error: "Proposta inválida." };
  const parsed = parseProposal(form);
  if (!parsed.ok) return { error: "Confira os campos da proposta.", fields: parsed.fields };
  try {
    const changed = await db.execute<{ id: string }>(sql`
      UPDATE proposta pr SET valor = ${parsed.data.valor}::numeric, prazo_dias = ${parsed.data.prazo}::int, mensagem = ${parsed.data.mensagem}, updated_at = now()
      WHERE pr.id = ${id.data}::uuid AND pr.prestador_id = ${context.providerId}::uuid AND ${editable} RETURNING pr.id`);
    if (!changed.rows.length) return { error: "Esta proposta não pode mais ser editada: ela foi retirada, recusada ou o projeto não está aberto." };
  } catch { return { error: "Não foi possível salvar a proposta. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel", "layout");
  return { success: "Proposta atualizada." };
}

export async function withdrawProposal(_: ActionState, form: FormData): Promise<ActionState> {
  const context = await providerContext();
  if ("error" in context) return { error: context.error };
  const id = uuidSchema.safeParse(form.get("propostaId"));
  if (!id.success) return { error: "Proposta inválida." };
  try {
    const changed = await db.execute<{ id: string }>(sql`
      UPDATE proposta pr SET status = 'RETIRADA', updated_at = now()
      WHERE pr.id = ${id.data}::uuid AND pr.prestador_id = ${context.providerId}::uuid AND ${editable} RETURNING pr.id`);
    if (!changed.rows.length) return { error: "Esta proposta não pode mais ser retirada: ela já foi retirada, recusada ou o projeto não está aberto." };
  } catch { return { error: "Não foi possível retirar a proposta. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel", "layout");
  return { success: "Proposta retirada." };
}
