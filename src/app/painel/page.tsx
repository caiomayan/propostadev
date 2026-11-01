import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAccount } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { ResumeDraft } from "@/components/triage/draft-memory";
import { listClientProjects } from "@/modules/projects/queries";
import { dateLabel, projectStatusLabels } from "@/modules/triage/labels";
import "../triagem/triagem.css";
export default async function DashboardPage() {
  const { session, accountType } = await requireAccount();
  if (accountType === "CLIENTE") {
    const projects = await listClientProjects(session.user.id);
    return <section className="stack"><h1>Olá, {session.user.name}.</h1><ResumeDraft/>
      {projects.length === 0 ? <div className="panel stack"><h2>Comece descrevendo o que você precisa</h2><p>Faça a Triagem: você vê quanto esse serviço costuma custar e quais prestadores são compatíveis antes de publicar.</p><Link className="button" href="/triagem">Descrever um projeto</Link></div>
        : <div className="panel stack"><h2>Seus projetos</h2><p>{projects.reduce((total, project) => total + project.proposalCount, 0)} propostas ativas recebidas em {projects.filter((project) => project.status === "ABERTO").length} projetos abertos.</p><ul className="project-list">{projects.slice(0, 3).map((project) => <li key={project.id} className="project-row"><div><Link href={`/painel/projetos/${project.id}`}>{project.title}</Link><p className="project-meta"><span>{dateLabel(project.createdAt)}</span></p></div><span className="chips-row">{project.proposalCount > 0 && <span className="chip">{project.proposalCount} {project.proposalCount === 1 ? "proposta recebida" : "propostas recebidas"}</span>}<span className={`status ${project.status.toLowerCase()}`}>{projectStatusLabels[project.status]}</span></span></li>)}</ul><div className="actions"><Link className="button" href="/triagem">Descrever um projeto</Link><Link className="button secondary" href="/painel/projetos">Ver todos os projetos</Link></div></div>}
      <Link href="/buscar">Explorar prestadores →</Link></section>;
  }
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  return <section className="stack"><h1>Olá, {session.user.name}.</h1><div className="panel stack"><h2>{provider ? "Continue construindo sua presença." : "Apresente o que você faz."}</h2><p>{provider ? "Atualize seu perfil e gerencie suas ofertas de serviço." : "Crie seu perfil de prestador para publicar suas primeiras ofertas."}</p><Link className="button" href="/painel/perfil">{provider ? "Editar meu perfil" : "Criar meu perfil"}</Link>{provider && <><p>Perfil {provider.active ? "ativo" : "desativado"}.</p><Link href="/painel/ofertas">Gerenciar ofertas →</Link>{provider.active && <Link href={`/prestadores/${provider.slug}`}>Ver meu perfil público →</Link>}</>}<Link href="/buscar">Explorar prestadores →</Link></div></section>;
}
