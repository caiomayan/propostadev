import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, vipInterests } from "@/lib/db/schema";

const columns = { providerId: providers.id, slug: providers.slug, name: providers.displayName, city: providers.city, state: providers.state, active: providers.active };

/** "Pediram o VIP": Interesse no VIP de quem ainda não é VIP, do pedido mais antigo para o mais novo. */
export function listVipRequests() {
  return db.select({ ...columns, requestedAt: vipInterests.createdAt }).from(vipInterests)
    .innerJoin(providers, eq(providers.id, vipInterests.providerId))
    .where(eq(providers.vip, false)).orderBy(asc(vipInterests.createdAt), asc(providers.displayName));
}

/** "VIP agora": Prestadores VIP, com a data do Interesse quando houve. */
export function listVipProviders() {
  return db.select({ ...columns, requestedAt: vipInterests.createdAt }).from(providers)
    .leftJoin(vipInterests, eq(vipInterests.providerId, providers.id))
    .where(eq(providers.vip, true)).orderBy(asc(providers.displayName));
}
