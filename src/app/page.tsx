import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import { JourneyStory } from "@/components/home/journey-story";
import { PriceLab, type LabService } from "@/components/home/price-lab";
import { PriceRuler } from "@/components/price-ruler";
import { RollingFigure } from "@/components/rolling-figure";
import { money } from "@/lib/format";
import { getMarket, type MarketService } from "@/modules/triage/market";
import { getGoals } from "@/modules/triage/queries";

export const dynamic = "force-dynamic";

const whole = (value: string | number) => money(value).replace(/,00$/, "");

function ProposalFragment({ name, initials, amount, days, note, picked }: { name: string; initials: string; amount: string; days: string; note: string; picked?: boolean }) {
  return <div className={`mini-proposal${picked ? " picked" : ""}`}><div className="mini-who"><span className="provider-avatar" aria-hidden="true">{initials}</span><strong>{name}</strong></div><dl><div><dt>Valor</dt><dd>{amount}</dd></div><div><dt>Prazo</dt><dd>{days}</dd></div></dl><p>{note}</p></div>;
}

function marketLine(service: MarketService) {
  return service.reference.faixa ? `${whole(service.reference.faixa.min)} a ${whole(service.reference.faixa.max)}` : "Dados insuficientes";
}

export default async function Home() {
  const [market, allGoals] = await Promise.all([getMarket(), getGoals()]);
  const goals = allGoals.slice(0, 4);
  const lab: LabService[] = market.services.flatMap((service) => service.reference.faixa ? [{ slug: service.slug, name: service.name, faixa: service.reference.faixa, media: service.reference.mediaFixos, n: service.reference.n, prices: service.prices }] : []);
  const priced = market.services.filter((service) => service.reference.mediaFixos);
  const example = lab[0];
  const steps = [
    { title: "Veja o preço antes de falar com alguém.", text: "Valor fixo, faixa, por hora ou sob consulta: cada oferta informa seu modelo. Você vê a faixa anunciada, a média e onde o seu orçamento cai.", fragment: <div className="fragment" data-ui>{example ? <PriceRuler data={{ faixa: example.faixa, media: example.media, n: example.n, orcamento: { tipo: "ATE", min: null, max: example.media ?? example.faixa.max }, posicao: "DENTRO" }}/> : <PriceRuler/>}</div> },
    { title: "Receba propostas lado a lado.", text: "Publique o projeto e compare valor, prazo e avaliações de quem respondeu. Quem combina com o seu pedido pode ser convidado.", fragment: <div className="fragment pair" data-ui><ProposalFragment name="Ateliê Código" initials="AC" amount="R$ 1.800" days="15 dias" note="Dentro do seu orçamento"/><ProposalFragment name="Nuvem Sites" initials="NS" amount="R$ 2.150" days="10 dias" note="5 dias antes do desejado" picked/></div> },
    { title: "Aceite uma e os contatos se abrem.", text: "Ao aceitar, vocês recebem o contato um do outro. Pagamento e contrato são combinados entre vocês, fora da plataforma.", fragment: <div className="fragment accepted" data-ui><span className="stamp">Aceita</span><ProposalFragment name="Nuvem Sites" initials="NS" amount="R$ 2.150" days="10 dias" note="contato@nuvemsites.example" picked/></div> },
    { title: "Só quem contratou avalia.", text: "A avaliação verificada só existe depois de uma Proposta aceita. A reputação de cada prestador vem de trabalho combinado aqui.", fragment: <div className="fragment review" data-ui><p className="mini-score">5/5</p><p className="verified-seal"><Check size={14} aria-hidden="true"/> Avaliação verificada</p><p>Entregou antes do prazo e explicou cada decisão.</p></div> },
  ];
  return <div className="home">
    <section className="home-hero"><div className="container">
      <h1 className="hero-title"><span className="line"><span>Descreva o que precisa.</span></span> <span className="line"><span>Veja quanto custa.</span></span></h1>
      <p className="hero-lead">Preços e prazos reais, anunciados por quem desenvolve. Você chega à conversa sabendo quanto o seu projeto costuma custar.</p>
      <div className="hero-board">
        {lab.length > 0 && <PriceLab services={lab}/>}
        <div className="triage-slot on-lime" data-slot="triagem"><h2>O que você precisa?</h2>{goals.length > 0 && <ul className="goal-links">{goals.map((goal) => <li key={goal.slug}><Link href={`/triagem?objetivo=${goal.slug}`}>{goal.label}<ArrowRight aria-hidden="true"/></Link></li>)}</ul>}<Link className="button" href="/triagem">Começar a Triagem <ArrowRight aria-hidden="true"/></Link><p className="slot-secondary">Prefere procurar por conta própria? <Link href="/buscar">Buscar prestadores</Link></p></div>
      </div>
    </div></section>

    {priced.length > 3 && <div className="price-marquee" aria-hidden="true"><div className="marquee-track">{[0, 1].map((copy) => <div key={copy} className="marquee-set">{priced.map((service) => <span key={service.slug}>{service.name} <b>{whole(service.reference.mediaFixos!)}</b></span>)}</div>)}</div></div>}

    <section className="home-story" aria-labelledby="como-funciona"><div className="container">
      <h2 id="como-funciona" className="reveal">Você decide com o preço na mesa.</h2>
      <JourneyStory steps={steps}/>
    </div></section>

    <section className="home-market on-forest" aria-labelledby="mercado"><div className="container">
      <div className="market-heading reveal"><div><h2 id="mercado">Comece pelo que você precisa</h2><p>{market.services.length} tipos de serviço, {market.prestadores} prestadores e {market.ofertas} ofertas ativas agora.</p></div><Link href="/buscar" className="button accent">Explorar todos os serviços <ArrowRight aria-hidden="true"/></Link></div>
      {market.services.length ? <div className="market-board">{market.services.map((service, index) => <details key={service.slug} name="mercado" className="board-row" open={index === 0}>
        <summary><span className="board-name">{service.name}</span><span className="board-category">{service.category}</span><span className="board-range">{marketLine(service)}</span><span className="board-average">{service.reference.mediaFixos ? <RollingFigure value={whole(service.reference.mediaFixos)}/> : "—"}</span><Plus aria-hidden="true"/></summary>
        <div className="board-detail">{service.reference.suficiente ? <PriceRuler data={{ faixa: service.reference.faixa, media: service.reference.mediaFixos, n: service.reference.n }}/> : <p>Só {service.reference.n} {service.reference.n === 1 ? "prestador anuncia" : "prestadores anunciam"} preço por projeto aqui. Precisamos de pelo menos 3 para mostrar uma faixa sem enganar.</p>}
          <div className="actions"><Link className="button accent" href={`/triagem?tipo=${service.slug}`}>Descrever este projeto <ArrowRight aria-hidden="true"/></Link><Link className="button secondary" href={`/buscar?tipo=${service.slug}`}>Ver prestadores</Link></div></div>
      </details>)}</div> : <div className="empty"><h3>O catálogo ainda está sendo preparado</h3><p>Os tipos de serviço aparecerão aqui quando forem disponibilizados.</p></div>}
    </div></section>

    <section className="provider-invite on-lime"><div className="container"><h2 className="reveal">Seu trabalho merece ser encontrado.</h2><div className="invite-foot reveal"><p>Crie seu perfil, apresente seus serviços com preços e prazos claros e responda aos projetos que combinam com você.</p><Link href="/painel/perfil" className="button">Oferecer meus serviços <ArrowRight aria-hidden="true"/></Link></div></div></section>
  </div>;
}
