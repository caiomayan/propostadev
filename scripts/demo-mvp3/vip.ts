// Dados de demonstração do MVP 3 para este ticket. Idempotente e só aditivo: pode rodar de novo sem duplicar nem apagar.
import { inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { providers } from "../../src/lib/db/schema";
import { demoSlug } from "../demo-identidades";

// Prestadores demo 2, 3 (Landing Page), 5 (Site institucional) e 8 (API). O prestador1 fica fora para demonstrar o Interesse no VIP.
const vipSlugs = [demoSlug(2), demoSlug(3), demoSlug(5), demoSlug(8)];

export async function seedDemoVip(): Promise<void> {
  await db.update(providers).set({ vip: true }).where(inArray(providers.slug, vipSlugs));
}
