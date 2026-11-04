import Link from "next/link";
import { ProviderAvatar } from "@/components/provider-avatar";
import { deadline, location, price } from "@/lib/format";
import { Reputation } from "@/components/reputation";
import type { CompatibleProvider } from "@/modules/triage/queries";

export function CompatibleCard({ provider, action }: { provider: CompatibleProvider; action?: React.ReactNode }) {
  const reasons = [
    provider.cabeOrcamento ? "Dentro do orçamento" : null,
    provider.cabePrazo ? "Prazo compatível" : null,
    provider.verificadas > 0 ? `${provider.verificadas} ${provider.verificadas === 1 ? "avaliação verificada" : "avaliações verificadas"}` : null,
  ].filter((reason): reason is string => Boolean(reason));
  return <article className="compatible-card">
    <div className="provider-identity"><ProviderAvatar name={provider.displayName} photoUrl={provider.photoUrl}/><div><h3><Link href={`/prestadores/${provider.slug}`}>{provider.displayName}</Link></h3><p className="muted">{provider.type === "PESSOA_FISICA" ? "Pessoa física" : "Pessoa jurídica"} · {provider.yearsExperience} {provider.yearsExperience === 1 ? "ano" : "anos"} de experiência</p><p className="muted">{location(provider)}</p><p className="muted"><Reputation rating={provider.rating} count={provider.reviewCount}/></p></div></div>
    <div className="compatible-offer"><p className="eyebrow">{provider.offerTitle}</p><p><strong>{price({ priceType: provider.priceType, priceMin: provider.priceMin, priceMax: provider.priceMax })}</strong></p><p className="muted">{deadline({ deadlineType: provider.deadlineType, deadlineMinDays: provider.deadlineMinDays, deadlineMaxDays: provider.deadlineMaxDays })}</p></div>
    <div className="compatible-reasons"><ul className="chips" aria-label={`Motivos da compatibilidade de ${provider.displayName}`}>{reasons.length ? reasons.map((reason) => <li key={reason} className="chip">{reason}</li>) : <li className="chip neutral">Oferece este serviço</li>}</ul><div className="actions"><Link href={`/prestadores/${provider.slug}`} className="button secondary">Ver perfil</Link>{action}</div></div>
  </article>;
}
