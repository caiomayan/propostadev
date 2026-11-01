import { money } from "@/lib/format";

type BudgetLike = { tipo: "FAIXA" | "ATE" | "NAO_SEI"; min: string | null; max: string | null };

export function budgetLabel(budget: BudgetLike) {
  if (budget.tipo === "FAIXA") return `${money(budget.min)} a ${money(budget.max)}`;
  if (budget.tipo === "ATE") return `Até ${money(budget.max)}`;
  return "Ainda não sei";
}
export function desiredDeadlineLabel(days: number | null) {
  return days === null ? "Flexível" : `${days} ${days === 1 ? "dia" : "dias"}`;
}
export const projectStatusLabels = { ABERTO: "Aberto", ENCERRADO: "Encerrado", CANCELADO: "Cancelado" } as const;
export const dateLabel = (value: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(value);
