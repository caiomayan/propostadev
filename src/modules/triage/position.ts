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
export type Subject = "orcamento" | "valor" | "preco" | "cliente";
const subjectLabels: Record<Subject, [label: string, sentenceStart: string]> = {
  orcamento: ["Seu orçamento", "Seu orçamento"],
  valor: ["Seu valor", "Seu valor"],
  preco: ["Seu preço", "Seu preço"],
  cliente: ["Orçamento do Cliente", "O orçamento do Cliente"],
};
/** Rótulo do que a régua posiciona: orçamento do Cliente (visto por ele ou pelo Prestador), valor de uma Proposta ou preço de uma Oferta. */
export function subjectLabel(subject: Subject = "orcamento") {
  return subjectLabels[subject][0];
}
/** Frase da posição. */
export function positionSentence(position: Exclude<BudgetPosition, "INDEFINIDO">, subject: Subject = "orcamento") {
  return `${subjectLabels[subject][1]} está ${positionWord[position]} faixa anunciada.`;
}
