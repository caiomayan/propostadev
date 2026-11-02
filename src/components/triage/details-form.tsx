"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { BudgetKind } from "@/modules/triage/validation";

type Values = { titulo: string; descricao: string; orcamento: string; min: string; max: string; prazo: string; flexivel: string };

const budgetOptions: { value: BudgetKind; label: string; hint: string }[] = [
  { value: "FAIXA", label: "Uma faixa", hint: "Do menos ao mais que posso investir" },
  { value: "ATE", label: "Um teto", hint: "O máximo que posso investir" },
  { value: "NAO_SEI", label: "Ainda não sei", hint: "Quero ver quanto costuma custar" },
];

/** Etapa "Detalhes": GET para /triagem, então o estado inteiro vive na URL e o servidor valida. */
export function DetailsForm({ tipo, objetivo, values, errors }: { tipo: string; objetivo?: string; values: Values; errors: Record<string, string> }) {
  const [budget, setBudget] = useState(values.orcamento);
  const [flexible, setFlexible] = useState(values.flexivel === "1");
  const error = (name: string) => errors[name] ? <p className="field-error" id={`erro-${name}`} role="alert">{errors[name]}</p> : null;
  const describedBy = (name: string) => errors[name] ? `erro-${name}` : undefined;
  return <form action="/triagem" method="get" className="stack triage-form" noValidate={false}>
    <input type="hidden" name="tipo" value={tipo}/>
    {objetivo && <input type="hidden" name="objetivo" value={objetivo}/>}
    <div className="field"><label htmlFor="titulo">Título do projeto</label><input id="titulo" name="titulo" required minLength={5} maxLength={120} defaultValue={values.titulo} placeholder="Ex.: Loja virtual para minha confeitaria" aria-invalid={Boolean(errors.titulo)} aria-describedby={describedBy("titulo")}/>{error("titulo")}</div>
    <div className="field"><label htmlFor="descricao">Descreva o que você precisa</label><textarea id="descricao" name="descricao" required minLength={30} maxLength={2000} defaultValue={values.descricao} aria-invalid={Boolean(errors.descricao)} aria-describedby={`${describedBy("descricao") ?? ""} descricao-dica`.trim()}/><small id="descricao-dica">De 30 a 2.000 caracteres. Conte o objetivo, o que já existe e o que é essencial.</small>{error("descricao")}</div>
    <fieldset className="triage-fieldset"><legend>Quanto você pretende investir?</legend>
      <div className="choice-row">{budgetOptions.map((option) => <label key={option.value} className="choice"><input type="radio" name="orcamento" value={option.value} checked={budget === option.value} onChange={() => setBudget(option.value)} required/><span><strong>{option.label}</strong><small>{option.hint}</small></span></label>)}</div>
      {error("orcamento")}
      {budget === "FAIXA" && <div className="form-grid"><div className="field"><label htmlFor="min">Valor mínimo (R$)</label><input id="min" name="min" inputMode="decimal" required defaultValue={values.min} placeholder="1500,00" aria-invalid={Boolean(errors.min)} aria-describedby={describedBy("min")}/>{error("min")}</div><div className="field"><label htmlFor="max">Valor máximo (R$)</label><input id="max" name="max" inputMode="decimal" required defaultValue={values.max} placeholder="4000,00" aria-invalid={Boolean(errors.max)} aria-describedby={describedBy("max")}/>{error("max")}</div></div>}
      {budget === "ATE" && <div className="field"><label htmlFor="max">Teto do orçamento (R$)</label><input id="max" name="max" inputMode="decimal" required defaultValue={values.max} placeholder="4000,00" aria-invalid={Boolean(errors.max)} aria-describedby={describedBy("max")}/>{error("max")}</div>}
    </fieldset>
    <fieldset className="triage-fieldset"><legend>Em quanto tempo você precisa?</legend>
      <div className="field"><label htmlFor="prazo">Prazo desejado (dias)</label><input id="prazo" name="prazo" type="number" inputMode="numeric" min={1} max={3650} step={1} required={!flexible} disabled={flexible} defaultValue={values.prazo} placeholder="30" aria-invalid={Boolean(errors.prazo)} aria-describedby={describedBy("prazo")}/>{error("prazo")}</div>
      <label className="checkbox"><input type="checkbox" name="flexivel" value="1" checked={flexible} onChange={(event) => setFlexible(event.target.checked)}/><span>Meu prazo é flexível</span></label>
    </fieldset>
    <button className="button" type="submit">Ver preço de referência <ArrowRight aria-hidden="true"/></button>
  </form>;
}
