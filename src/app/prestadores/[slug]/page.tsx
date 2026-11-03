import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProvider, getProviderReviews } from "@/modules/search/queries";
import { getSession } from "@/lib/auth/session";
import { ProviderAvatar } from "@/components/provider-avatar";
import { ProviderContacts } from "@/components/provider-contacts";
import { CompareButton } from "@/components/comparison-selection";
import { ReviewForm } from "@/components/review-form";
import { ReviewBadge } from "@/components/review-badge";
import { REVIEW_NOT_ELIGIBLE, VERIFIED_SEAL } from "@/modules/reviews/rules";
import { deadline, location, price, reputation } from "@/lib/format";

export default async function ProviderPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const provider = await getPublicProvider(slug);
  if (!provider) notFound();
  const rawPage = Array.isArray(query.pagina) ? query.pagina[0] : query.pagina;
  const value = Number(rawPage ?? 1);
  const page = Number.isInteger(value) && value >= 1 && value <= 1000 ? value : 1;
  const session = await getSession();
  const reviewData = await getProviderReviews(provider.id, page, session?.user.id);
  const reviewBox = !session ? <div className="panel"><p><Link href="/entrar">Entre como Cliente</Link> para avaliar este prestador. Só quem contratou por uma Proposta aceita pode avaliar.</p></div>
    : reviewData.isOwner ? <p className="panel muted">Você pode acompanhar as avaliações do seu perfil aqui. Não é possível avaliar o próprio perfil.</p>
    : reviewData.own ? <ReviewForm providerId={provider.id} own={reviewData.own}/>
    : session.user.accountType === "PRESTADOR" ? <p className="panel muted">Contas de Prestador não avaliam outros prestadores.</p>
    : reviewData.canCreate && session.user.accountType === "CLIENTE" ? <ReviewForm providerId={provider.id} own={null}/>
    : <p className="panel muted">{REVIEW_NOT_ELIGIBLE} Descreva seu projeto na <Link href="/triagem">Triagem</Link> e convide este prestador.</p>;
  const pages = Math.ceil(provider.reviewCount / 10);
  const experience = `${provider.yearsExperience} ${provider.yearsExperience === 1 ? "ano" : "anos"} de experiência`;
  return <section className="container section profile">
    <p><Link href="/buscar" className="back-link">← Voltar à busca</Link></p>
    <header className="profile-hero panel on-forest"><ProviderAvatar name={provider.displayName} photoUrl={provider.photoUrl}/><div className="profile-hero-text"><div className="inline"><span className="badge">{provider.type === "PESSOA_FISICA" ? "Pessoa física" : "Pessoa jurídica"}</span><span className="badge">{experience}</span></div><h1>{provider.displayName}</h1><p className="muted">{location(provider)}</p><p className="profile-reputation">{reputation(provider.rating, provider.reviewCount, provider.verifiedCount)}</p></div><a className="button accent profile-hero-cta" href="#contato">Falar com o prestador</a></header>
    <div className="profile-layout">
      <div className="profile-main">
        <section className="profile-section"><h2>Sobre o prestador</h2><p className="profile-description">{provider.description}</p><p className="muted">Tipo de prestador e experiência são informações autodeclaradas.</p></section>
        <section className="profile-section"><h2>Serviços anunciados</h2>{provider.offers.length ? <div className="profile-offers">{provider.offers.map((offer) => <article className="profile-offer" key={offer.id}><span className="badge">{offer.serviceName}</span><h3>{offer.title}</h3><p className="profile-offer-description">{offer.description}</p><div className="profile-offer-foot"><dl className="offer-facts"><div><dt>Preço</dt><dd className="offer-price">{price(offer)}</dd></div><div><dt>Prazo</dt><dd>{deadline(offer)}</dd></div></dl><CompareButton offerId={offer.id} providerId={provider.id}/></div></article>)}</div> : <div className="empty"><p>Este prestador ainda não tem serviços ativos anunciados.</p></div>}</section>
        <section id="avaliacoes" className="review-section"><h2>Avaliações ({provider.reviewCount})</h2><p className="muted">Avaliações com o selo “{VERIFIED_SEAL}” vêm de Clientes que aceitaram uma Proposta deste prestador na plataforma.</p>
          {reviewBox}
          {reviewData.reviews.length ? reviewData.reviews.map((review) => <article className={`review-item ${review.verified ? "verified" : "previous"}`} key={review.id}><div className="review-heading"><strong>{review.name}</strong><span aria-label={`Nota ${review.rating} de 5`}>{review.rating}/5</span></div><div className="review-meta"><ReviewBadge verified={review.verified}/><p className="muted"><time dateTime={new Date(review.createdAt).toISOString()}>{new Date(review.createdAt).toLocaleDateString("pt-BR")}</time>{new Date(review.updatedAt).getTime() > new Date(review.createdAt).getTime() && " · Editada"}</p></div>{review.comment && <p>{review.comment}</p>}</article>) : <p className="empty">{provider.reviewCount ? "Não há avaliações nesta página." : "Ainda não recebeu avaliações."}</p>}
          {page > 1 && reviewData.reviews.length === 0 && <p><Link className="button secondary" href={`/prestadores/${slug}#avaliacoes`}>Voltar às primeiras avaliações</Link></p>}
          {pages > 1 && <nav className="pagination" aria-label="Paginação de avaliações">{page > 1 ? <Link className="button secondary" href={`/prestadores/${slug}?pagina=${page - 1}#avaliacoes`}>Anterior</Link> : <span/>}<span className="muted">Página {page} de {pages}</span>{page < pages ? <Link className="button secondary" href={`/prestadores/${slug}?pagina=${page + 1}#avaliacoes`}>Próxima</Link> : <span/>}</nav>}
        </section>
      </div>
      <aside id="contato" className="panel stack profile-contact"><h2>Fale com o prestador</h2><p className="muted">Tire dúvidas pelos contatos publicados abaixo. Para receber uma proposta com valor e prazo, descreva seu projeto na <Link href="/triagem">Triagem</Link> e convide este prestador.</p><ProviderContacts provider={provider}/><p className="muted">{provider.contactEmail}</p></aside>
    </div>
  </section>;
}
