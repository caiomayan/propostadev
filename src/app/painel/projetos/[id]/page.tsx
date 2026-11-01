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
import { getClientProject } from "@/modules/projects/queries";
import { posicaoOrcamento } from "@/modules/triage/position";
import { budgetLabel, dateLabel, desiredDeadlineLabel, projectStatusLabels } from "@/modules/triage/labels";
import { precoReferencia } from "@/modules/triage/queries";
import "../../../triagem/triagem.css";

export const metadata: Metadata = { title: "Projeto" };

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ publicado?: string }> }) {
  const session = await requireCliente();
  const { id } = await params;
  const project = await getClientProject(session.user.id, id);
  if (!project) notFound();
  const { publicado } = await searchParams;
  const budget = { tipo: project.budgetType, min: project.budgetMin, max: project.budgetMax };
  const reference = await precoReferencia(project.serviceTypeId);
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
    {project.status === "ABERTO" && <details className="confirm"><summary>Cancelar projeto</summary><div className="stack"><p>O projeto deixa de estar aberto e não poderá ser reaberto. Se quiser, descreva um novo projeto depois.</p>
      <ActionForm action={cancelProject} label="Confirmar cancelamento"><input type="hidden" name="id" value={project.id}/></ActionForm></div></details>}
  </section>;
}
