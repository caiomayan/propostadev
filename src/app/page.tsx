import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { db } from "@/lib/db";
import { categories, serviceTypes } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export default async function Home() {
  const catalog = await db.select({ id: serviceTypes.id, name: serviceTypes.name, slug: serviceTypes.slug, category: categories.name, categoryId: categories.id }).from(serviceTypes).innerJoin(categories, eq(serviceTypes.categoryId, categories.id)).where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(asc(categories.name), asc(serviceTypes.name));
  const groups = [...new Set(catalog.map(item => item.category))];
  return <div className="container"><section className="hero"><p className="eyebrow">Diretório de desenvolvimento</p><h1>Encontre quem desenvolve sua próxima ideia</h1><p>Explore serviços, entenda preços e prazos anunciados e encontre o prestador que faz sentido para o seu projeto.</p><form action="/buscar" className="search-bar"><label htmlFor="home-search" className="sr-only">Qual serviço você procura?</label><Input id="home-search" name="q" maxLength={120} placeholder="Busque um serviço ou desenvolvedor"/><Button className="button" type="submit"><Search aria-hidden="true" size={18}/>Buscar serviços</Button></form></section><section className="section"><div className="catalog-heading"><h2>Comece pelo que você precisa</h2><Link href="/buscar" className="inline">Explorar todos os serviços <ArrowRight size={16} aria-hidden="true"/></Link></div>{groups.length ? <div className="catalog-grid">{groups.map(group => <div key={group} className="catalog-group"><h3>{group}</h3>{catalog.filter(item => item.category === group).map(item => <Link className="catalog-link" key={item.id} href={`/buscar?tipo=${item.slug}`}><span>{item.name}</span><ArrowRight aria-hidden="true"/></Link>)}</div>)}</div> : <div className="empty"><h3>O catálogo ainda está sendo preparado</h3><p>Os tipos de serviço aparecerão aqui quando forem disponibilizados.</p></div>}</section><section className="explanation"><div><h3>Preços com contexto</h3><p>Valor fixo, faixa, por hora ou sob consulta: cada oferta informa seu modelo. Compare serviços semelhantes e confirme o escopo diretamente com o prestador.</p></div><div><h3>Contato direto, escolha sua</h3><p>Veja a experiência declarada e as avaliações de usuários. A plataforma ajuda na descoberta; a conversa e a negociação acontecem fora daqui.</p></div></section><section className="provider-invite"><div><h2>Seu trabalho merece ser encontrado.</h2><p>Crie seu perfil e apresente seus serviços com preços e prazos claros.</p></div><Link href="/painel/perfil" className="button">Oferecer meus serviços <ArrowRight size={18} aria-hidden="true"/></Link></section></div>;
}

