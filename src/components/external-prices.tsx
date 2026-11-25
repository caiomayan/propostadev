import { money } from "@/lib/format";
import type { ExternalPrice } from "@/modules/external-prices/queries";

const dateLabel = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(date);

/** Preço de mercado externo: uma linha por fonte, separado do Preço de referência (que nunca o inclui). */
export function ExternalPrices({ prices, serviceName, headingId = "preco-externo", level = 3 }: { prices: ExternalPrice[]; serviceName: string; headingId?: string; level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  return <section className="external-prices stack" aria-labelledby={headingId}>
    <div><p className="eyebrow">Preço de mercado externo</p><Heading id={headingId}>Quanto cobram fora da plataforma: {serviceName}</Heading></div>
    {prices.length ? <>
      <ul className="external-price-list">{prices.map((price) => <li key={price.sourceUrl}>
        <strong>{money(price.min)} – {money(price.max)}</strong>
        <span><a href={price.sourceUrl} target="_blank" rel="noopener noreferrer">{price.sourceName}<span className="sr-only"> (abre em nova aba)</span></a> · coletado em <time dateTime={price.collectedAt.toISOString()}>{dateLabel(price.collectedAt)}</time></span>
        {price.excerpt && <q>{price.excerpt}</q>}
      </li>)}</ul>
      <p className="muted external-price-note">Preço fora da plataforma; não entra no Preço de referência.</p>
    </> : <p className="muted">Ainda não há preço externo para este Tipo de serviço.</p>}
  </section>;
}
