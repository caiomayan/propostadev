/** Trigger da migration 0005 que recusa Avaliação sem Proposta ACEITA. O seed demo o desativa só para a Avaliação anterior. */
export const REVIEW_ACCEPTANCE_TRIGGER = "avaliacao_requer_aceite";
export const REVIEW_NOT_ELIGIBLE = "Só quem contratou este prestador por uma Proposta aceita pode avaliar.";
export const VERIFIED_SEAL = "Contratado pela Proposta.dev";
export const PREVIOUS_REVIEW_NOTE = "Avaliação anterior, sem contratação verificada";

export const TRUST_SEAL = "Selo de confiança";
/** Os três critérios do Selo de confiança (ADR 0004, decisão 2), na ordem em que o checklist os mostra. */
export const TRUST_CRITERIA = [
  "E-mail da conta confirmado",
  "Ao menos uma Avaliação verificada (de Cliente que aceitou uma Proposta deste prestador)",
  "Média das Avaliações verificadas de 4,0 ou mais",
] as const;
