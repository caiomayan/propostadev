import { decimalCents } from "@/modules/offers/validation";
import type { Budget } from "./validation";

export type Range = { min: string; max: string };
export type BudgetPosition = "ABAIXO" | "DENTRO" | "ACIMA" | "INDEFINIDO";

/**
 * Onde o orçamento cai na faixa de preços anunciados. Compara em centavos (sem float).
 * - NAO_SEI ou faixa ausente → INDEFINIDO.
 * - ATE: teto < mínimo da faixa → ABAIXO; teto > máximo da faixa → ACIMA; senão DENTRO.
 * - FAIXA: máximo do orçamento < mínimo da faixa → ABAIXO; mínimo do orçamento > máximo da faixa → ACIMA;
 *   senão DENTRO (as faixas se sobrepõem).
 * Um valor único (valor de uma Proposta) entra como { tipo: "FAIXA", min: valor, max: valor }.
 */
export function posicaoOrcamento(orcamento: Budget, faixa: Range | null): BudgetPosition {
  if (!faixa || orcamento.tipo === "NAO_SEI" || orcamento.max === null) return "INDEFINIDO";
  const low = decimalCents(faixa.min), high = decimalCents(faixa.max), ceiling = decimalCents(orcamento.max);
  if (ceiling < low) return "ABAIXO";
  if (orcamento.tipo === "ATE") return ceiling > high ? "ACIMA" : "DENTRO";
  if (orcamento.min === null) return "INDEFINIDO";
  return decimalCents(orcamento.min) > high ? "ACIMA" : "DENTRO";
}

const positionWord = { ABAIXO: "abaixo da", DENTRO: "dentro da", ACIMA: "acima da" } as const;
export type RulerSubject = "orcamento" | "valor" | "proposta";
/** Frase da posição. "orcamento" (Cliente), "valor" (o Prestador, ao compor a Proposta) ou "proposta" (o Cliente, ao triar). */
export function positionSentence(position: Exclude<BudgetPosition, "INDEFINIDO">, subject: RulerSubject = "orcamento") {
  const owner = subject === "valor" ? "Seu valor" : subject === "proposta" ? "O valor da proposta" : "Seu orçamento";
  return `${owner} está ${positionWord[position]} faixa anunciada.`;
}

/** Posição de um valor único (uma Proposta) na faixa de preços anunciados. */
export function posicaoValor(valor: string, faixa: Range | null): BudgetPosition {
  return posicaoOrcamento({ tipo: "FAIXA", min: valor, max: valor }, faixa);
}

export type DeadlineComparison = { tone: "antes" | "no-prazo" | "alem" | "flexivel"; text: string };
const dayWord = (days: number) => `${days} ${days === 1 ? "dia" : "dias"}`;
/** Prazo da Proposta contra o prazo desejado do Projeto: "5 dias antes do desejado", "dentro do prazo", "10 dias além do desejado". */
export function compareDeadline(proposalDays: number, desiredDays: number | null): DeadlineComparison {
  if (desiredDays === null) return { tone: "flexivel", text: "Prazo desejado flexível" };
  if (proposalDays < desiredDays) return { tone: "antes", text: `${dayWord(desiredDays - proposalDays)} antes do desejado` };
  if (proposalDays > desiredDays) return { tone: "alem", text: `${dayWord(proposalDays - desiredDays)} além do desejado` };
  return { tone: "no-prazo", text: "Dentro do prazo" };
}
