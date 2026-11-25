import { z } from "zod";
import { moneySchema } from "../offers/validation";

export const opportunitySituations = ["convidado", "sem_proposta", "enviada"] as const;
export type OpportunitySituation = (typeof opportunitySituations)[number];

export type OpportunityFilters = { q?: string; tipo?: string; orcamento_min?: string; prazo_ate?: number; situacao?: OpportunitySituation };
export type FilterKey = keyof OpportunityFilters;
export const filterLabels: Record<FilterKey, string> = { q: "Busca", tipo: "Tipo de serviço", orcamento_min: "Orçamento mínimo", prazo_ate: "Prazo até", situacao: "Situação" };

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
// Aceita "1500,50" além de "1500.50": quem digita em português usa vírgula. Milhar com ponto não é suportado (ambíguo).
const money = z.string().trim().transform((value) => value.replace(",", ".")).pipe(moneySchema);
const fields = {
  q: z.string().trim().min(1).max(120),
  tipo: z.string().trim().min(1).max(120),
  orcamento_min: money,
  prazo_ate: z.string().trim().regex(/^\d{1,4}$/).transform(Number).pipe(z.number().int().min(1).max(3650)),
  situacao: z.enum(opportunitySituations),
} as const;

/**
 * Lê os filtros da URL campo a campo: um valor inválido é ignorado (e listado em `ignored`) sem derrubar os demais.
 * Valor em branco é "sem filtro", não erro. O Prestador nunca vem daqui: a consulta usa a sessão.
 */
export function parseOpportunityFilters(raw: Record<string, unknown>): { filters: OpportunityFilters; ignored: FilterKey[] } {
  const filters: Record<string, unknown> = {};
  const ignored: FilterKey[] = [];
  for (const key of Object.keys(fields) as FilterKey[]) {
    const value = first(raw[key]);
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) continue;
    const parsed = fields[key].safeParse(value);
    if (parsed.success) filters[key] = parsed.data; else ignored.push(key);
  }
  return { filters: filters as OpportunityFilters, ignored };
}
