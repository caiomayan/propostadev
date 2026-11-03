import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { ProposalFields } from "@/components/proposals/proposal-fields";
import { ReferenceBlock } from "@/components/proposals/reference-block";
import { money } from "@/lib/format";
import { requirePrestador } from "@/lib/auth/session";
import { submitProposal, updateProposal, withdrawProposal } from "@/modules/proposals/actions";
import { getOpportunity } from "@/modules/proposals/queries";
import { budgetLabel, dateLabel, desiredDeadlineLabel, projectStatusLabels } from "@/modules/triage/labels";
import { precoReferencia } from "@/modules/triage/queries";

export const metadata: Metadata = { title: "Oportunidade" };
const statusLabel = { ENVIADA: "Enviada", PRE_SELECIONADA: "Pré-selecionada", RECUSADA: "Recusada", ACEITA: "Aceita", RETIRADA: "Retirada" } as const;

export default async function OpportunityPage({ params, searchParams }: { params: Promise<{ projetoId: string }>; searchParams: Promise<{ enviada?: string }> }) {
  const session = await requirePrestador();
  const { projetoId } = await params;
  const { item } = await getOpportunity(session.user.id, projetoId);
  if (!item) notFound();
  const { enviada } = await searchParams;
  const reference = await precoReferencia(item.serviceTypeId);
  const proposal = item.proposal;
  const open = item.status === "ABERTO";
  const canEdit = open && proposal !== null && (proposal.status === "ENVIADA" || proposal.status === "PRE_SELECIONADA");
  return <section className="stack opportunity-page">
    {enviada === "1" && <p role="status" className="panel tone">Proposta enviada. Você pode editá-la ou retirá-la enquanto o projeto estiver aberto.</p>}
    <p><Link href="/painel/oportunidades" className="inline"><ArrowLeft size={16} aria-hidden="true"/> Oportunidades</Link></p>
    <div className="page-heading"><p className="eyebrow">{item.serviceName}</p><h1>{item.title}</h1>
      <p className="chips-row">{item.invited && <span className="chip">Convite</span>}<span className={`status ${item.status.toLowerCase()}`}>{projectStatusLabels[item.status]}</span><span className="muted">Cliente: {item.clientFirstName} · Publicado em {dateLabel(item.createdAt)}</span></p></div>
    <dl className="triage-summary"><div><dt>Orçamento</dt><dd>{budgetLabel(item.budget)}</dd></div><div><dt>Prazo desejado</dt><dd>{desiredDeadlineLabel(item.desiredDays)}</dd></div></dl>
    <div className="opportunity-layout"><div className="stack opportunity-main">
    <div className="panel stack"><h2>Descrição</h2><p className="project-description">{item.description}</p></div>
    <section className="panel on-forest stack" aria-labelledby="referencia"><div><p className="eyebrow">Preço de referência</p><h2 id="referencia">Quanto costuma custar {item.serviceName}</h2></div><ReferenceBlock reference={reference} budget={item.budget} serviceName={item.serviceName}/></section>

    </div><aside className="stack opportunity-side" aria-label="Sua proposta">
    {proposal && <section className="panel stack" aria-labelledby="minha"><div><p className="eyebrow">Minha proposta</p><h2 id="minha">{money(proposal.amount)} em {proposal.days} {proposal.days === 1 ? "dia" : "dias"}</h2><p><span className="status">{statusLabel[proposal.status]}</span></p></div><p className="project-description">{proposal.message}</p></section>}
    {canEdit && proposal && <section className="panel stack" aria-labelledby="editar"><h2 id="editar">Editar proposta</h2>
      <ActionForm action={updateProposal} label="Salvar alterações"><input type="hidden" name="propostaId" value={proposal.id}/>
        <ProposalFields faixa={reference.faixa} media={reference.mediaFixos} n={reference.n} defaults={{ valor: proposal.amount, prazo: String(proposal.days), mensagem: proposal.message }}/></ActionForm>
      <details className="confirm"><summary>Retirar proposta</summary><div className="stack"><p>A proposta deixa de ser considerada pelo Cliente e não poderá ser reenviada para este projeto.</p>
        <ActionForm action={withdrawProposal} label="Confirmar retirada"><input type="hidden" name="propostaId" value={proposal.id}/></ActionForm></div></details></section>}
    {!proposal && item.eligible && <section className="panel stack" aria-labelledby="propor"><h2 id="propor">Enviar proposta</h2><p className="muted">Você pode enviar uma proposta por projeto. Antes de enviar, veja onde o seu valor cai na régua.</p>
      <ActionForm action={submitProposal} label="Enviar proposta"><input type="hidden" name="projetoId" value={item.id}/>
        <ProposalFields faixa={reference.faixa} media={reference.mediaFixos} n={reference.n} defaults={{ valor: "", prazo: item.desiredDays ? String(item.desiredDays) : "", mensagem: "" }}/></ActionForm></section>}
    {proposal && !canEdit && <p className="muted">{open ? "Esta proposta não pode mais ser alterada." : "O projeto não está mais aberto: a proposta é somente leitura."}</p>}
    </aside></div>
  </section>;
}
