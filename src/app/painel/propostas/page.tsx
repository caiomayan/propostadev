import Link from "next/link";
import type { Metadata } from "next";
import { money } from "@/lib/format";
import { requirePrestador } from "@/lib/auth/session";
import { listMyProposals } from "@/modules/proposals/queries";
import { dateLabel, projectStatusLabels } from "@/modules/triage/labels";
import "../../triagem/triagem.css";

export const metadata: Metadata = { title: "Minhas propostas" };
const statusLabel = { ENVIADA: "Enviada", PRE_SELECIONADA: "Pré-selecionada", RECUSADA: "Recusada", ACEITA: "Aceita", RETIRADA: "Retirada" } as const;

export default async function MyProposalsPage() {
  const session = await requirePrestador();
  const proposals = await listMyProposals(session.user.id);
  return <section className="stack">
    <div className="page-heading"><h1>Minhas propostas</h1><p>Todas as propostas que você enviou, com o estado de cada uma e do projeto.</p></div>
    {proposals.length === 0 ? <div className="empty"><h2>Você ainda não enviou propostas</h2><p>Veja os projetos abertos nos seus tipos de serviço e envie a primeira.</p><Link className="button" href="/painel/oportunidades">Ver oportunidades</Link></div>
      : <ul className="project-list">{proposals.map((proposal) => <li key={proposal.id} className={`project-row${proposal.client ? " has-contact" : ""}`}>
        <div><h2><Link href={`/painel/oportunidades/${proposal.projectId}`}>{proposal.projectTitle}</Link></h2>
          <p className="project-meta"><span>{proposal.serviceName}</span><span>{money(proposal.amount)} em {proposal.days} {proposal.days === 1 ? "dia" : "dias"}</span><span>Projeto: {projectStatusLabels[proposal.projectStatus]}</span><span>Enviada em {dateLabel(proposal.createdAt)}</span></p></div>
        {proposal.client && <div className="client-contact" role="group" aria-label={`Contato do Cliente de ${proposal.projectTitle}`}>
          <p className="eyebrow">Proposta aceita: contato do Cliente</p>
          <p><strong>{proposal.client.name}</strong></p>
          <p><a className="button" href={`mailto:${proposal.client.email}`}>{proposal.client.email}</a></p>
          <p className="muted">Combine o trabalho direto com o Cliente. Contrato e pagamento acontecem fora da Proposta.dev.</p>
        </div>}
        <span className={`status ${proposal.status === "ENVIADA" || proposal.status === "PRE_SELECIONADA" || proposal.status === "ACEITA" ? "aberto" : proposal.status.toLowerCase()}`}>{statusLabel[proposal.status]}</span>
      </li>)}</ul>}
  </section>;
}
