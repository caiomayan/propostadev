import { z } from "zod";
import { decimalCents } from "@/modules/offers/validation";

export const budgetKinds = ["FAIXA", "ATE", "NAO_SEI"] as const;
export type BudgetKind = (typeof budgetKinds)[number];
export type Budget = { tipo: BudgetKind; min: string | null; max: string | null };
export type Draft = { tipo: string; titulo: string; descricao: string; orcamento: Budget; prazoDias: number | null };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
// Aceita "1500", "1500,5" ou "1500.50"; devolve sempre com duas casas ("1500.50"). Sem separador de milhar.
export function normalizeMoney(value: string): string | null {
  const text = value.trim().replace(/^R\$\s*/, "").replace(",", ".");
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}
const moneyField = (label: string) => z.string().transform((value, ctx) => {
  if (!value) return null;
  const normalized = normalizeMoney(value);
  if (normalized === null) { ctx.addIssue({ code: "custom", message: `${label}: use números, com até duas casas decimais.` }); return z.NEVER; }
  if (decimalCents(normalized) <= BigInt(0)) { ctx.addIssue({ code: "custom", message: `${label} deve ser maior que zero.` }); return z.NEVER; }
  return normalized;
});

export const draftInputSchema = z.object({
  tipo: z.string().min(1, "Escolha um tipo de serviço.").max(120),
  titulo: z.string().trim().min(5, "O título precisa de pelo menos 5 caracteres.").max(120, "O título pode ter até 120 caracteres."),
  descricao: z.string().trim().min(30, "A descrição precisa de pelo menos 30 caracteres.").max(2000, "A descrição pode ter até 2.000 caracteres."),
  orcamento: z.enum(budgetKinds, "Informe como você pensa o orçamento."),
  min: moneyField("Valor mínimo"),
  max: moneyField("Valor máximo"),
  prazo: z.string(),
  flexivel: z.string(),
}).transform((value, ctx): Draft => {
  const issue = (path: string, message: string) => { ctx.addIssue({ code: "custom", path: [path], message }); };
  let budget: Budget = { tipo: value.orcamento, min: null, max: null };
  if (value.orcamento === "FAIXA") {
    if (value.min === null) issue("min", "Informe o valor mínimo da faixa.");
    if (value.max === null) issue("max", "Informe o valor máximo da faixa.");
    if (value.min !== null && value.max !== null && decimalCents(value.max) < decimalCents(value.min)) issue("max", "O máximo deve ser maior ou igual ao mínimo.");
    budget = { tipo: "FAIXA", min: value.min, max: value.max };
  } else if (value.orcamento === "ATE") {
    if (value.max === null) issue("max", "Informe o teto do orçamento.");
    budget = { tipo: "ATE", min: null, max: value.max };
  }
  let prazoDias: number | null = null;
  if (value.flexivel !== "1") {
    if (!value.prazo) issue("prazo", "Informe o prazo em dias ou marque como flexível.");
    else if (!/^\d{1,4}$/.test(value.prazo) || Number(value.prazo) < 1 || Number(value.prazo) > 3650) issue("prazo", "O prazo deve ficar entre 1 e 3.650 dias.");
    else prazoDias = Number(value.prazo);
  }
  return { tipo: value.tipo, titulo: value.titulo, descricao: value.descricao, orcamento: budget, prazoDias };
});

export type SearchParams = Record<string, string | string[] | undefined>;
export const draftKeys = ["tipo", "titulo", "descricao", "orcamento", "min", "max", "prazo", "flexivel"] as const;

/** Valores crus da query string (uma string por chave), para repopular o formulário. */
export function rawDraft(params: SearchParams) {
  return Object.fromEntries(draftKeys.map((key) => [key, one(params[key])])) as Record<(typeof draftKeys)[number], string>;
}
/** Valida o rascunho vindo da URL ou de um formulário. Nunca lança. */
export function parseDraft(params: SearchParams | FormData) {
  const source: SearchParams = params instanceof FormData ? Object.fromEntries([...params.keys()].map((key) => [key, params.getAll(key).filter((v): v is string => typeof v === "string")])) : params;
  const parsed = draftInputSchema.safeParse(rawDraft(source));
  if (parsed.success) return { ok: true as const, draft: parsed.data };
  return { ok: false as const, errors: Object.fromEntries(parsed.error.issues.reverse().map((issue) => [String(issue.path[0] ?? "tipo"), issue.message])) as Record<string, string> };
}
export function draftQuery(draft: Draft, extra: Record<string, string> = {}) {
  const query = new URLSearchParams({ tipo: draft.tipo, titulo: draft.titulo, descricao: draft.descricao, orcamento: draft.orcamento.tipo });
  if (draft.orcamento.min) query.set("min", draft.orcamento.min);
  if (draft.orcamento.max) query.set("max", draft.orcamento.max);
  if (draft.prazoDias === null) query.set("flexivel", "1"); else query.set("prazo", String(draft.prazoDias));
  for (const [key, value] of Object.entries(extra)) query.set(key, value);
  return query.toString();
}
