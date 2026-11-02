import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { requireCliente } from "@/lib/auth/session";
import { listClientProjects } from "@/modules/projects/queries";
import { budgetLabel, dateLabel, desiredDeadlineLabel, projectStatusLabels } from "@/modules/triage/labels";
import "../../triagem/triagem.css";

export const metadata: Metadata = { title: "Meus projetos" };

export default async function ProjectsPage() {
  const session = await requireCliente();
  const projects = await listClientProjects(session.user.id);
  return <section className="stack">
    <div className="page-heading"><h1>Meus projetos</h1><p>Os projetos que você descreveu e o estado de cada um.</p></div>
    {projects.length === 0 ? <div className="empty"><h2>Você ainda não publicou projetos</h2><p>Descreva o que precisa, veja o preço de referência e publique quando estiver pronto.</p><Link className="button" href="/triagem">Descrever um projeto <ArrowRight aria-hidden="true"/></Link></div>
      : <>
        <div><Link className="button" href="/triagem">Descrever um projeto <ArrowRight aria-hidden="true"/></Link></div>
        <ul className="project-list">{projects.map((project) => <li key={project.id} className="project-row">
          <div><h2><Link href={`/painel/projetos/${project.id}`}>{project.title}</Link></h2><p className="project-meta"><span>{project.serviceName}</span><span>{budgetLabel({ tipo: project.budgetType, min: project.budgetMin, max: project.budgetMax })}</span><span>Prazo: {desiredDeadlineLabel(project.desiredDays)}</span><span>Criado em <time dateTime={project.createdAt.toISOString()}>{dateLabel(project.createdAt)}</time></span></p></div>
          <span className="chips-row"><span className="chip neutral">{project.proposalCount} {project.proposalCount === 1 ? "proposta recebida" : "propostas recebidas"}</span><span className={`status ${project.status.toLowerCase()}`}>{projectStatusLabels[project.status]}</span></span>
        </li>)}</ul>
      </>}
  </section>;
}
