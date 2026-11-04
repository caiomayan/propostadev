import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { requirePrestador } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { offers, providers, serviceTypes } from "@/lib/db/schema";
import { ActionForm } from "@/components/forms/action-form";
import { OfferPosition } from "@/components/offer-position";
import { deleteOffer } from "@/modules/offers/actions";
import { precoReferencia } from "@/modules/triage/queries";
import { deadline, price } from "@/lib/format";
export default async function OffersPage() {
  const session = await requirePrestador();
  const [p] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  if (!p) return <section className="stack form-page"><header className="dash-heading"><h1>Minhas ofertas</h1></header><div className="empty"><h2>Primeiro, seu perfil</h2><p>As ofertas aparecem dentro do seu perfil público. Crie o perfil para cadastrar a primeira.</p><Link href="/painel/perfil" className="button">Criar perfil</Link></div></section>;
  const rows = await db.select({ offer: offers, serviceName: serviceTypes.name }).from(offers).innerJoin(serviceTypes, eq(serviceTypes.id, offers.serviceTypeId)).where(and(eq(offers.providerId, p.id), isNull(offers.deletedAt))).orderBy(offers.title);
  const references = new Map(await Promise.all([...new Set(rows.map((row) => row.offer.serviceTypeId))].map(async (id) => [id, await precoReferencia(id)] as const)));
  return <section className="stack form-page">
    <header className="dash-heading dash-heading-row"><div><h1>Minhas ofertas</h1><p className="muted">Cada tipo de serviço pode ter uma oferta ativa. As outras ficam pausadas.</p></div><Link className="button" href="/painel/ofertas/nova">Criar oferta</Link></header>
    {!p.active && <p className="notice" role="note">Seu perfil está desativado. Suas ofertas não aparecem publicamente até você reativá-lo em <Link href="/painel/perfil">Meu perfil</Link>.</p>}
    {rows.length === 0 && <div className="empty"><h2>Nenhuma oferta ainda</h2><p>Comece com o serviço que você mais vende: informe preço e prazo e veja onde ele cai na faixa do mercado.</p><Link className="button" href="/painel/ofertas/nova">Criar primeira oferta</Link></div>}
    {rows.map(({ offer, serviceName }) => <article className="panel stack offer-row" key={offer.id}>
      <div className="offer-row-head"><div><p className="muted">{serviceName}</p><h2>{offer.title}</h2></div><span className={`badge ${offer.active ? "accent" : ""}`}>{offer.active ? "Ativa" : "Pausada"}</span></div>
      <dl className="offer-facts"><div><dt>Preço</dt><dd>{price(offer)}</dd></div><div><dt>Prazo</dt><dd>{deadline(offer)}</dd></div></dl>
      <div className="offer-position"><h3>Onde seu preço cai</h3><OfferPosition offer={offer} reference={references.get(offer.serviceTypeId)!} /></div>
      <div className="inline"><Link className="button secondary" href={`/painel/ofertas/${offer.id}/editar`}>Editar oferta</Link></div>
      <details className="danger-zone"><summary>Excluir oferta</summary><p>A oferta será retirada do público e não poderá ser restaurada pela interface.</p><ActionForm action={deleteOffer} label="Confirmar exclusão"><input type="hidden" name="id" value={offer.id} /></ActionForm></details>
    </article>)}
  </section>;
}
