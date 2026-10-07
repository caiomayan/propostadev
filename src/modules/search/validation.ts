import { z } from "zod";
import { decimalCents, moneySchema, priceTypes } from "../offers/validation";
const optionalNumber = (min: number, max: number) => z.preprocess((v) => v === "" || v === undefined ? undefined : v, z.coerce.number().int().min(min).max(max).optional());
const optionalMoney = z.preprocess((v) => v === "" || v === undefined ? undefined : v, moneySchema.optional());
export const searchSchema = z.object({
  q: z.string().trim().max(120).default(""), categoria: z.string().max(120).optional(), tipo: z.string().max(120).optional(),
  pessoa: z.enum(["PESSOA_FISICA", "PESSOA_JURIDICA"]).optional(), experiencia_min: optionalNumber(0, 80), nota_min: optionalNumber(1, 5),
  modelo_preco: z.enum(priceTypes).optional(), preco_min: optionalMoney, preco_max: optionalMoney, prazo_ate: optionalNumber(1, 3650),
  ordenar: z.enum(["nome", "nota", "experiencia", "preco"]).default("nome"), pagina: optionalNumber(1, 1000).default(1),
}).superRefine((v, ctx) => {
  if ((v.preco_min || v.preco_max || v.ordenar === "preco") && (!v.modelo_preco || v.modelo_preco === "SOB_CONSULTA")) ctx.addIssue({ code: "custom", path: ["modelo_preco"], message: "Selecione um modelo de preço numérico para filtrar ou ordenar por preço." });
  if (v.preco_min && v.preco_max && /^\d{1,8}(?:\.\d{1,2})?$/.test(v.preco_min) && /^\d{1,8}(?:\.\d{1,2})?$/.test(v.preco_max) && decimalCents(v.preco_max) < decimalCents(v.preco_min)) ctx.addIssue({ code: "custom", path: ["preco_max"], message: "O máximo deve ser maior ou igual ao mínimo." });
});
export type SearchInput = z.infer<typeof searchSchema>;
