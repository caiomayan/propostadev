import { z } from "zod";
import { decimalCents } from "@/modules/offers/validation";
import { normalizeMoney } from "@/modules/triage/validation";

export const MAX_INVITES = 10;
export const activeProposalStatuses = ["ENVIADA", "PRE_SELECIONADA"] as const;

// Valor decimal em string (até 99.999.999,99); aceita vírgula. Nunca passa por float.
export const proposalSchema = z.object({
  valor: z.string().transform((value, ctx) => {
    const normalized = normalizeMoney(value);
    if (normalized === null) { ctx.addIssue({ code: "custom", message: "Informe o valor em reais, com até duas casas decimais." }); return z.NEVER; }
    if (decimalCents(normalized) <= BigInt(0)) { ctx.addIssue({ code: "custom", message: "O valor deve ser maior que zero." }); return z.NEVER; }
    return normalized;
  }),
  prazo: z.string().regex(/^\d{1,4}$/, "Informe o prazo em dias.").transform(Number).pipe(z.number().int().min(1, "O prazo deve ter pelo menos 1 dia.").max(3650, "O prazo pode ter até 3.650 dias.")),
  mensagem: z.string().trim().min(30, "A mensagem precisa de pelo menos 30 caracteres.").max(3000, "A mensagem pode ter até 3.000 caracteres."),
});
export type ProposalInput = z.infer<typeof proposalSchema>;

export function parseProposal(form: FormData) {
  const parsed = proposalSchema.safeParse({ valor: String(form.get("valor") ?? ""), prazo: String(form.get("prazo") ?? "").trim(), mensagem: String(form.get("mensagem") ?? "") });
  if (parsed.success) return { ok: true as const, data: parsed.data };
  return { ok: false as const, fields: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined> };
}
export const uuidSchema = z.string().uuid();
