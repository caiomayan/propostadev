import Link from "next/link";
import { ComparisonHydrator, ComparisonRemove } from "@/components/comparison-selection";
import { getComparison } from "@/modules/search/queries";
import { deadline, location, price, priceLabels, reputation } from "@/lib/format";
import "../buscar/public.css";

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const raw = typeof params.ofertas === "string" ? params.ofertas : params.ofertas?.[0] ?? "";
  const requested = raw.slice(0, 500).split(",").filter(Boolean);
  const { offers, removed } = await getComparison(requested);
  const ids = offers.map((offer) => offer.id);
  return <section className="container section"><ComparisonHydrator ids={ids} hasQuery={params.ofertas !== undefined}/><div className="page-heading"><h1>Compare antes de conversar</h1><p className="muted">Até três prestadores, com o serviço que você selecionou. Preços e prazos são anunciados e precisam ser confirmados no contato.</p></div>
    {removed && <p role="status" className="panel">Algumas ofertas foram removidas da seleção porque estão indisponíveis, repetidas ou excedem o limite de três prestadores.</p>}
    {offers.length === 0 ? <div className="empty panel"><h2>Sua comparação começa na busca</h2><p className="muted">Escolha até três prestadores para conferir serviços, preços, experiência e avaliações lado a lado.</p><Link className="button" href="/buscar">Buscar desenvolvedores</Link></div> : <>
      {offers.length === 1 && <p className="panel">Você selecionou um prestador. <Link href="/buscar">Adicione outro na busca</Link> para comparar.</p>}
      <div className="comparison-scroll" role="region" aria-label="Tabela de comparação" tabIndex={0}><table className="comparison-table"><caption className="muted">Preços de modelos diferentes têm unidades distintas; não indicam qual serviço terá menor custo final.</caption><thead><tr><th scope="col">Informação</th>{offers.map((offer) => <th scope="col" key={offer.id}><Link href={`/prestadores/${offer.slug}`}>{offer.displayName}</Link><p className="muted">{offer.type === "PESSOA_FISICA" ? "Pessoa física" : "Pessoa jurídica"}</p><ComparisonRemove id={offer.id} ids={ids}/></th>)}</tr></thead><tbody>
        <tr><th scope="row">Serviço</th>{offers.map((offer) => <td key={offer.id}><strong>{offer.serviceName}</strong><p>{offer.title}</p></td>)}</tr>
        <tr><th scope="row">Preço anunciado</th>{offers.map((offer) => <td key={offer.id}><strong>{price(offer)}</strong></td>)}</tr>
        <tr><th scope="row">Modelo de cobrança</th>{offers.map((offer) => <td key={offer.id}>{priceLabels[offer.priceType]}<p className="muted">{offer.priceType === "POR_HORA" ? "R$/hora" : offer.priceType === "SOB_CONSULTA" ? "Valor definido no contato" : "R$/projeto"}</p></td>)}</tr>
        <tr><th scope="row">Prazo anunciado</th>{offers.map((offer) => <td key={offer.id}>{deadline(offer)}</td>)}</tr>
        <tr><th scope="row">Experiência</th>{offers.map((offer) => <td key={offer.id}>{offer.yearsExperience} anos <p className="muted">Autodeclarada</p></td>)}</tr>
        <tr><th scope="row">Localização</th>{offers.map((offer) => <td key={offer.id}>{location(offer)}</td>)}</tr>
        <tr><th scope="row">Reputação</th>{offers.map((offer) => <td key={offer.id}>{reputation(offer.rating, offer.reviewCount)}</td>)}</tr>
        <tr><th scope="row">Contato</th>{offers.map((offer) => <td key={offer.id}><Link className="button" href={`/prestadores/${offer.slug}#contato`}>Entrar em contato</Link></td>)}</tr>
      </tbody></table></div><p><Link className="button secondary" href="/buscar">Adicionar ou trocar prestadores</Link></p>
    </>}
  </section>;
}
