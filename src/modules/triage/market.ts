import "server-only";
import { unstable_cache } from "next/cache";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, serviceTypes } from "@/lib/db/schema";
import { numerosDoMercado, precoReferencia, precosAnunciados, type ReferencePrice } from "./queries";

export type MarketService = { slug: string; name: string; category: string; reference: ReferencePrice; prices: number[] };

/** Preço de referência de todo o catálogo para a home. Cinco minutos de cache: a home abre muito mais do que o mercado muda. */
export const getMarket = unstable_cache(async (): Promise<{ services: MarketService[]; prestadores: number; ofertas: number }> => {
  const [catalog, prices, numbers] = await Promise.all([
    db.select({ id: serviceTypes.id, slug: serviceTypes.slug, name: serviceTypes.name, category: categories.name }).from(serviceTypes).innerJoin(categories, eq(serviceTypes.categoryId, categories.id))
      .where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(asc(categories.name), asc(serviceTypes.name)),
    precosAnunciados(),
    numerosDoMercado(),
  ]);
  const services = await Promise.all(catalog.map(async (item) => ({ slug: item.slug, name: item.name, category: item.category, reference: await precoReferencia(item.id), prices: prices.get(item.slug) ?? [] })));
  return { services, prestadores: numbers.prestadores, ofertas: numbers.ofertas };
}, ["mercado-home"], { revalidate: 300 });
