import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ReferenceBlock } from "@/components/proposals/reference-block";
import { SortLinks } from "@/components/sort-links";
import { requirePrestador } from "@/lib/auth/session";
import { applySort, opportunitySorts, sortOptions } from "@/lib/list-sorts";
import { listOpportunities } from "@/modules/proposals/queries";
import { budgetLabel, dateLabel, desiredDeadlineLabel } from "@/modules/triage/labels";
import { precoReferencia } from "@/modules/triage/queries";

export const metadata: Metadata = { title: "Oportunidades" };
const statusLabel = { ENVIADA: "Proposta enviada", PRE_SELECIONADA: "Pré-selecionada", RECUSADA: "Recusada", ACEITA: "Aceita", RETIRADA: "Retirada" } as const;

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ ordem?: string }> }) {
  const session = await requirePrestador();
  const { standing, items: listed } = await listOpportunities(session.user.id);
  if (standing.state !== "ok") {
    const text = {
      "sem-perfil": ["Crie seu perfil para ver oportunidades", "Projetos abertos aparecem aqui quando você tem um perfil ativo e uma oferta ativa no mesmo tipo de serviço.", "/painel/perfil", "Criar meu perfil"],
      inativo: ["Reative seu perfil para ver oportunidades", "Seu perfil está desativado. Reative-o para voltar a ver projetos abertos e enviar propostas.", "/painel/perfil", "Abrir meu perfil"],
      "sem-oferta": ["Publique uma oferta para ver oportunidades", "Você vê os projetos abertos dos tipos de serviço em que tem uma oferta ativa. Publique uma oferta para começar.", "/painel/ofertas/nova", "Criar oferta"],
    }[standing.state];
    return <section className="stack"><div className="page-heading"><h1>Oportunidades</h1></div><div className="empty"><h2>{text[0]}</h2><p>{text[1]}</p><Link className="button" href={text[2]}>{text[3]}</Link></div></section>;
  }
  const { items, current, isDefault } = applySort(opportunitySorts, (await searchParams).ordem, listed);
  const references = new Map(await Promise.all([...new Set(items.map((item) => item.serviceTypeId))].map(async (id) => [id, await precoReferencia(id)] as const)));
  return <section className="stack">
    <div className="page-heading"><h1>Oportunidades</h1><p>Projetos abertos nos tipos de serviço em que você tem oferta ativa.{isDefault && " Os convites vêm primeiro."}</p></div>
    {items.length > 1 && <SortLinks name="oportunidades" options={sortOptions(opportunitySorts, current, (ordem) => (ordem ? `/painel/oportunidades?ordem=${ordem}` : "/painel/oportunidades"))}/>}
    {items.length === 0 ? <div className="empty"><h2>Nenhum projeto aberto agora</h2><p>Quando um Cliente publicar um projeto no seu tipo de serviço, ele aparece aqui.</p></div>
      : <ul className="project-list">{items.map((item) => <li key={item.id} className="panel stack">
        <div className="opportunity-head"><div><h2><Link href={`/painel/oportunidades/${item.id}`}>{item.title}</Link></h2>
          <p className="project-meta"><span>{item.serviceName}</span><span>Cliente: {item.clientFirstName}</span><span>Publicado em <time dateTime={item.createdAt.toISOString()}>{dateLabel(item.createdAt)}</time></span></p></div>
          <p className="chips-row">{item.invited && <span className="chip">Convite</span>}{item.proposal && <span className="chip neutral">{statusLabel[item.proposal.status]}</span>}</p></div>
        <dl className="triage-summary"><div><dt>Orçamento</dt><dd>{budgetLabel(item.budget)}</dd></div><div><dt>Prazo desejado</dt><dd>{desiredDeadlineLabel(item.desiredDays)}</dd></div></dl>
        <ReferenceBlock reference={references.get(item.serviceTypeId)!} budget={item.budget} serviceName={item.serviceName}/>
        <div><Link className="button" href={`/painel/oportunidades/${item.id}`}>{item.proposal ? "Ver minha proposta" : "Ver projeto e propor"} <ArrowRight aria-hidden="true"/></Link></div>
      </li>)}</ul>}
  </section>;
}
