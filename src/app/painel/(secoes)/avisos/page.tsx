import type { Metadata } from "next";
import { CheckCheck } from "lucide-react";
import { requireAccount } from "@/lib/auth/session";
import { dateLabel } from "@/modules/triage/labels";
import { markAllAvisosRead } from "@/modules/avisos/actions";
import { countUnread, listAvisos } from "@/modules/avisos/queries";
import { avisoTitles, unreadLabel } from "@/modules/avisos/links";
import "@/components/avisos.css";

export const metadata: Metadata = { title: "Avisos" };

export default async function AvisosPage() {
  const { session } = await requireAccount();
  const [items, unread] = await Promise.all([listAvisos(session.user.id), countUnread(session.user.id)]);
  return <section className="stack">
    <header className="dash-heading dash-heading-row"><div><h1>Avisos</h1><p className="muted">Os 50 mais recentes sobre os seus Convites e Propostas.</p></div>
      {unread > 0 && <form action={markAllAvisosRead}><button type="submit" className="button secondary"><CheckCheck aria-hidden="true"/>Marcar todos como lidos</button></form>}</header>
    <p role="status" className="muted">{unread > 0 ? unreadLabel(unread) : "Nenhum aviso não lido."}</p>
    {items.length === 0 ? <div className="empty"><h2>Nenhum aviso por enquanto</h2><p>Quando alguém convidar você, enviar uma proposta ou decidir sobre uma, o aviso aparece aqui.</p></div>
      : <ul className="aviso-list">{items.map((item) => <li key={item.id} className="aviso-row" data-unread={item.read ? undefined : ""}>
        <div className="aviso-body"><h2>{/* Link comum (sem prefetch): abrir o Aviso marca como lido no servidor. */}<a href={`/painel/avisos/${item.id}`}>{item.read ? "" : <span className="sr-only">Não lido: </span>}{avisoTitles[item.type]}</a></h2>
          <p className="aviso-meta"><span>{item.projectTitle ?? "Projeto removido"}</span><time dateTime={item.createdAt.toISOString()}>{dateLabel(item.createdAt)}</time></p></div>
        {!item.read && <span className="badge accent aviso-new" aria-hidden="true">Novo</span>}
      </li>)}</ul>}
  </section>;
}
