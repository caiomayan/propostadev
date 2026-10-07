import Link from "next/link";
import { ProviderCard } from "@/components/provider-card";
import { PriceFilters } from "@/components/provider-price-filters";
import { FilterPanel } from "@/components/provider-filter-panel";
import { getCatalog, getPriceAverage } from "@/modules/catalog/queries";
import { searchProviders } from "@/modules/search/queries";
import { searchSchema } from "@/modules/search/validation";
import { money, priceLabels } from "@/lib/format";
import "./public.css";

type Params = Record<string, string | string[] | undefined>;
export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const raw = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]).filter(([, value]) => value !== "" && value !== undefined));
  const parsed = searchSchema.safeParse(raw);
  const input = parsed.success ? parsed.data : searchSchema.parse({ q: typeof raw.q === "string" ? raw.q.slice(0, 120) : "" });
  const [catalog, search, average] = await Promise.all([getCatalog(), searchProviders(input), input.tipo ? getPriceAverage(input.tipo) : Promise.resolve(null)]);
  const selectedType = catalog.types.find((type) => type.slug === input.tipo);
  const selectedCategory = catalog.categories.find((category) => category.slug === input.categoria);
  const pages = Math.min(1000, Math.ceil(search.total / 12));
  const href = (page: number) => { const query = new URLSearchParams(); for (const [key, value] of Object.entries(input)) if (value !== undefined && value !== "" && key !== "pagina") query.set(key, String(value)); query.set("pagina", String(page)); return `/buscar?${query}`; };
  const activeFilters = [input.q && `Busca: ${input.q}`, selectedCategory?.name, selectedType?.name, input.pessoa && (input.pessoa === "PESSOA_FISICA" ? "Pessoa física" : "Pessoa jurídica"), input.experiencia_min !== undefined && `Experiência: ${input.experiencia_min}+ anos`, input.nota_min && `Nota: ${input.nota_min}+`, input.modelo_preco && priceLabels[input.modelo_preco], input.preco_min && `Mínimo: ${money(input.preco_min)}`, input.preco_max && `Máximo: ${money(input.preco_max)}`, input.prazo_ate && `Até ${input.prazo_ate} dias`].filter(Boolean);
  return <section className="container section"><div className="page-heading"><p className="eyebrow">Diretório de serviços</p><h1>Encontre seu próximo desenvolvedor</h1><p className="muted">Compare serviços anunciados e converse diretamente com quem desenvolve.</p></div>
    {!parsed.success && <div role="alert" className="panel filter-error"><p>Alguns filtros são inválidos. Ajuste os campos e busque novamente. Apenas o texto da busca foi mantido nos resultados.</p><ul>{parsed.error.issues.map((issue, index) => <li key={index}>{issue.path.join(".")}: {issue.message}</li>)}</ul></div>}
    <div className="search-layout"><FilterPanel><form action="/buscar" method="get"><div className="filter-fields">
      <label>O que você precisa?<input name="q" maxLength={120} defaultValue={input.q} placeholder="Serviço, tecnologia ou nome"/></label>
      <label>Categoria<select name="categoria" defaultValue={input.categoria ?? ""}><option value="">Todas as categorias</option>{catalog.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
      <label>Tipo de serviço<select name="tipo" defaultValue={input.tipo ?? ""}><option value="">Todos os serviços</option>{catalog.types.map((type) => <option key={type.id} value={type.slug}>{type.name}</option>)}</select></label>
      <label>Prestador<select name="pessoa" defaultValue={input.pessoa ?? ""}><option value="">Pessoa física ou jurídica</option><option value="PESSOA_FISICA">Pessoa física</option><option value="PESSOA_JURIDICA">Pessoa jurídica</option></select></label>
      <label>Experiência mínima (anos)<input name="experiencia_min" type="number" min={0} max={80} defaultValue={input.experiencia_min}/></label>
      <label>Avaliação mínima<select name="nota_min" defaultValue={input.nota_min ?? ""}><option value="">Qualquer avaliação</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} de 5 ou mais</option>)}</select></label>
      <PriceFilters key={input.modelo_preco ?? "any"} model={input.modelo_preco} min={input.preco_min} max={input.preco_max}/>
      <label>Prazo estimado de até (dias)<input name="prazo_ate" type="number" min={1} max={3650} defaultValue={input.prazo_ate}/></label><p className="muted">Inclui prazos fixos e intervalos com limite superior. Prazos a combinar e “a partir de” ficam de fora.</p>
      <label>Ordenar por<select name="ordenar" defaultValue={input.ordenar}><option value="nome">Nome</option><option value="nota">Melhor avaliação</option><option value="experiencia">Maior experiência</option><option value="preco">Menor preço anunciado</option></select></label>
      <button className="button">Buscar serviços</button><Link href="/buscar" className="button secondary">Limpar filtros</Link>
    </div></form></FilterPanel><div className="search-main">
      <div className="search-count"><h2>{search.total} {search.total === 1 ? "prestador encontrado" : "prestadores encontrados"}</h2><span className="muted">Uma oferta por prestador · outras no perfil</span></div>
      {activeFilters.length > 0 && <div className="active-filters" aria-label="Filtros ativos">{activeFilters.map((filter, index) => <span className="badge" key={index}>{filter}</span>)}</div>}
      {selectedType && average && <aside className="price-statistic"><p className="eyebrow">Neste tipo de serviço · {selectedType.name}</p>{average.average ? <><strong>{money(average.average)}</strong><p>Média dos preços fixos anunciados; não é orçamento.</p><p className="muted">{average.count} prestadores na amostra. Este indicador considera todas as ofertas elegíveis do tipo, independentemente dos demais filtros.</p></> : <><p>Dados insuficientes para calcular uma média.</p><p className="muted">{average.count} de pelo menos 3 prestadores com preços fixos elegíveis.</p></>}</aside>}
      {search.results.length ? <div className="result-list">{search.results.map((offer) => <ProviderCard key={offer.providerId} offer={offer}/>)}</div> : <div className="empty panel"><h2>{search.total > 0 ? "Esta página não tem resultados" : "Nenhum prestador encontrado"}</h2><p className="muted">{search.total > 0 ? "Volte para uma página disponível para ver os prestadores." : "Tente outro termo ou remova alguns filtros para ampliar sua busca."}</p><Link className="button secondary" href={search.total > 0 ? href(1) : "/buscar"}>{search.total > 0 ? "Voltar à primeira página" : "Remover filtros"}</Link></div>}
      {pages > 1 && <nav className="pagination" aria-label="Paginação da busca">{input.pagina > 1 ? <Link className="button secondary" href={href(input.pagina - 1)}>Anterior</Link> : <span/>}<span className="muted">Página {input.pagina} de {pages}</span>{input.pagina < pages ? <Link className="button secondary" href={href(input.pagina + 1)}>Próxima</Link> : <span/>}</nav>}
    </div></div>
  </section>;
}
