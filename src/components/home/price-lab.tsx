"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RollingFigure } from "@/components/rolling-figure";
import { money } from "@/lib/format";
import { posicaoOrcamento, positionSentence, type Range } from "@/modules/triage/position";

export type LabService = { slug: string; name: string; faixa: Range; media: string | null; n: number; prices: number[] };

const STEP = 50;
const scaleEnd = (service: LabService) => Math.ceil((Number(service.faixa.max) * 1.2) / 500) * 500;
const startBudget = (service: LabService) => Math.round(Number(service.media ?? service.faixa.min) / STEP) * STEP;
const whole = (value: number) => money(value).replace(/,00$/, "");

/** A prova da promessa da home: escolha um serviço, arraste o orçamento e veja quem cabe nele, com os preços reais anunciados. */
export function PriceLab({ services }: { services: LabService[] }) {
  const [slug, setSlug] = useState(() => [...services].sort((a, b) => b.prices.length - a.prices.length)[0].slug);
  const service = services.find((item) => item.slug === slug) ?? services[0];
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const budget = budgets[slug] ?? startBudget(service);
  const end = scaleEnd(service);
  // A trilha do range nativo vai do centro do polegar ao centro do polegar; tudo o mais usa a mesma conta.
  const at = (value: number) => `calc(14px + (100% - 28px) * ${Math.min(1, value / end).toFixed(4)})`;
  const position = posicaoOrcamento({ tipo: "ATE", min: null, max: budget.toFixed(2) }, service.faixa);
  const fits = service.prices.filter((price) => price <= budget).length;
  const headline = service.media ?? service.faixa.min;
  const query = new URLSearchParams({ tipo: slug, orcamento: "ATE", max: budget.toFixed(2).replace(".", ","), etapa: "detalhes" });

  return <section className="price-lab on-forest" aria-label="Simule quanto custa um serviço">
    <fieldset className="lab-services"><legend>Quanto custa</legend>
      <div className="lab-chips">{services.map((item) => <label key={item.slug} className="lab-chip"><input type="radio" name="servico-home" value={item.slug} checked={item.slug === slug} onChange={() => setSlug(item.slug)}/><span>{item.name}</span></label>)}</div>
    </fieldset>
    <div className="lab-answer">
      <p className="lab-figure"><RollingFigure value={whole(Number(headline))}/><small>{service.media ? "média dos preços fixos" : "menor preço anunciado"}</small></p>
      <p className="lab-fit" aria-live="polite"><strong>{fits} de {service.prices.length}</strong> <span>prestadores começam em até {whole(budget)}</span></p>
    </div>
    <div className="lab-ruler">
      <div className="lab-track" aria-hidden="true">
        <span className="lab-band" key={slug} style={{ left: at(Number(service.faixa.min)), width: `calc((100% - 28px) * ${((Number(service.faixa.max) - Number(service.faixa.min)) / end).toFixed(4)})` }}/>
        {service.prices.map((price, index) => <span key={`${slug}-${index}`} className={`lab-tick${price <= budget ? " fits" : ""}`} style={{ left: at(price) }}/>)}
        {service.media && <span className="lab-average" style={{ left: at(Number(service.media)) }}/>}
      </div>
      <output className="lab-bubble" style={{ left: `clamp(56px, ${at(budget)}, calc(100% - 56px))` }}>{whole(budget)}</output>
      <input className="lab-range" type="range" min={0} max={end} step={STEP} value={budget} aria-label="Seu orçamento" aria-valuetext={money(budget)} onChange={(event) => setBudgets((current) => ({ ...current, [slug]: Number(event.target.value) }))}/>
    </div>
    <div className="lab-foot">
      <p aria-live="polite">{position === "INDEFINIDO" ? "Arraste para informar o seu orçamento." : positionSentence(position)} Faixa anunciada de {whole(Number(service.faixa.min))} a {whole(Number(service.faixa.max))}.</p>
      <Link className="button accent" href={`/triagem?${query}`}>Ver quem faz por esse valor <ArrowRight aria-hidden="true"/></Link>
    </div>
  </section>;
}
