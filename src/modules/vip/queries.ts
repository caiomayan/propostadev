import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, vipInterests } from "@/lib/db/schema";

/** Situação do Prestador logado na página do VIP: perfil, se já é VIP e quando registrou Interesse no VIP. */
export async function getVipStatus(userId: string) {
  const [row] = await db.select({ providerId: providers.id, vip: providers.vip, interestAt: vipInterests.createdAt })
    .from(providers).leftJoin(vipInterests, eq(vipInterests.providerId, providers.id)).where(eq(providers.userId, userId)).limit(1);
  return row ?? null;
}
