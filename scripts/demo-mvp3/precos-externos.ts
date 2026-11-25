import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { externalPrices, serviceTypes } from "../../src/lib/db/schema";

// Dados de demonstração do MVP 3 para este ticket. Idempotente e só aditivo: pode rodar de novo sem duplicar nem apagar.
// Fonte claramente fictícia; só roda em banco local (o gancho em seed-demo.ts já condiciona).
const demo: Record<string, [string, string]> = { "landing-page": ["800.00", "2000.00"], "site-institucional": ["1500.00", "6000.00"], "e-commerce": ["3000.00", "12000.00"], "sistema-web": ["8000.00", "40000.00"], "manutencao-web": ["150.00", "600.00"] };

export async function seedDemoPrecosExternos(): Promise<void> {
  const types = await db.select({ id: serviceTypes.id, slug: serviceTypes.slug }).from(serviceTypes).where(inArray(serviceTypes.slug, Object.keys(demo)));
  for (const type of types) {
    const url = `https://example.com/demonstracao/${type.slug}`;
    const [existing] = await db.select({ id: externalPrices.id }).from(externalPrices).where(and(eq(externalPrices.serviceTypeId, type.id), eq(externalPrices.sourceUrl, url))).limit(1);
    if (existing) continue;
    const [min, max] = demo[type.slug];
    await db.insert(externalPrices).values({ serviceTypeId: type.id, sourceName: "Fonte de demonstração", sourceUrl: url, minPrice: min, maxPrice: max, excerpt: "Faixa de exemplo para a demonstração; não é um preço real.", status: "OK" });
  }
}
