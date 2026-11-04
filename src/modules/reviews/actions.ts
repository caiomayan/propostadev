"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { providers, reviews } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { accountTypeDenial } from "@/lib/auth/account-type";
import { needsEmailConfirmation } from "@/lib/auth/email-gate";
import { mutationAllowed, mutationError } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { reviewSchema } from "./validation";
import { canCreateReview } from "./queries";
import { REVIEW_NOT_ELIGIBLE } from "./rules";

function triggerRefusal(error: unknown) {
  const cause = error instanceof Error && "cause" in error ? error.cause : error;
  return cause && typeof cause === "object" && "code" in cause && cause.code === "23514" && "message" in cause && typeof cause.message === "string" && cause.message.startsWith("Só quem contratou") ? REVIEW_NOT_ELIGIBLE : null;
}

/**
 * Cria ou edita a Avaliação do usuário da sessão. Quem já tem Avaliação (inclusive as do MVP 1) só a atualiza, sem
 * exigir Aceite. Criar exige conta CLIENTE com Proposta ACEITA do Prestador em Projeto próprio; o trigger do banco repete a regra.
 */
export async function saveReview(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para avaliar um prestador." };
  if (!session.user.accountType) return { error: accountTypeDenial(session, "CLIENTE") ?? "Escolha o tipo da sua conta antes de continuar." };
  if (needsEmailConfirmation(session.user)) return { error: "Confirme seu e-mail para continuar." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Confira a nota e o comentário.", fields: parsed.error.flatten().fieldErrors };
  const userId = session.user.id;
  const [provider] = await db.select().from(providers).where(and(eq(providers.id, parsed.data.providerId), eq(providers.active, true))).limit(1);
  if (!provider) return { error: "Prestador indisponível." };
  if (provider.userId === userId) return { error: "Você não pode avaliar seu próprio perfil." };
  const [own] = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.providerId, provider.id))).limit(1);
  if (!own) {
    const denied = accountTypeDenial(session, "CLIENTE");
    if (denied) return { error: denied };
    if (!await canCreateReview(userId, provider.id)) return { error: REVIEW_NOT_ELIGIBLE };
  }
  if (!await mutationAllowed(userId, "review")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    if (own) await db.update(reviews).set({ rating: parsed.data.rating, comment: parsed.data.comment }).where(and(eq(reviews.id, own.id), eq(reviews.userId, userId)));
    else await db.insert(reviews).values({ providerId: provider.id, rating: parsed.data.rating, comment: parsed.data.comment, userId });
    revalidatePath("/", "layout");
    return { success: "Avaliação salva." };
  } catch (error) { return { error: triggerRefusal(error) ?? mutationError(error) }; }
}
export async function deleteReview(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para excluir sua avaliação." };
  if (needsEmailConfirmation(session.user)) return { error: "Confirme seu e-mail para continuar." };
  const id = z.string().uuid().safeParse(form.get("providerId"));
  if (!id.success) return { error: "Prestador inválido." };
  if (!await mutationAllowed(session.user.id, "review")) return { error: "Muitas alterações. Aguarde um minuto." };
  try { await db.delete(reviews).where(and(eq(reviews.userId, session.user.id), eq(reviews.providerId, id.data))); }
  catch (error) { return { error: mutationError(error) }; }
  revalidatePath("/", "layout");
  return { success: "Sua avaliação foi excluída." };
}
