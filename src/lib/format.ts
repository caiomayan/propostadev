import type { Offer } from "@/lib/db/schema";

export function money(value: string | number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}
export const formatMoney = money;
export function price(offer: Pick<Offer, "priceType" | "priceMin" | "priceMax">) {
  switch (offer.priceType) {
    case "SOB_CONSULTA": return "Sob consulta";
    case "POR_HORA": return `${money(offer.priceMin)}/hora`;
    case "A_PARTIR_DE": return `A partir de ${money(offer.priceMin)}`;
    case "INTERVALO": return `${money(offer.priceMin)} a ${money(offer.priceMax)}`;
    default: return money(offer.priceMin);
  }
}
export function deadline(offer: Pick<Offer, "deadlineType" | "deadlineMinDays" | "deadlineMaxDays">) {
  switch (offer.deadlineType) {
    case "A_COMBINAR": return "Prazo a combinar";
    case "A_PARTIR_DE": return `A partir de ${offer.deadlineMinDays} dias`;
    case "INTERVALO": return `${offer.deadlineMinDays} a ${offer.deadlineMaxDays} dias`;
    default: return `${offer.deadlineMinDays} ${offer.deadlineMinDays === 1 ? "dia" : "dias"}`;
  }
}
export const formatPrice = price;
export const formatDeadline = deadline;
export function location(provider: { city: string | null; state: string | null; country: string }) {
  return [provider.city, provider.state, provider.country !== "BR" ? provider.country : null].filter(Boolean).join(", ") || "Localização não informada";
}
export function reputation(rating: string | null, count: number) {
  return count ? `${Number(rating).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5 · ${count} ${count === 1 ? "avaliação" : "avaliações"}` : "Ainda não recebeu avaliações";
}
export const priceLabels = { FIXO: "Preço fixo", A_PARTIR_DE: "A partir de", INTERVALO: "Faixa de preço", POR_HORA: "Por hora", SOB_CONSULTA: "Sob consulta" };
