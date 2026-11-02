import { PriceRuler, type RulerData } from "@/components/price-ruler";
import { posicaoOrcamento } from "@/modules/triage/position";
import type { ReferencePrice } from "@/modules/triage/queries";
import type { Budget } from "@/modules/triage/validation";
import type { Offer } from "@/lib/db/schema";

// Preço por projeto (FIXO, A_PARTIR_DE, INTERVALO) cabe na régua; POR_HORA e SOB_CONSULTA não entram na referência.
export function offerBudget(offer: Pick<Offer, "priceType" | "priceMin" | "priceMax">): Budget | null {
  if (offer.priceType === "INTERVALO" && offer.priceMin && offer.priceMax) return { tipo: "FAIXA", min: offer.priceMin, max: offer.priceMax };
  if ((offer.priceType === "FIXO" || offer.priceType === "A_PARTIR_DE") && offer.priceMin) return { tipo: "FAIXA", min: offer.priceMin, max: offer.priceMin };
  return null;
}

/** Mostra onde o preço da Oferta cai na faixa anunciada do tipo de serviço, com a régua de preço. */
export function OfferPosition({ offer, reference }: { offer: Pick<Offer, "priceType" | "priceMin" | "priceMax">; reference: ReferencePrice }) {
  const budget = offerBudget(offer);
  if (!budget) return <p className="muted offer-position-note">{offer.priceType === "POR_HORA" ? "Preço por hora não entra na faixa de referência, que compara valores por projeto." : "Ofertas sob consulta não aparecem na faixa de referência."}</p>;
  if (!reference.faixa) return <p className="muted offer-position-note">Ainda há poucos prestadores com preço por projeto neste tipo de serviço para mostrar uma faixa de referência.</p>;
  const data: RulerData = { faixa: reference.faixa, media: reference.mediaFixos, n: reference.n, orcamento: budget, posicao: posicaoOrcamento(budget, reference.faixa), sujeito: "preco" };
  return <PriceRuler data={data} />;
}
