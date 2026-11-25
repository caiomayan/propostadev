"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { isPlataformaUser } from "@/lib/auth/plataforma-emails";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";

const input = z.object({ providerId: z.string().uuid() });

// O id do Prestador vem do formulário; quem pode agir vem só da sessão (Equipe da plataforma, e-mail confirmado).
// Mexe só em `vip`: o selo é derivado (ADR 0004) e o Interesse no VIP continua registrado.
async function setVip(formData: FormData, vip: boolean): Promise<ActionState> {
  const session = await getSession();
  if (!isPlataformaUser(session?.user)) return { error: "Ação não permitida." };
  const parsed = input.safeParse({ providerId: formData.get("providerId") });
  if (!parsed.success) return { error: "Prestador inválido." };
  if (!await mutationAllowed(session!.user.id, "plataforma-vip")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const [changed] = await db.update(providers).set({ vip }).where(eq(providers.id, parsed.data.providerId)).returning({ slug: providers.slug });
    if (!changed) return { error: "Prestador não encontrado." };
    revalidatePath(`/prestadores/${changed.slug}`);
  } catch { return { error: "Não foi possível salvar. Tente novamente em alguns instantes." }; }
  revalidatePath("/plataforma");
  revalidatePath("/buscar");
  return { success: vip ? "VIP concedido." : "VIP retirado." };
}

export async function grantVip(_state: ActionState, formData: FormData): Promise<ActionState> { return setVip(formData, true); }
export async function revokeVip(_state: ActionState, formData: FormData): Promise<ActionState> { return setVip(formData, false); }
