import { z } from "zod";

export const priceTypes = ["FIXO", "A_PARTIR_DE", "INTERVALO", "POR_HORA", "SOB_CONSULTA"] as const;
export const deadlineTypes = ["FIXO", "INTERVALO", "A_PARTIR_DE", "A_COMBINAR"] as const;
export function decimalCents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}
export const moneySchema = z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Informe valor decimal com até duas casas.").pipe(z.string().refine((v) => decimalCents(v) > BigInt(0), "O preço deve ser positivo."));
const money = z.preprocess((v) => v === "" || v === undefined ? null : v, moneySchema.nullable());
const days = z.preprocess((v) => v === "" || v === undefined ? null : v, z.coerce.number().int().min(1).max(3650).nullable());
export const offerSchema = z.object({
  serviceTypeId: z.string().uuid(), title: z.string().trim().min(5).max(120), description: z.string().trim().min(30).max(5000),
  priceType: z.enum(priceTypes), priceMin: money, priceMax: money, deadlineType: z.enum(deadlineTypes), deadlineMinDays: days, deadlineMaxDays: days, active: z.boolean().default(false),
}).superRefine((v, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (v.priceType === "SOB_CONSULTA") {
    if (v.priceMin !== null || v.priceMax !== null) issue("priceMin", "Sob consulta não aceita valores.");
  } else {
    if (v.priceMin === null) issue("priceMin", "Informe o preço mínimo.");
    if (v.priceType === "INTERVALO") {
      if (v.priceMax === null) issue("priceMax", "Informe o preço máximo.");
      else if (v.priceMin !== null && /^\d{1,8}(?:\.\d{1,2})?$/.test(v.priceMin) && /^\d{1,8}(?:\.\d{1,2})?$/.test(v.priceMax) && decimalCents(v.priceMax) < decimalCents(v.priceMin)) issue("priceMax", "O máximo deve ser maior ou igual ao mínimo.");
    } else if (v.priceMax !== null) issue("priceMax", "Este modelo não aceita valor máximo.");
  }
  if (v.deadlineType === "A_COMBINAR") {
    if (v.deadlineMinDays !== null || v.deadlineMaxDays !== null) issue("deadlineMinDays", "A combinar não aceita quantidade de dias.");
  } else {
    if (v.deadlineMinDays === null) issue("deadlineMinDays", "Informe o prazo mínimo.");
    if (v.deadlineType === "INTERVALO") {
      if (v.deadlineMaxDays === null) issue("deadlineMaxDays", "Informe o prazo máximo.");
      else if (v.deadlineMinDays !== null && v.deadlineMaxDays < v.deadlineMinDays) issue("deadlineMaxDays", "O máximo deve ser maior ou igual ao mínimo.");
    } else if (v.deadlineMaxDays !== null) issue("deadlineMaxDays", "Este modelo não aceita prazo máximo.");
  }
});
export type OfferInput = z.infer<typeof offerSchema>;
