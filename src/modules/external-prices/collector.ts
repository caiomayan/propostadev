import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { externalPrices, serviceTypes } from "@/lib/db/schema";
import type { ExtractedPrice, PriceExtractor } from "./client";
import { priceSources, type PriceSource } from "./sources";

export type ValidPrice = { min: string; max: string; excerpt: string | null };
export type Validation = { ok: true; price: ValidPrice } | { ok: false; reason: string };

const toAmount = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Valores em reais citados num trecho em formato brasileiro: "2.500,00" → 2500, "15 mil" → 15000, "1,5 mil" → 1500. */
export function amountsInExcerpt(excerpt: string): number[] {
  return [...excerpt.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?(\s*mil\b)?/gi)].map((match) => {
    const value = Number(`${match[1].replaceAll(".", "")}.${match[2] ?? "0"}`);
    return match[3] ? value * 1000 : value;
  });
}

/** Descarta o que não é preço: página sem preço, valor não numérico, zero ou negativo, mínimo maior que o máximo, valor ausente do trecho. */
export function validateExtraction(raw: ExtractedPrice): Validation {
  if (raw.encontrado !== true) return { ok: false, reason: "A página não traz preço para este serviço" };
  const min = toAmount(raw.valor_min), max = toAmount(raw.valor_max);
  if (min === null || max === null) return { ok: false, reason: "Valor extraído não é numérico" };
  if (min <= 0 || max <= 0) return { ok: false, reason: "Valor extraído é zero ou negativo" };
  if (min > max) return { ok: false, reason: "Valor mínimo maior que o máximo" };
  // numeric(10,2): acima disso o banco recusaria a linha.
  if (max >= 100_000_000) return { ok: false, reason: "Valor extraído fora do limite" };
  const excerpt = typeof raw.trecho === "string" && raw.trecho.trim() ? raw.trecho.replaceAll("**", "").replace(/\s+/g, " ").trim().slice(0, 500) : null;
  // Trava contra número inventado ou mal lido (ex.: "R$ 1.000" lido como 1): os dois valores precisam estar no trecho citado.
  const cited = excerpt ? amountsInExcerpt(excerpt) : [];
  if (!cited.includes(min) || !cited.includes(max)) return { ok: false, reason: "Valores extraídos não aparecem no trecho citado" };
  return { ok: true, price: { min: min.toFixed(2), max: max.toFixed(2), excerpt } };
}

export type CollectionOutcome = { serviceSlug: string; source: string; url: string; status: "OK" | "FALHA"; error?: string };

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erro desconhecido").slice(0, 300);

/**
 * Coleta todas as fontes em paralelo. Cada fonte grava uma linha nova (OK ou FALHA) e a falha de uma não afeta as outras.
 * Linhas FALHA não trazem valores, então a exibição continua na última linha OK da fonte (ver `latestExternalPrices`).
 */
export async function collectExternalPrices(extractor: PriceExtractor, sources: readonly PriceSource[] = priceSources): Promise<CollectionOutcome[]> {
  const types = await db.select({ id: serviceTypes.id, slug: serviceTypes.slug }).from(serviceTypes).where(inArray(serviceTypes.slug, [...new Set(sources.map((source) => source.serviceSlug))]));
  const typeIds = new Map(types.map((type) => [type.slug, type.id]));
  return Promise.all(sources.map(async (source): Promise<CollectionOutcome> => {
    const base = { serviceSlug: source.serviceSlug, source: source.name, url: source.url };
    const serviceTypeId = typeIds.get(source.serviceSlug);
    if (!serviceTypeId) return { ...base, status: "FALHA", error: "Tipo de serviço não existe no catálogo" };
    let result: Validation;
    try { result = validateExtraction(await extractor.extract({ url: source.url, serviceDescription: source.serviceDescription })); }
    catch (error) { result = { ok: false, reason: errorMessage(error) }; }
    try {
      const row = { serviceTypeId, sourceName: source.name, sourceUrl: source.url };
      await db.insert(externalPrices).values(result.ok ? { ...row, minPrice: result.price.min, maxPrice: result.price.max, excerpt: result.price.excerpt, status: "OK" } : { ...row, status: "FALHA", error: result.reason });
    } catch (error) { return { ...base, status: "FALHA", error: errorMessage(error) }; }
    return result.ok ? { ...base, status: "OK" } : { ...base, status: "FALHA", error: result.reason };
  }));
}

