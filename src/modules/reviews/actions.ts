"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { providers, reviews } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { mutationAllowed, mutationError } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { reviewSchema } from "./validation";
export async function saveReview(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para avaliar um prestador." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Confira a nota e o comentário.", fields: parsed.error.flatten().fieldErrors };
  const [provider] = await db.select().from(providers).where(and(eq(providers.id, parsed.data.providerId), eq(providers.active, true))).limit(1);
  if (!provider) return { error: "Prestador indisponível." };
  if (provider.userId === session.user.id) return { error: "Você não pode avaliar seu próprio perfil." };
  if (!await mutationAllowed(session.user.id, "review")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    await db.insert(reviews).values({ ...parsed.data, userId: session.user.id }).onConflictDoUpdate({ target: [reviews.userId, reviews.providerId], set: { rating: parsed.data.rating, comment: parsed.data.comment } });
    revalidatePath("/", "layout");
    return { success: "Avaliação salva." };
  } catch (error) { return { error: mutationError(error) }; }
}
export async function deleteReview(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para excluir sua avaliação." };
  const id = z.string().uuid().safeParse(form.get("providerId"));
  if (!id.success) return { error: "Prestador inválido." };
  if (!await mutationAllowed(session.user.id, "review")) return { error: "Muitas alterações. Aguarde um minuto." };
  try { await db.delete(reviews).where(and(eq(reviews.userId, session.user.id), eq(reviews.providerId, id.data))); }
  catch (error) { return { error: mutationError(error) }; }
  revalidatePath("/", "layout");
  return { success: "Sua avaliação foi excluída." };
}
