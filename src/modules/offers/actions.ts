"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, offers, providers, serviceTypes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { mutationAllowed, mutationError } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { offerSchema } from "./validation";

export async function saveOffer(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para gerenciar ofertas." };
  const id = form.get("id");
  if (id && !z.string().uuid().safeParse(id).success) return { error: "Oferta inválida." };
  const parsed = offerSchema.safeParse({ ...Object.fromEntries(form), active: form.get("active") === "on" });
  if (!parsed.success) return { error: "Confira os campos da oferta.", fields: parsed.error.flatten().fieldErrors };
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  if (!provider) return { error: "Crie seu perfil antes de cadastrar ofertas." };
  if (parsed.data.active && !provider.active) return { error: "Reative seu perfil antes de publicar uma oferta." };
  const [catalog] = await db.select({ id: serviceTypes.id }).from(serviceTypes).innerJoin(categories, eq(categories.id, serviceTypes.categoryId)).where(and(eq(serviceTypes.id, parsed.data.serviceTypeId), eq(serviceTypes.active, true), eq(categories.active, true))).limit(1);
  if (!catalog) return { error: "Selecione um tipo de serviço disponível." };
  if (!await mutationAllowed(session.user.id, "offer")) return { error: "Muitas alterações. Aguarde um minuto." };
  let createdId: string | undefined;
  try {
    if (typeof id === "string" && id) {
      const changed = await db.update(offers).set(parsed.data).where(and(eq(offers.id, id), eq(offers.providerId, provider.id), isNull(offers.deletedAt))).returning({ id: offers.id });
      if (!changed.length) return { error: "Oferta não encontrada ou sem permissão." };
    } else {
      const [created] = await db.insert(offers).values({ ...parsed.data, providerId: provider.id }).returning({ id: offers.id });
      createdId = created.id;
    }
    revalidatePath("/", "layout");
  } catch (error) { return { error: mutationError(error) }; }
  if (createdId) redirect(`/painel/ofertas/${createdId}/editar`);
  return { success: "Oferta salva." };
}
export async function deleteOffer(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para gerenciar ofertas." };
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Oferta inválida." };
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  if (!provider) return { error: "Perfil não encontrado." };
  if (!await mutationAllowed(session.user.id, "offer")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const changed = await db.update(offers).set({ active: false, deletedAt: new Date() }).where(and(eq(offers.id, id.data), eq(offers.providerId, provider.id), isNull(offers.deletedAt))).returning({ id: offers.id });
    if (!changed.length) return { error: "Oferta não encontrada ou sem permissão." };
  } catch (error) { return { error: mutationError(error) }; }
  revalidatePath("/", "layout");
  return { success: "Oferta excluída. Ela não poderá ser restaurada pela interface." };
}
