import Link from "next/link";
import { Check } from "lucide-react";
import { and, eq, isNull } from "drizzle-orm";
import { requireAccount } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { offers, providers } from "@/lib/db/schema";
import { ResumeDraft } from "@/components/triage/draft-memory";
import { listClientProjects } from "@/modules/projects/queries";
import { listMyProposals, listOpportunities } from "@/modules/proposals/queries";
import { dateLabel, projectStatusLabels } from "@/modules/triage/labels";
export default async function DashboardPage() {
  const { session, accountType } = await requireAccount();
  if (accountType === "CLIENTE") {
    const projects = await listClientProjects(session.user.id);
    const activeProposals = projects.reduce((total, project) => total + project.proposalCount, 0);
    const openProjects = projects.filter((project) => project.status === "ABERTO").length;
    const closedProjects = projects.filter((project) => project.status === "ENCERRADO").length;
    return <section className="stack"><h1>Olá, {session.user.name}.</h1><ResumeDraft/>
      {projects.length > 0 && <dl className="dash-figures" aria-label="Seus números"><div className="dash-figure lead"><dt>{activeProposals === 1 ? "Proposta ativa" : "Propostas ativas"}</dt><dd>{activeProposals}</dd></div><div className="dash-figure"><dt>{openProjects === 1 ? "Projeto aberto" : "Projetos abertos"}</dt><dd>{openProjects}</dd></div><div className="dash-figure"><dt>{closedProjects === 1 ? "Projeto encerrado" : "Projetos encerrados"}</dt><dd>{closedProjects}</dd></div></dl>}
      {projects.length === 0 ? <div className="panel stack"><h2>Comece descrevendo o que você precisa</h2><p>Faça a Triagem: você vê quanto esse serviço costuma custar e quais prestadores são compatíveis antes de publicar.</p><Link className="button" href="/triagem">Descrever um projeto</Link></div>
        : <div className="panel stack"><h2>Seus projetos</h2><p>{activeProposals} {activeProposals === 1 ? "proposta ativa recebida" : "propostas ativas recebidas"} em {openProjects} {openProjects === 1 ? "projeto aberto" : "projetos abertos"}.</p><ul className="project-list">{projects.slice(0, 3).map((project) => <li key={project.id} className="project-row"><div><Link href={`/painel/projetos/${project.id}`}>{project.title}</Link><p className="project-meta"><span>{dateLabel(project.createdAt)}</span></p></div><span className="chips-row">{project.proposalCount > 0 && <span className="chip">{project.proposalCount} {project.proposalCount === 1 ? "proposta recebida" : "propostas recebidas"}</span>}<span className={`status ${project.status.toLowerCase()}`}>{projectStatusLabels[project.status]}</span></span></li>)}</ul><div className="actions"><Link className="button" href="/triagem">Descrever um projeto</Link><Link className="button secondary" href="/painel/projetos">Ver todos os projetos</Link></div></div>}
      <Link href="/buscar">Explorar prestadores →</Link></section>;
  }
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  const rows = provider ? await db.select({ active: offers.active }).from(offers).where(and(eq(offers.providerId, provider.id), isNull(offers.deletedAt))) : [];
  const activeOffers = rows.filter((offer) => offer.active).length;
  const pausedOffers = rows.length - activeOffers;
  const [{ items: opportunities }, proposals] = await Promise.all([listOpportunities(session.user.id), listMyProposals(session.user.id)]);
  const open = opportunities.filter((item) => !item.proposal).length;
  const invited = opportunities.filter((item) => item.invited && !item.proposal).length;
  const inPlay = proposals.filter((proposal) => proposal.status === "ENVIADA" || proposal.status === "PRE_SELECIONADA").length;
  const accepted = proposals.filter((proposal) => proposal.status === "ACEITA").length;
  const steps = [
    { done: Boolean(provider), title: provider ? "Crie seu perfil" : "Apresente o que você faz.", text: "Nome, descrição e contatos que você autoriza publicar.", href: "/painel/perfil", cta: "Criar meu perfil" },
    { done: rows.length > 0, title: "Cadastre uma oferta", text: "Um serviço com preço e prazo anunciados. É isso que entra na busca e na comparação.", href: "/painel/ofertas/nova", cta: "Criar oferta" },
    { done: activeOffers > 0 && Boolean(provider?.active), title: "Publique", text: provider && !provider.active ? "Seu perfil está desativado. Reative para voltar à busca." : "Marque a oferta como publicada para aparecer para quem busca.", href: provider && !provider.active ? "/painel/perfil" : "/painel/ofertas", cta: provider && !provider.active ? "Reativar perfil" : "Revisar ofertas" },
  ];
  const next = steps.find((step) => !step.done);
  const firstName = session.user.name.split(/\s+/)[0];
  return <section className="stack dash">
    <header className="dash-heading"><h1>Olá, {firstName}.</h1><p className="muted">{next ? "Faltam poucos passos para você aparecer na busca." : "Seu perfil está no ar. Mantenha preços e prazos atualizados."}</p></header>
    {!next && <dl className="dash-figures" aria-label="Seus números"><div className="dash-figure lead"><dt>{invited > 0 ? `${open === 1 ? "Oportunidade" : "Oportunidades"} (${invited} com convite)` : open === 1 ? "Oportunidade aberta" : "Oportunidades abertas"}</dt><dd>{open}</dd></div><div className="dash-figure"><dt>{inPlay === 1 ? "Proposta em disputa" : "Propostas em disputa"}</dt><dd>{inPlay}</dd></div><div className="dash-figure"><dt>{accepted === 1 ? "Proposta aceita" : "Propostas aceitas"}</dt><dd>{accepted}</dd></div></dl>}
    {next ? <div className="panel dash-next stack"><h2>{next.title}</h2><p>{next.text}</p><Link className="button" href={next.href}>{next.cta}</Link></div>
      : <div className="panel dash-next stack"><h2>Tudo pronto por aqui</h2><p>Seu perfil e suas ofertas estão publicados. Veja os projetos abertos que combinam com o que você oferece.</p><Link className="button" href="/painel/oportunidades">Ver oportunidades</Link></div>}
    {next && <ol className="dash-steps" aria-label="Primeiros passos">{steps.map((step, index) => <li key={step.title} className={step.done ? "done" : step === next ? "current" : ""} aria-current={step === next ? "step" : undefined}><span className="dash-step-mark" aria-hidden="true">{step.done ? <Check /> : index + 1}</span><div><strong>{step.title}</strong><small>{step.done ? "Concluído" : step === next ? "Próximo passo" : "Depois"}</small></div></li>)}</ol>}
    {provider && <div className="panel stack"><h2>Situação</h2><dl className="dash-status">
      <div><dt>Perfil</dt><dd><span className={`badge ${provider.active ? "accent" : ""}`}>{provider.active ? "Ativo" : "Desativado"}</span> <Link href="/painel/perfil">Editar</Link></dd></div>
      <div><dt>Ofertas</dt><dd>{activeOffers} {activeOffers === 1 ? "ativa" : "ativas"}{pausedOffers > 0 && <> · {pausedOffers} {pausedOffers === 1 ? "pausada" : "pausadas"}</>} <Link href="/painel/ofertas">Gerenciar</Link></dd></div>
      {provider.active && <div><dt>Página pública</dt><dd><Link href={`/prestadores/${provider.slug}`}>Ver meu perfil público</Link></dd></div>}
    </dl></div>}
    <p><Link href="/buscar">Explorar prestadores →</Link></p>
  </section>;
}
