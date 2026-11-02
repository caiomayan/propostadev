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
/** Frase da posição. "orcamento" (Cliente) ou "valor" (Proposta do Prestador). */
export function positionSentence(position: Exclude<BudgetPosition, "INDEFINIDO">, subject: "orcamento" | "valor" = "orcamento") {
  return `Seu ${subject === "valor" ? "valor" : "orçamento"} está ${positionWord[position]} faixa anunciada.`;
}
