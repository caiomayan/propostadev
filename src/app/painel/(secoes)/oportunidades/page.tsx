import Form from "next/form";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ReferenceBlock } from "@/components/proposals/reference-block";
import { SortLinks } from "@/components/sort-links";
import { requirePrestador } from "@/lib/auth/session";
import { applySort, opportunitySorts, sortOptions } from "@/lib/list-sorts";
import { listOpportunities } from "@/modules/proposals/queries";
import { budgetLabel, dateLabel, desiredDeadlineLabel } from "@/modules/triage/labels";
import { precoReferencia } from "@/modules/triage/queries";
import { filterLabels, parseOpportunityFilters, type OpportunityFilters } from "@/modules/proposals/filters";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Oportunidades" };
const statusLabel = { ENVIADA: "Proposta enviada", PRE_SELECIONADA: "Pré-selecionada", RECUSADA: "Recusada", ACEITA: "Aceita", RETIRADA: "Retirada" } as const;

const situationLabels = { convidado: "Convidado", sem_proposta: "Sem proposta minha", enviada: "Já enviei proposta" } as const;
const basePath = "/painel/oportunidades";

/** Endereço da página com os filtros já validados (nunca a entrada crua) e, se houver, a ordem. */
function hrefWith(filters: OpportunityFilters, ordem?: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) query.set(key, String(value));
  if (ordem) query.set("ordem", ordem);
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePrestador();
  const params = await searchParams;
  const parsed = parseOpportunityFilters(params);
  const { standing, items: listed, types, ignored: outsideTypes } = await listOpportunities(session.user.id, parsed.filters);
  if (standing.state !== "ok") {
    const text = {
      "sem-perfil": ["Crie seu perfil para ver oportunidades", "Projetos abertos aparecem aqui quando você tem um perfil ativo e uma oferta ativa no mesmo tipo de serviço.", "/painel/perfil", "Criar meu perfil"],
      inativo: ["Reative seu perfil para ver oportunidades", "Seu perfil está desativado. Reative-o para voltar a ver projetos abertos e enviar propostas.", "/painel/perfil", "Abrir meu perfil"],
      "sem-oferta": ["Publique uma oferta para ver oportunidades", "Você vê os projetos abertos dos tipos de serviço em que tem uma oferta ativa. Publique uma oferta para começar.", "/painel/ofertas/nova", "Criar oferta"],
    }[standing.state];
    return <section className="stack"><div className="page-heading"><h1>Oportunidades</h1></div><div className="empty"><h2>{text[0]}</h2><p>{text[1]}</p><Link className="button" href={text[2]}>{text[3]}</Link></div></section>;
  }
  const ignored = [...new Set([...parsed.ignored, ...outsideTypes])];
  const filters: OpportunityFilters = outsideTypes.includes("tipo") ? { ...parsed.filters, tipo: undefined } : parsed.filters;
  if (filters.tipo === undefined) delete filters.tipo;
  const ordem = Array.isArray(params.ordem) ? params.ordem[0] : params.ordem;
  const { items, current, isDefault } = applySort(opportunitySorts, ordem, listed);
  const typeName = types.find((type) => type.slug === filters.tipo)?.name;
  const activeFilters = [filters.q && `Busca: ${filters.q}`, typeName && `Tipo: ${typeName}`, filters.orcamento_min && `Orçamento a partir de ${money(filters.orcamento_min)}`, filters.prazo_ate && `Prazo de até ${filters.prazo_ate} ${filters.prazo_ate === 1 ? "dia" : "dias"}`, filters.situacao && situationLabels[filters.situacao]].filter(Boolean);
  const filtered = activeFilters.length > 0;
  const references = new Map(await Promise.all([...new Set(items.map((item) => item.serviceTypeId))].map(async (id) => [id, await precoReferencia(id)] as const)));
  return <section className="stack">
    <div className="page-heading"><h1>Oportunidades</h1><p>Projetos abertos nos tipos de serviço em que você tem oferta ativa.{isDefault && " Os convites vêm primeiro."}</p></div>
    {ignored.length > 0 && <div role="alert" className="panel filter-error"><p>Ignoramos {ignored.length === 1 ? "um filtro inválido" : "filtros inválidos"}: {ignored.map((key) => filterLabels[key]).join(", ")}. Os demais continuam valendo.</p></div>}
    <Form action={basePath} className="opportunity-filters" aria-label="Filtros de oportunidades">
      <details open={filtered || ignored.length > 0}><summary>Filtrar oportunidades{filtered && <span className="chip">{activeFilters.length} {activeFilters.length === 1 ? "ativo" : "ativos"}</span>}</summary>
        <div className="opportunity-filter-fields">
          <label className="field">Buscar no título e na descrição<input name="q" type="search" maxLength={120} defaultValue={filters.q ?? ""} placeholder="Ex.: loja, agenda, café"/></label>
          {types.length > 1 && <label className="field">Tipo de serviço<select name="tipo" defaultValue={filters.tipo ?? ""}><option value="">Todos os meus tipos</option>{types.map((type) => <option key={type.slug} value={type.slug}>{type.name}</option>)}</select></label>}
          <label className="field">Orçamento a partir de (R$)<input name="orcamento_min" type="number" inputMode="decimal" min={1} step="any" defaultValue={filters.orcamento_min ?? ""} aria-describedby="hint-orcamento"/><small id="hint-orcamento">Projetos com orçamento “ainda não sei” continuam na lista.</small></label>
          <label className="field">Prazo desejado de até (dias)<input name="prazo_ate" type="number" inputMode="numeric" min={1} max={3650} step={1} defaultValue={filters.prazo_ate ?? ""} aria-describedby="hint-prazo"/><small id="hint-prazo">Projetos sem prazo desejado ficam de fora.</small></label>
          <label className="field">Situação<select name="situacao" defaultValue={filters.situacao ?? ""}><option value="">Todas</option>{Object.entries(situationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        {!isDefault && <input type="hidden" name="ordem" value={current}/>}
        <div className="opportunity-filter-actions"><button className="button" type="submit">Aplicar filtros</button>{filtered && <Link className="button secondary" href={hrefWith({}, isDefault ? undefined : current)}>Limpar filtros</Link>}</div>
      </details>
    </Form>
    <div className="opportunity-count"><p role="status"><strong>{items.length}</strong> {items.length === 1 ? "oportunidade" : "oportunidades"}{filtered && (items.length === 1 ? " encontrada" : " encontradas")}</p>
      {filtered && <ul className="chips-row" aria-label="Filtros ativos">{activeFilters.map((filter) => <li key={String(filter)} className="chip neutral">{filter}</li>)}</ul>}</div>
    {items.length > 1 && <SortLinks name="oportunidades" options={sortOptions(opportunitySorts, current, (value) => hrefWith(filters, value))}/>}
    {items.length === 0 ? (filtered ? <div className="empty"><h2>Nenhuma oportunidade com esses filtros</h2><p>Nenhum projeto aberto atende a todos os filtros ao mesmo tempo. Limpe os filtros ou tente critérios mais amplos.</p><Link className="button" href={hrefWith({}, isDefault ? undefined : current)}>Limpar filtros</Link></div>
      : <div className="empty"><h2>Nenhum projeto aberto agora</h2><p>Quando um Cliente publicar um projeto no seu tipo de serviço, ele aparece aqui.</p></div>)
      : <ul className="project-list">{items.map((item) => <li key={item.id} className="panel stack">
        <div className="opportunity-head"><div><h2><Link href={`/painel/oportunidades/${item.id}`}>{item.title}</Link></h2>
          <p className="project-meta"><span>{item.serviceName}</span><span>Cliente: {item.clientFirstName}</span><span>Publicado em <time dateTime={item.createdAt.toISOString()}>{dateLabel(item.createdAt)}</time></span></p></div>
          <p className="chips-row">{item.invited && <span className="chip">Convite</span>}{filters.orcamento_min && item.budget.tipo === "NAO_SEI" && <span className="chip neutral">Orçamento não informado</span>}{item.proposal && <span className="chip neutral">{statusLabel[item.proposal.status]}</span>}</p></div>
        <dl className="triage-summary"><div><dt>Orçamento</dt><dd>{budgetLabel(item.budget)}</dd></div><div><dt>Prazo desejado</dt><dd>{desiredDeadlineLabel(item.desiredDays)}</dd></div></dl>
        <ReferenceBlock reference={references.get(item.serviceTypeId)!} budget={item.budget} serviceName={item.serviceName}/>
        <div><Link className="button" href={`/painel/oportunidades/${item.id}`}>{item.proposal ? "Ver minha proposta" : "Ver projeto e propor"} <ArrowRight aria-hidden="true"/></Link></div>
      </li>)}</ul>}
  </section>;
}
