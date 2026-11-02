import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { PriceRuler } from "@/components/price-ruler";
import { ForgetDraft } from "@/components/triage/draft-memory";
import { money } from "@/lib/format";
import { requireCliente } from "@/lib/auth/session";
import { cancelProject } from "@/modules/projects/actions";
import { getClientProject, listInvitedProviderIds } from "@/modules/projects/queries";
import { getAcceptedProvider, listProposalsForTriage, parseTriageOrder } from "@/modules/proposals/queries";
import { AcceptedProviderBlock } from "@/components/proposals/accepted-provider";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { TriageControls } from "@/components/proposals/triage-controls";
import { CompatibleCard } from "@/components/triage/compatible-card";
import { ReviewInvite } from "@/components/reviews/review-invite";
import { getOwnReview } from "@/modules/reviews/queries";
import { InviteButton } from "@/components/projects/invite-button";
import { MAX_INVITES } from "@/modules/proposals/validation";
import { posicaoOrcamento } from "@/modules/triage/position";
import { budgetLabel, dateLabel, desiredDeadlineLabel, projectStatusLabels } from "@/modules/triage/labels";
import { precoReferencia, prestadoresCompativeis } from "@/modules/triage/queries";
import "../../../triagem/triagem.css";

export const metadata: Metadata = { title: "Projeto" };

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ publicado?: string; ordem?: string; pre?: string }> }) {
  const session = await requireCliente();
  const { id } = await params;
  const project = await getClientProject(session.user.id, id);
  if (!project) notFound();
  const { publicado, ordem: ordemParam, pre } = await searchParams;
  const ordem = parseTriageOrder(ordemParam), soPre = pre === "1" && project.status === "ABERTO";
  const open = project.status === "ABERTO";
  const budget = { tipo: project.budgetType, min: project.budgetMin, max: project.budgetMax };
  const [reference, proposals, invitedIds, compatible, accepted] = await Promise.all([
    precoReferencia(project.serviceTypeId), listProposalsForTriage(session.user.id, project.id, { ordem, soPre }), listInvitedProviderIds(session.user.id, project.id),
    project.status === "ABERTO" ? prestadoresCompativeis({ tipoServicoId: project.serviceTypeId, orcamento: budget, prazoDias: project.desiredDays }) : Promise.resolve([]),
    getAcceptedProvider(session.user.id, project.id),
  ]);
  const winner = proposals.find((proposal) => proposal.status === "ACEITA");
  const others = proposals.filter((proposal) => proposal.status !== "ACEITA");
  const basePath = `/painel/projetos/${project.id}`;
  return <section className="stack">
    {publicado === "1" && <><ForgetDraft/><p role="status" className="panel tone">Projeto publicado. Ele está aberto e aparece em “Meus projetos”.</p></>}
    <p><Link href="/painel/projetos" className="inline"><ArrowLeft size={16} aria-hidden="true"/> Meus projetos</Link></p>
    <div className="page-heading"><p className="eyebrow">{project.serviceName}</p><h1>{project.title}</h1>
      <p><span className={`status ${project.status.toLowerCase()}`}>{projectStatusLabels[project.status]}</span> <span className="muted">Criado em {dateLabel(project.createdAt)}</span></p></div>
    <dl className="triage-summary"><div><dt>Orçamento</dt><dd>{budgetLabel(budget)}</dd></div><div><dt>Prazo desejado</dt><dd>{desiredDeadlineLabel(project.desiredDays)}</dd></div></dl>
    <div className="panel stack"><h2>Descrição</h2><p className="project-description">{project.description}</p></div>
    <section className="panel stack" aria-labelledby="referencia">
      <div><p className="eyebrow">Preço de referência</p><h2 id="referencia">Quanto costuma custar {project.serviceName}</h2></div>
      {reference.suficiente ? <>
        {reference.mediaFixos && <p className="reference-average"><span>Média dos preços fixos</span><strong>{money(reference.mediaFixos)}</strong><small>{reference.fixosN} prestadores com preço fixo. Não é orçamento.</small></p>}
        <PriceRuler data={{ faixa: reference.faixa, media: reference.mediaFixos, n: reference.n, orcamento: budget, posicao: posicaoOrcamento(budget, reference.faixa) }}/>
      </> : <div className="insufficient"><strong>Dados insuficientes</strong><p>Só {reference.n} {reference.n === 1 ? "prestador anuncia" : "prestadores anunciam"} preço por projeto neste tipo de serviço. São necessários pelo menos 3.</p></div>}
    </section>
    {accepted && <AcceptedProviderBlock provider={accepted}/>}
    {accepted && <ReviewInvite providerId={accepted.providerId} providerName={accepted.displayName} providerActive={accepted.active} own={await getOwnReview(session.user.id, accepted.providerId)}/>}
    <section className="stack" aria-labelledby="propostas">
      <div><p className="eyebrow">Propostas</p><h2 id="propostas">{open ? `${project.proposalCount} ${project.proposalCount === 1 ? "proposta ativa" : "propostas ativas"}` : `${proposals.length} ${proposals.length === 1 ? "proposta recebida" : "propostas recebidas"}`}</h2>
        {!open && <p className="muted">{project.status === "ENCERRADO" ? "O projeto foi encerrado com o aceite de uma proposta. A lista é somente leitura." : "O projeto foi cancelado. A lista é somente leitura."}</p>}</div>
      {proposals.length > 1 || soPre || ordem ? <TriageControls basePath={basePath} ordem={ordem} soPre={soPre} canFilter={open}/> : null}
      {winner && <ProposalCard proposal={winner} reference={reference} budget={budget} desiredDays={project.desiredDays} actions={false} highlight/>}
      {others.length === 0 && !winner
        ? soPre ? <div className="empty"><h3>Nenhuma proposta pré-selecionada</h3><p>Pré-selecione as propostas que continuam na disputa para filtrá-las aqui.</p><Link className="button secondary" href={basePath}>Ver todas as propostas</Link></div>
          : <p className="muted">Nenhuma proposta recebida ainda.{open && " Convide prestadores compatíveis abaixo para acelerar."}</p>
        : others.length > 0 && <>{winner && <h3 className="proposal-subhead">Propostas recusadas</h3>}<ul className="proposal-list" aria-label="Propostas do projeto">{others.map((proposal) => <li key={proposal.id}><ProposalCard proposal={proposal} reference={reference} budget={budget} desiredDays={project.desiredDays} actions={open}/></li>)}</ul></>}
    </section>
    {project.status === "ABERTO" && <section className="stack" aria-labelledby="convidar">
      <div><p className="eyebrow">Convites</p><h2 id="convidar">Convide prestadores compatíveis</h2><p className="muted">{invitedIds.length} de {MAX_INVITES} convites usados. O prestador convidado vê o seu projeto primeiro, com o selo Convite.</p></div>
      {compatible.length === 0 ? <div className="empty"><h3>Nenhum prestador compatível agora</h3><p>Quando alguém passar a oferecer este serviço, ele aparece aqui.</p></div>
        : <div className="stack compatible-list">{compatible.map((provider) => <CompatibleCard key={provider.providerId} provider={provider} action={<InviteButton projectId={project.id} providerId={provider.providerId} providerName={provider.displayName} invited={invitedIds.includes(provider.providerId)}/>}/>)}</div>}
    </section>}
    {project.status === "ABERTO" && <details className="confirm"><summary>Cancelar projeto</summary><div className="stack"><p>O projeto deixa de estar aberto e não poderá ser reaberto. Se quiser, descreva um novo projeto depois.</p>
      <ActionForm action={cancelProject} label="Confirmar cancelamento"><input type="hidden" name="id" value={project.id}/></ActionForm></div></details>}
  </section>;
}
