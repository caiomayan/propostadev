"use client";
import Form from "next/form";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PriceRuler } from "@/components/price-ruler";
import { posicaoOrcamento, type Range } from "@/modules/triage/position";
import { normalizeMoney, type Budget, type BudgetKind } from "@/modules/triage/validation";

type Values = { titulo: string; descricao: string; orcamento: string; min: string; max: string; prazo: string; flexivel: string };

const budgetOptions: { value: BudgetKind; label: string; hint: string }[] = [
  { value: "FAIXA", label: "Uma faixa", hint: "Do menos ao mais que posso investir" },
  { value: "ATE", label: "Um teto", hint: "O máximo que posso investir" },
  { value: "NAO_SEI", label: "Ainda não sei", hint: "Quero ver quanto costuma custar" },
];

/** Etapa "Detalhes": GET para /triagem, então o estado inteiro vive na URL e o servidor valida. */
export function DetailsForm({ tipo, objetivo, values, errors, serviceName, reference }: { tipo: string; objetivo?: string; values: Values; errors: Record<string, string>; serviceName: string; reference: { faixa: Range | null; media: string | null; n: number } }) {
  const [budget, setBudget] = useState(values.orcamento);
  const [flexible, setFlexible] = useState(values.flexivel === "1");
  const [low, setLow] = useState(values.min);
  const [high, setHigh] = useState(values.max);
  const lowValue = normalizeMoney(low), highValue = normalizeMoney(high);
  // A régua acompanha a digitação; a validação continua sendo a do servidor, ao enviar.
  const liveBudget: Budget | undefined = budget === "ATE" && highValue ? { tipo: "ATE", min: null, max: highValue } : budget === "FAIXA" && lowValue && highValue && Number(highValue) >= Number(lowValue) ? { tipo: "FAIXA", min: lowValue, max: highValue } : budget === "NAO_SEI" ? { tipo: "NAO_SEI", min: null, max: null } : undefined;
  const error = (name: string) => errors[name] ? <p className="field-error" id={`erro-${name}`} role="alert">{errors[name]}</p> : null;
  const describedBy = (name: string) => errors[name] ? `erro-${name}` : undefined;
  return <div className="triage-details"><Form action="/triagem" className="stack triage-form" noValidate={false}>
    <input type="hidden" name="tipo" value={tipo}/>
    {objetivo && <input type="hidden" name="objetivo" value={objetivo}/>}
    <div className="field"><label htmlFor="titulo">Título do projeto</label><input id="titulo" name="titulo" required minLength={5} maxLength={120} defaultValue={values.titulo} placeholder="Ex.: Loja virtual para minha confeitaria" aria-invalid={Boolean(errors.titulo)} aria-describedby={describedBy("titulo")}/>{error("titulo")}</div>
    <div className="field"><label htmlFor="descricao">Descreva o que você precisa</label><textarea id="descricao" name="descricao" required minLength={30} maxLength={2000} defaultValue={values.descricao} aria-invalid={Boolean(errors.descricao)} aria-describedby={`${describedBy("descricao") ?? ""} descricao-dica`.trim()}/><small id="descricao-dica">De 30 a 2.000 caracteres. Conte o objetivo, o que já existe e o que é essencial.</small>{error("descricao")}</div>
    <fieldset className="triage-fieldset"><legend>Quanto você pretende investir?</legend>
      <div className="choice-row">{budgetOptions.map((option) => <label key={option.value} className="choice"><input type="radio" name="orcamento" value={option.value} checked={budget === option.value} onChange={() => setBudget(option.value)} required/><span><strong>{option.label}</strong><small>{option.hint}</small></span></label>)}</div>
      {error("orcamento")}
      {budget === "FAIXA" && <div className="form-grid"><div className="field"><label htmlFor="min">Valor mínimo (R$)</label><input id="min" name="min" inputMode="decimal" required value={low} onChange={(event) => setLow(event.target.value)} placeholder="1500,00" aria-invalid={Boolean(errors.min)} aria-describedby={describedBy("min")}/>{error("min")}</div><div className="field"><label htmlFor="max">Valor máximo (R$)</label><input id="max" name="max" inputMode="decimal" required value={high} onChange={(event) => setHigh(event.target.value)} placeholder="4000,00" aria-invalid={Boolean(errors.max)} aria-describedby={describedBy("max")}/>{error("max")}</div></div>}
      {budget === "ATE" && <div className="field"><label htmlFor="max">Teto do orçamento (R$)</label><input id="max" name="max" inputMode="decimal" required value={high} onChange={(event) => setHigh(event.target.value)} placeholder="4000,00" aria-invalid={Boolean(errors.max)} aria-describedby={describedBy("max")}/>{error("max")}</div>}
    </fieldset>
    <fieldset className="triage-fieldset"><legend>Em quanto tempo você precisa?</legend>
      <div className="field"><label htmlFor="prazo">Prazo desejado (dias)</label><input id="prazo" name="prazo" type="number" inputMode="numeric" min={1} max={3650} step={1} required={!flexible} disabled={flexible} defaultValue={values.prazo} placeholder="30" aria-invalid={Boolean(errors.prazo)} aria-describedby={describedBy("prazo")}/>{error("prazo")}</div>
      <label className="checkbox"><input type="checkbox" name="flexivel" value="1" checked={flexible} onChange={(event) => setFlexible(event.target.checked)}/><span>Meu prazo é flexível</span></label>
    </fieldset>
    <button className="button" type="submit">Ver preço de referência <ArrowRight aria-hidden="true"/></button>
  </Form>
  <aside className="triage-live on-forest" aria-label={`Preço de referência de ${serviceName}`}>
    <h2>{serviceName} no mercado</h2>
    {reference.faixa ? <div aria-live="polite"><PriceRuler data={{ faixa: reference.faixa, media: reference.media, n: reference.n, orcamento: liveBudget, posicao: liveBudget ? posicaoOrcamento(liveBudget, reference.faixa) : undefined }}/></div>
      : <p>Só {reference.n} {reference.n === 1 ? "prestador anuncia" : "prestadores anunciam"} preço por projeto aqui. Você ainda pode publicar e receber propostas.</p>}
  </aside></div>;
}
