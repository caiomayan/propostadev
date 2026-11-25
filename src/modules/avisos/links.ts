import type { avisoTypes } from "@/lib/db/schema";

export type AvisoType = (typeof avisoTypes)[number];

/** Título do Aviso por tipo. O Projeto vem da consulta; o texto não guarda dado do usuário. */
export const avisoTitles: Record<AvisoType, string> = {
  CONVITE_RECEBIDO: "Você recebeu um convite",
  PROPOSTA_RECEBIDA: "Nova proposta no seu projeto",
  PROPOSTA_PRE_SELECIONADA: "Sua proposta foi pré-selecionada",
  PROPOSTA_ACEITA: "Sua proposta foi aceita",
  PROPOSTA_RECUSADA: "Sua proposta foi recusada",
};

/** Destino do Aviso: o Cliente vai ao seu Projeto; o Prestador, à Oportunidade (que continua legível depois do encerramento para quem tem Proposta ou Convite). */
export function avisoHref(type: AvisoType, projectId: string | null): string {
  if (!projectId) return "/painel/avisos";
  return type === "PROPOSTA_RECEBIDA" ? `/painel/projetos/${projectId}` : `/painel/oportunidades/${projectId}`;
}

/** Rótulo acessível do sino: o número só entra quando há Avisos não lidos. */
export function unreadLabel(count: number): string {
  if (count <= 0) return "Avisos";
  return count === 1 ? "1 aviso não lido" : `${count} avisos não lidos`;
}
