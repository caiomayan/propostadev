import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { offers, providers } from "@/lib/db/schema";
import { ActionForm } from "@/components/forms/action-form";
import { deleteOffer } from "@/modules/offers/actions";
export default async function OffersPage() {
  const session = await requireSession();
  const [p] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  if (!p) return <section className="panel stack"><h1>Minhas ofertas</h1><p>Crie seu perfil antes de cadastrar ofertas.</p><Link href="/painel/perfil" className="button">Criar perfil</Link></section>;
  const rows = await db.select().from(offers).where(and(eq(offers.providerId, p.id), isNull(offers.deletedAt))).orderBy(offers.title);
  return <section className="stack"><h1>Minhas ofertas</h1><Link className="button" href="/painel/ofertas/nova">Criar oferta</Link>{!p.active && <p>Seu perfil está desativado. Suas ofertas não aparecem publicamente.</p>}{rows.length === 0 && <div className="panel"><p>Você ainda não tem ofertas. Comece com um serviço que você oferece.</p></div>}{rows.map((offer) => <article className="panel stack" key={offer.id}><h2>{offer.title}</h2><p>{offer.active ? "Ativa" : "Pausada"}</p><Link href={`/painel/ofertas/${offer.id}/editar`}>Editar oferta →</Link><details><summary>Excluir oferta</summary><p>A oferta será retirada do público e não poderá ser restaurada pela interface.</p><ActionForm action={deleteOffer} label="Confirmar exclusão"><input type="hidden" name="id" value={offer.id} /></ActionForm></details></article>)}</section>;
}
