import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { PriceRuler } from "@/components/price-ruler";
import { CompatibleCard } from "@/components/triage/compatible-card";
import { DetailsForm } from "@/components/triage/details-form";
import { RememberDraft } from "@/components/triage/draft-memory";
import { getSession } from "@/lib/auth/session";
import { getCatalog } from "@/modules/catalog/queries";
import { publishProject } from "@/modules/projects/actions";
import { posicaoOrcamento } from "@/modules/triage/position";
import { budgetLabel, desiredDeadlineLabel } from "@/modules/triage/labels";
import { findServiceType, getGoals, precoReferencia, prestadoresCompativeis, type ServiceTypeSummary } from "@/modules/triage/queries";
import { draftKeys, draftQuery, parseDraft, rawDraft, type Draft, type SearchParams } from "@/modules/triage/validation";
import { money } from "@/lib/format";
import "./triagem.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Triagem do projeto", description: "Descreva o que você precisa, veja o preço de referência e os prestadores compatíveis." };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
// Redirects de login carregam a Triagem inteira na URL; acima disso o rascunho segue pelo navegador.
const MAX_NEXT_LENGTH = 6000;

export default async function TriagePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = rawDraft(params);
  const goalSlug = one(params.objetivo);
  const serviceType = await findServiceType(raw.tipo);
  if (!serviceType) return <TypeStep goalSlug={goalSlug} listAll={one(params.etapa) === "tipo"} />;
  const touched = draftKeys.some((key) => key !== "tipo" && raw[key] !== "");
  const parsed = parseDraft(params);
  if (!parsed.ok || one(params.etapa) === "detalhes") return <DetailsStep serviceType={serviceType} goalSlug={goalSlug} raw={raw} errors={!parsed.ok && touched ? parsed.errors : {}} />;
  return <ResultStep serviceType={serviceType} draft={parsed.draft} goalSlug={goalSlug} />;
}

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Objetivo", "Detalhes", "Resultado"];
  return <ol className="triage-steps" aria-label="Etapas da Triagem">{steps.map((label, index) => <li key={label} aria-current={current === index + 1 ? "step" : undefined} className={current > index + 1 ? "done" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}</ol>;
}

async function TypeStep({ goalSlug, listAll }: { goalSlug: string; listAll: boolean }) {
  const goals = await getGoals();
  const goal = goals.find((item) => item.slug === goalSlug);
  if (goal) return <div className="container triage stack">
    <Steps current={1}/>
    <header className="page-heading"><p className="eyebrow">Você escolheu</p><h1>{goal.label}</h1><p>Estes tipos de serviço costumam resolver isso. Escolha o que mais se parece com o seu caso.</p></header>
    <ul className="triage-cards">{goal.services.map((service) => <li key={service.slug}><Link className="triage-card" href={`/triagem?${new URLSearchParams({ objetivo: goal.slug, tipo: service.slug })}`}><strong>{service.name}</strong>{service.description && <span>{service.description}</span>}<ArrowRight aria-hidden="true"/></Link></li>)}</ul>
    <p><Link href="/triagem" className="inline"><ArrowLeft size={16} aria-hidden="true"/> Voltar aos objetivos</Link></p>
  </div>;
  if (listAll) {
    const catalog = await getCatalog();
    return <div className="container triage stack">
      <Steps current={1}/>
      <header className="page-heading"><h1>Escolha o tipo de serviço</h1><p>Se você já sabe o que precisa, vá direto ao ponto.</p></header>
      {catalog.categories.map((category) => <section key={category.id} className="stack" aria-labelledby={`cat-${category.slug}`}><h2 id={`cat-${category.slug}`}>{category.name}</h2><ul className="triage-cards">{catalog.types.filter((type) => type.categoryId === category.id).map((type) => <li key={type.slug}><Link className="triage-card" href={`/triagem?${new URLSearchParams({ tipo: type.slug })}`}><strong>{type.name}</strong>{type.description && <span>{type.description}</span>}<ArrowRight aria-hidden="true"/></Link></li>)}</ul></section>)}
      <p><Link href="/triagem" className="inline"><ArrowLeft size={16} aria-hidden="true"/> Voltar aos objetivos</Link></p>
    </div>;
  }
  return <div className="container triage stack">
    <Steps current={1}/>
    <header className="page-heading"><h1>O que você precisa?</h1><p>Escolha o objetivo que mais se parece com o seu. Depois você vê quanto costuma custar e quem pode ajudar.</p></header>
    <ul className="triage-cards">{goals.map((item) => <li key={item.slug}><Link className="triage-card" href={`/triagem?${new URLSearchParams({ objetivo: item.slug })}`}><strong>{item.label}</strong>{item.hint && <span>{item.hint}</span>}<ArrowRight aria-hidden="true"/></Link></li>)}
      <li><Link className="triage-card known" href="/triagem?etapa=tipo"><strong>Já sei o que preciso</strong><span>Escolher o tipo de serviço direto</span><ArrowRight aria-hidden="true"/></Link></li></ul>
  </div>;
}

function DetailsStep({ serviceType, goalSlug, raw, errors }: { serviceType: ServiceTypeSummary; goalSlug: string; raw: ReturnType<typeof rawDraft>; errors: Record<string, string> }) {
  const back = goalSlug ? `/triagem?${new URLSearchParams({ objetivo: goalSlug })}` : "/triagem?etapa=tipo";
  return <div className="container triage stack">
    <Steps current={2}/>
    <header className="page-heading"><p className="eyebrow">Tipo de serviço: {serviceType.name}</p><h1>Conte sobre o seu projeto</h1><p>Com título, orçamento e prazo, mostramos onde você está em relação ao mercado e quem é compatível.</p></header>
    {Object.keys(errors).length > 0 && <div role="alert" className="form-error panel"><strong>Revise os campos abaixo.</strong></div>}
    <DetailsForm tipo={serviceType.slug} objetivo={goalSlug || undefined} values={raw} errors={errors}/>
    <p><Link href={back} className="inline"><ArrowLeft size={16} aria-hidden="true"/> Trocar o tipo de serviço</Link></p>
  </div>;
}

async function ResultStep({ serviceType, draft, goalSlug }: { serviceType: ServiceTypeSummary; draft: Draft; goalSlug: string }) {
  const [reference, providers, session] = await Promise.all([
    precoReferencia(serviceType.id),
    prestadoresCompativeis({ tipoServicoId: serviceType.id, orcamento: draft.orcamento, prazoDias: draft.prazoDias }),
    getSession(),
  ]);
  const position = posicaoOrcamento(draft.orcamento, reference.faixa);
  const query = draftQuery(draft, goalSlug ? { objetivo: goalSlug } : {});
  return <div className="container triage stack">
    <Steps current={3}/>
    <RememberDraft query={query}/>
    <header className="page-heading"><p className="eyebrow">Tipo de serviço: {serviceType.name}</p><h1>{draft.titulo}</h1>
      <dl className="triage-summary"><div><dt>Orçamento</dt><dd>{budgetLabel(draft.orcamento)}</dd></div><div><dt>Prazo desejado</dt><dd>{desiredDeadlineLabel(draft.prazoDias)}</dd></div></dl>
      <Link href={`/triagem?${draftQuery(draft, { ...(goalSlug ? { objetivo: goalSlug } : {}), etapa: "detalhes" })}`} className="inline"><Pencil size={16} aria-hidden="true"/> Editar detalhes</Link></header>

    <section className="panel stack" aria-labelledby="referencia">
      <div><p className="eyebrow">Preço de referência</p><h2 id="referencia">Quanto costuma custar {serviceType.name}</h2></div>
      {reference.suficiente ? <>
        {reference.mediaFixos && <p className="reference-average"><span>Média dos preços fixos</span><strong>{money(reference.mediaFixos)}</strong><small>{reference.fixosN} prestadores com preço fixo. Não é orçamento.</small></p>}
        <PriceRuler data={{ faixa: reference.faixa, media: reference.mediaFixos, n: reference.n, orcamento: draft.orcamento, posicao: position }}/>
      </> : <div className="insufficient"><strong>Dados insuficientes</strong><p>Só {reference.n} {reference.n === 1 ? "prestador anuncia" : "prestadores anunciam"} preço por projeto neste tipo de serviço. Precisamos de pelo menos 3 para mostrar uma média ou faixa sem enganar. Você ainda pode publicar o projeto e receber propostas.</p></div>}
    </section>

    <section className="stack" aria-labelledby="compativeis">
      <div><p className="eyebrow">Prestadores compatíveis</p><h2 id="compativeis">{providers.length ? `${providers.length} ${providers.length === 1 ? "prestador oferece" : "prestadores oferecem"} ${serviceType.name}` : "Ainda não há prestadores neste tipo"}</h2><p className="muted">Ordenados por orçamento, prazo, avaliações verificadas e nota. Cada card mostra o motivo.</p></div>
      {providers.length ? <div className="stack compatible-list">{providers.map((provider) => <CompatibleCard key={provider.providerId} provider={provider}/>)}</div> : <div className="empty"><h3>Nenhum prestador com oferta ativa agora</h3><p>Publique o projeto: quando alguém passar a oferecer este serviço, ele poderá ver o seu pedido.</p></div>}
    </section>

    <section className="panel tone stack" aria-labelledby="publicar">
      <h2 id="publicar">Publicar o projeto</h2>
      <PublishPanel session={session} draft={draft} query={query} goalSlug={goalSlug}/>
    </section>
  </div>;
}

function PublishPanel({ session, draft, query, goalSlug }: { session: Awaited<ReturnType<typeof getSession>>; draft: Draft; query: string; goalSlug: string }) {
  if (!session) {
    const next = encodeURIComponent(`/triagem?${query}`);
    const withNext = next.length <= MAX_NEXT_LENGTH;
    const suffix = withNext ? `?next=${next}` : "";
    return <>
      <p>Entre ou crie uma conta de Cliente para publicar. Seu rascunho é mantido.</p>
      <div className="actions"><Link className="button" href={`/entrar${suffix}`}>Entrar para publicar</Link><Link className="button secondary" href={`/cadastro${suffix}`}>Criar conta de Cliente</Link></div>
    </>;
  }
  const type = session.user.accountType;
  if (type === "PRESTADOR") return <p>Contas de Prestador não publicam projetos: esta Triagem serve para Clientes. Você pode usar o resultado para entender o mercado e ajustar suas ofertas.</p>;
  if (type !== "CLIENTE") return <><p>Escolha o tipo da sua conta para publicar.</p><Link className="button" href="/boas-vindas">Escolher tipo de conta</Link></>;
  return <>
    <p>O projeto fica aberto e aparece em “Meus projetos”. Você poderá cancelá-lo enquanto estiver aberto.</p>
    <ActionForm action={publishProject} label="Publicar projeto">
      <input type="hidden" name="tipo" value={draft.tipo}/><input type="hidden" name="titulo" value={draft.titulo}/><input type="hidden" name="descricao" value={draft.descricao}/>
      <input type="hidden" name="orcamento" value={draft.orcamento.tipo}/>{draft.orcamento.min && <input type="hidden" name="min" value={draft.orcamento.min}/>}{draft.orcamento.max && <input type="hidden" name="max" value={draft.orcamento.max}/>}
      {draft.prazoDias === null ? <input type="hidden" name="flexivel" value="1"/> : <input type="hidden" name="prazo" value={draft.prazoDias}/>}
      {goalSlug && <input type="hidden" name="objetivo" value={goalSlug}/>}
    </ActionForm>
  </>;
}
