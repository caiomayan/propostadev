"use server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { mutationAllowed, mutationError } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";
import { providerSchema } from "./validation";

export async function saveProvider(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para editar seu perfil." };
  const parsed = providerSchema.safeParse({ ...Object.fromEntries(form), contactConsent: form.get("contactConsent") === "on" });
  if (!parsed.success) return { error: "Confira os campos do perfil.", fields: parsed.error.flatten().fieldErrors };
  if (!await mutationAllowed(session.user.id, "provider")) return { error: "Muitas alterações. Aguarde um minuto." };
  const { contactConsent: consent, ...data } = parsed.data;
  void consent;
  try {
    const [existing] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
    if (existing) await db.update(providers).set({ ...data, contactsPublishedAt: new Date() }).where(eq(providers.userId, session.user.id));
    else {
      const slug = data.displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "prestador";
      await db.insert(providers).values({ ...data, userId: session.user.id, slug: `${slug}-${randomUUID().slice(0, 8)}`, contactsPublishedAt: new Date(), active: true });
    }
    revalidatePath("/", "layout");
    return { success: "Perfil salvo. Seus contatos autorizados estão disponíveis no perfil público enquanto ele estiver ativo." };
  } catch (error) { return { error: mutationError(error) }; }
}
export async function setProviderActive(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para alterar o perfil." };
  if (form.get("active") !== "true" && form.get("active") !== "false") return { error: "Estado inválido." };
  if (!await mutationAllowed(session.user.id, "provider")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const changed = await db.update(providers).set({ active: form.get("active") === "true" }).where(eq(providers.userId, session.user.id)).returning({ id: providers.id });
    if (!changed.length) return { error: "Crie seu perfil antes de alterar a visibilidade." };
  } catch (error) { return { error: mutationError(error) }; }
  revalidatePath("/", "layout");
  return { success: "Visibilidade atualizada." };
}
