import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { categories, serviceTypes } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { PriceRuler } from "@/components/price-ruler";
import { getGoals } from "@/modules/triage/queries";
import "./triagem/triagem.css";

export const dynamic = "force-dynamic";
export default async function Home() {
  const catalog = await db.select({ id: serviceTypes.id, name: serviceTypes.name, slug: serviceTypes.slug, category: categories.name, categoryId: categories.id }).from(serviceTypes).innerJoin(categories, eq(serviceTypes.categoryId, categories.id)).where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(asc(categories.name), asc(serviceTypes.name));
  const goals = (await getGoals()).slice(0, 4);
  const groups = [...new Set(catalog.map(item => item.category))];
  return <div className="container"><section className="hero"><div><h1>Descreva o que você precisa. Veja quanto custa.</h1><p className="hero-lead">Explore serviços de desenvolvimento, entenda preços e prazos anunciados e encontre quem faz sentido para o seu projeto.</p><PriceRuler/></div><div className="triage-slot" data-slot="triagem"><h2>O que você precisa?</h2><p>Escolha um objetivo, veja quanto costuma custar e quais prestadores combinam com o seu projeto.</p>{goals.length > 0 && <ul className="goal-links">{goals.map(goal => <li key={goal.slug}><Link href={`/triagem?objetivo=${goal.slug}`}>{goal.label}<ArrowRight aria-hidden="true"/></Link></li>)}</ul>}<Link className="button" href="/triagem">Começar a Triagem <ArrowRight aria-hidden="true"/></Link><p className="slot-secondary">Prefere procurar por conta própria? <Link href="/buscar">Buscar prestadores</Link></p></div></section><section className="section"><div className="catalog-heading"><h2>Comece pelo que você precisa</h2><Link href="/buscar" className="inline">Explorar todos os serviços <ArrowRight size={16} aria-hidden="true"/></Link></div>{groups.length ? <div className="catalog-grid">{groups.map(group => <div key={group} className="catalog-group"><h3>{group}</h3>{catalog.filter(item => item.category === group).map(item => <Link className="catalog-link" key={item.id} href={`/buscar?tipo=${item.slug}`}><span>{item.name}</span><ArrowRight aria-hidden="true"/></Link>)}</div>)}</div> : <div className="empty"><h3>O catálogo ainda está sendo preparado</h3><p>Os tipos de serviço aparecerão aqui quando forem disponibilizados.</p></div>}</section><section className="explanation"><div><h3>Preços com contexto</h3><p>Valor fixo, faixa, por hora ou sob consulta: cada oferta informa seu modelo. Compare serviços semelhantes e confirme o escopo diretamente com o prestador.</p></div><div><h3>Contato direto, escolha sua</h3><p>Veja a experiência declarada e as avaliações de usuários. A plataforma ajuda na descoberta; a conversa e a negociação acontecem fora daqui.</p></div></section><section className="provider-invite"><div><h2>Seu trabalho merece ser encontrado.</h2><p>Crie seu perfil e apresente seus serviços com preços e prazos claros.</p></div><Link href="/painel/perfil" className="button">Oferecer meus serviços <ArrowRight size={18} aria-hidden="true"/></Link></section></div>;
}

