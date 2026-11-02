import Link from "next/link";
import { PriceRuler } from "@/components/price-ruler";
import { ProviderAvatar } from "@/components/provider-avatar";
import { ProposalActions } from "@/components/proposals/proposal-actions";
import { money, reputation } from "@/lib/format";
import { budgetLabel } from "@/modules/triage/labels";
import { compareDeadline, posicaoValor, type BudgetPosition } from "@/modules/triage/position";
import type { TriageProposal } from "@/modules/proposals/queries";
import type { ReferencePrice } from "@/modules/triage/queries";
import type { Budget } from "@/modules/triage/validation";

const statusLabel = { ENVIADA: "Enviada", PRE_SELECIONADA: "Pré-selecionada", RECUSADA: "Recusada", ACEITA: "Aceita", RETIRADA: "Retirada" } as const;
const statusClass = { ENVIADA: "enviada", PRE_SELECIONADA: "pre", RECUSADA: "recusada", ACEITA: "aceita", RETIRADA: "cancelado" } as const;
const budgetPositionText: Record<Exclude<BudgetPosition, "INDEFINIDO">, string> = { ABAIXO: "Abaixo do orçamento do Cliente", DENTRO: "Dentro do orçamento do Cliente", ACIMA: "Acima do orçamento do Cliente" };
const PREVIEW = 220;

/** Faixa do orçamento do Cliente como Range (ATE vai de 0 ao teto); null quando o Cliente não informou orçamento. */
function budgetRange(budget: Budget) {
  if (budget.tipo === "NAO_SEI" || budget.max === null) return null;
  return { min: budget.tipo === "FAIXA" && budget.min ? budget.min : "0.00", max: budget.max };
}

function Message({ text }: { text: string }) {
  if (text.length <= PREVIEW) return <p className="project-description">{text}</p>;
  const preview = `${text.slice(0, PREVIEW).trimEnd()}…`;
  // Sem estado no cliente: <details> nativo. Aberto, a prévia some e o texto completo aparece.
  return <details className="proposal-message"><summary><span className="msg-preview project-description">{preview}</span><span className="msg-toggle msg-more">Ler mensagem completa</span><span className="msg-toggle msg-less">Recolher mensagem</span></summary><p className="project-description">{text}</p></details>;
}

/**
 * Cartão de triagem de uma Proposta: Prestador, valor na régua contra o Preço de referência, prazo contra o desejado,
 * reputação, mensagem e estado. `actions` liga os botões do Cliente (só Projeto ABERTO e Proposta ativa).
 */
export function ProposalCard({ proposal, reference, budget, desiredDays, actions, highlight = false }: { proposal: TriageProposal; reference: ReferencePrice; budget: Budget; desiredDays: number | null; actions: boolean; highlight?: boolean }) {
  const deadline = compareDeadline(proposal.days, desiredDays);
  const relation = posicaoValor(proposal.amount, budgetRange(budget));
  const active = proposal.status === "ENVIADA" || proposal.status === "PRE_SELECIONADA";
  const verified = proposal.verifiedCount;
  const headingId = `proposta-${proposal.id}`;
  return <article className={`proposal-card ${proposal.status.toLowerCase()}${highlight ? " highlight" : ""}`} aria-labelledby={headingId}>
    <header className="proposal-head">
      <div className="provider-identity"><ProviderAvatar name={proposal.providerName} photoUrl={proposal.providerPhotoUrl}/>
        <div><h3 id={headingId}>{proposal.providerActive ? <Link href={`/prestadores/${proposal.providerSlug}`}>{proposal.providerName}</Link> : proposal.providerName}</h3>
          {/* Ticket 07: o texto das avaliações verificadas entra aqui (proposal.verifiedCount já chega da query). */}
          <p className="muted">{reputation(proposal.rating, proposal.reviewCount)}{verified > 0 ? ` · ${verified} ${verified === 1 ? "verificada" : "verificadas"}` : ""}</p></div></div>
      <span className={`status ${statusClass[proposal.status]}`}>{statusLabel[proposal.status]}</span>
    </header>
    <dl className="proposal-figures">
      <div><dt>Valor</dt><dd className="figure">{money(proposal.amount)}</dd>{relation !== "INDEFINIDO" && <dd className="muted">{budgetPositionText[relation]}</dd>}</div>
      <div><dt>Prazo</dt><dd className="figure">{proposal.days} {proposal.days === 1 ? "dia" : "dias"}</dd><dd className={`deadline ${deadline.tone}`}>{deadline.text}</dd></div>
    </dl>
    {reference.suficiente
      ? <PriceRuler data={{ faixa: reference.faixa, media: reference.mediaFixos, n: reference.n, orcamento: { tipo: "FAIXA", min: proposal.amount, max: proposal.amount }, posicao: posicaoValor(proposal.amount, reference.faixa), sujeito: "proposta", compact: true }}/>
      : <p className="muted no-reference">Sem Preço de referência para este tipo de serviço (poucos prestadores anunciam). Compare com o orçamento do Cliente: <strong>{budgetLabel(budget)}</strong>.</p>}
    <Message text={proposal.message}/>
    {actions && active && <ProposalActions proposalId={proposal.id} status={proposal.status as "ENVIADA" | "PRE_SELECIONADA"} providerName={proposal.providerName}/>}
  </article>;
}
