import { PriceRuler } from "@/components/price-ruler";
import { money } from "@/lib/format";
import { posicaoOrcamento } from "@/modules/triage/position";
import type { ReferencePrice } from "@/modules/triage/queries";
import type { Budget } from "@/modules/triage/validation";

/** Preço de referência do tipo com a régua; o orçamento do Cliente aparece marcado. */
export function ReferenceBlock({ reference, budget, serviceName }: { reference: ReferencePrice; budget: Budget; serviceName: string }) {
  if (!reference.suficiente) return <div className="insufficient"><strong>Dados insuficientes</strong><p>Só {reference.n} {reference.n === 1 ? "prestador anuncia" : "prestadores anunciam"} preço por projeto em {serviceName}. São necessários pelo menos 3 para mostrar uma faixa.</p></div>;
  return <div className="stack" style={{ gap: 16 }}>
    {reference.mediaFixos && <p className="reference-average"><span>Média dos preços fixos</span><strong>{money(reference.mediaFixos)}</strong><small>{reference.fixosN} prestadores com preço fixo. Não é orçamento.</small></p>}
    <PriceRuler data={{ faixa: reference.faixa, media: reference.mediaFixos, n: reference.n, orcamento: budget, posicao: posicaoOrcamento(budget, reference.faixa) }}/>
  </div>;
}
