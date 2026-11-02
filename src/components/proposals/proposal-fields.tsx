"use client";
import { useState } from "react";
import { Field, TextAreaField } from "@/components/forms/field";
import { PriceRuler } from "@/components/price-ruler";
import { posicaoOrcamento, type Range } from "@/modules/triage/position";
import { normalizeMoney } from "@/modules/triage/validation";

/** Campos da Proposta. Enquanto o Prestador digita o valor, a régua mostra onde ele cai na faixa de referência. */
export function ProposalFields({ faixa, media, n, defaults }: { faixa: Range | null; media: string | null; n: number; defaults: { valor: string; prazo: string; mensagem: string } }) {
  const [value, setValue] = useState(defaults.valor);
  const normalized = normalizeMoney(value);
  const budget = normalized ? { tipo: "FAIXA" as const, min: normalized, max: normalized } : undefined;
  return <>
    <Field label="Valor da proposta (R$)" name="valor" inputMode="decimal" required value={value} onChange={(event) => setValue(event.target.value)} placeholder="2500,00" hint="Valor total do projeto, em reais."/>
    {faixa
      ? <div className="proposal-ruler" aria-live="polite"><PriceRuler data={{ faixa, media, n, orcamento: budget, posicao: budget ? posicaoOrcamento(budget, faixa) : undefined, sujeito: "valor" }}/></div>
      : <p className="muted">Ainda não há dados suficientes para comparar o seu valor com o mercado ({n} {n === 1 ? "prestador" : "prestadores"} com preço por projeto; são necessários 3).</p>}
    <Field label="Prazo (dias)" name="prazo" type="number" inputMode="numeric" min={1} max={3650} required defaultValue={defaults.prazo} placeholder="30"/>
    <TextAreaField label="Mensagem para o Cliente" name="mensagem" required minLength={30} maxLength={3000} defaultValue={defaults.mensagem} placeholder="Apresente sua abordagem, o que está incluso e como pretende começar."/>
  </>;
}
