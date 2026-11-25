import Link from "next/link";
import type { Metadata } from "next";
import { requirePrestador } from "@/lib/auth/session";
import { VipBadge } from "@/components/vip-badge";
import { VipInterestButton } from "@/components/vip-interest-button";
import { getVipStatus } from "@/modules/vip/queries";
import { dateLabel } from "@/modules/triage/labels";

export const metadata: Metadata = { title: "VIP" };

export default async function VipPage() {
  const session = await requirePrestador();
  const status = await getVipStatus(session.user.id);
  return <section className="stack form-page">
    <header className="dash-heading"><h1>Prestador VIP</h1><p className="muted">Mais visibilidade para o seu perfil na busca.</p></header>
    <div className="panel stack"><h2>Benefícios</h2>
      <ul className="stack"><li><strong>Selo VIP</strong> no seu perfil público e nos cards da busca.</li><li><strong>Destaque VIP</strong>: uma faixa identificada no topo da busca, com até três Prestadores VIP que atendem aos filtros de quem busca.</li></ul>
      <p className="muted">A Triagem e a lista de Prestadores compatíveis não mudam por causa do VIP: a compatibilidade continua neutra.</p>
      <p><strong>Nesta versão não há assinatura nem cobrança.</strong> O VIP é concedido pela plataforma.</p></div>
    <div className="panel stack"><h2>Sua situação</h2>
      {!status ? <><p>Crie seu perfil para poder registrar interesse no VIP.</p><Link className="button" href="/painel/perfil">Criar meu perfil</Link></>
        : status.vip ? <p role="status"><VipBadge/> Você já é Prestador VIP.</p>
        : status.interestAt ? <p role="status">Interesse registrado em {dateLabel(status.interestAt)}.</p>
        : <><p>Quer ser Prestador VIP? Registre seu interesse; isso não ativa nada nem gera cobrança.</p><VipInterestButton/></>}
    </div>
  </section>;
}
