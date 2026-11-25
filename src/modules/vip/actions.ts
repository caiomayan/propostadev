"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { providers, vipInterests } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { accountTypeDenial } from "@/lib/auth/account-type";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import type { ActionState } from "@/lib/auth/action-state";

// Registra o Interesse no VIP. Nunca escreve `vip`: só a plataforma marca VIP (ADR 0004). Idempotente: um registro por Prestador.
export async function registerVipInterest(): Promise<ActionState> {
  const session = await getSession();
  const denied = accountTypeDenial(session, "PRESTADOR");
  if (!session || denied) return { error: denied ?? "Entre para registrar interesse." };
  if (!await mutationAllowed(session.user.id, "vip-interest")) return { error: "Muitas alterações. Aguarde um minuto." };
  try {
    const [provider] = await db.select({ id: providers.id }).from(providers).where(eq(providers.userId, session.user.id)).limit(1);
    if (!provider) return { error: "Crie seu perfil antes de registrar interesse no VIP." };
    await db.insert(vipInterests).values({ providerId: provider.id }).onConflictDoNothing({ target: vipInterests.providerId });
  } catch { return { error: "Não foi possível registrar. Tente novamente em alguns instantes." }; }
  revalidatePath("/painel/vip");
  return { success: "Interesse registrado." };
}
