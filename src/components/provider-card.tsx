import Link from "next/link";
import { CompareButton } from "./comparison-selection";
import { deadline, location, price, reputation } from "@/lib/format";
import type { PublicOffer } from "@/modules/search/queries";

export function ProviderAvatar({ name }: { name: string }) {
  return <span className="provider-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>;
}
export function ProviderCard({ offer }: { offer: PublicOffer }) {
  return <article className="provider-result">
    <div className="provider-identity"><ProviderAvatar name={offer.displayName}/><div><h2><Link href={`/prestadores/${offer.slug}`}>{offer.displayName}</Link></h2><p className="muted">{offer.type === "PESSOA_FISICA" ? "Pessoa física" : "Pessoa jurídica"} · {offer.yearsExperience} {offer.yearsExperience === 1 ? "ano" : "anos"} de experiência</p><p className="muted">{location(offer)}</p><p className="muted">{reputation(offer.rating, offer.reviewCount)}</p></div></div>
    <div className="provider-offer"><p className="eyebrow">{offer.serviceName}</p><h3>{offer.title}</h3><p className="result-description">{offer.description}</p></div>
    <div className="provider-actions"><strong>{price(offer)}</strong><span className="muted">{deadline(offer)}</span><Link href={`/prestadores/${offer.slug}`} className="button">Ver perfil</Link><CompareButton offerId={offer.id} providerId={offer.providerId}/></div>
  </article>;
}
