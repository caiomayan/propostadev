import { money } from "@/lib/format";
import { positionSentence, type BudgetPosition, type Range, type RulerSubject } from "@/modules/triage/position";
import type { Budget } from "@/modules/triage/validation";

export type RulerData = { faixa: Range | null; media: string | null; n: number; orcamento?: Budget; posicao?: BudgetPosition; /** "valor": o Prestador compondo a Proposta. "proposta": o Cliente triando uma Proposta (marcador pontual, legenda em terceira pessoa). */ sujeito?: RulerSubject; /** Versão para cartões de Proposta: régua mais baixa e legenda curta. */ compact?: boolean };

/**
 * Régua de preço, a assinatura visual do produto.
 * Sem `data`: ilustração decorativa da home (sem valores; não é dado).
 * Com `data`: a faixa anunciada em limão, a média dos preços fixos e o orçamento do Cliente na mesma escala.
 * Todo valor também aparece como texto na legenda; o desenho não carrega informação sozinho.
 */
export function PriceRuler({ data }: { data?: RulerData }) {
  if (data) return <DataRuler data={data} />;
  const ticks = Array.from({ length: 29 }, (_, index) => index);
  return <figure className="hero-ruler"><svg className="ruler" viewBox="0 0 560 72" role="img" aria-label="Ilustração de uma régua com uma faixa de preço destacada"><rect className="range" x="150" y="8" width="230" height="36" rx="10"/>{ticks.map((tick) => <line key={tick} className="tick" x1={tick * 20 + 0} x2={tick * 20 + 0} y1={tick % 4 === 0 ? 30 : 38} y2="52"/>)}<line className="base" x1="0" x2="560" y1="52" y2="52"/></svg><figcaption className="ruler-caption">Cada serviço tem uma faixa de preço anunciada. Você vê onde o seu orçamento cai.</figcaption></figure>;
}

function DataRuler({ data }: { data: RulerData }) {
  const { faixa, media, orcamento, posicao } = data;
  // Float só para posicionar pixels; nenhum valor financeiro é calculado a partir daqui.
  const budgetLow = orcamento?.tipo === "FAIXA" && orcamento.min ? Number(orcamento.min) : orcamento?.tipo === "ATE" && orcamento.max ? 0 : null;
  const budgetHigh = orcamento && orcamento.tipo !== "NAO_SEI" && orcamento.max ? Number(orcamento.max) : null;
  const values = [faixa && Number(faixa.min), faixa && Number(faixa.max), media && Number(media), budgetHigh, orcamento?.tipo === "FAIXA" ? budgetLow : null].filter((value): value is number => typeof value === "number");
  const lo = values.length ? Math.min(...values) : 0, hi = values.length ? Math.max(...values) : 1;
  const pad = (hi - lo || hi || 1) * 0.15;
  const from = Math.max(0, lo - pad), span = hi + pad - from;
  const at = (value: number) => `${Math.min(100, Math.max(0, ((value - from) / span) * 100)).toFixed(2)}%`;
  const width = (a: number, b: number) => `${Math.max(0.8, ((Math.min(100, Math.max(0, ((b - from) / span) * 100))) - Math.min(100, Math.max(0, ((a - from) / span) * 100)))).toFixed(2)}%`;
  const description = [
    faixa ? `Faixa anunciada de ${money(faixa.min)} a ${money(faixa.max)}.` : "Dados insuficientes para uma faixa de preços.",
    media ? `Média dos preços fixos: ${money(media)}.` : "",
    posicao && posicao !== "INDEFINIDO" ? positionSentence(posicao, data.sujeito) : "",
  ].filter(Boolean).join(" ");
  const proposta = data.sujeito === "proposta";
  return <figure className={`data-ruler${data.compact ? " compact" : ""}`}>
    <div className="ruler-track" role="img" aria-label={description}>
      {faixa && <div className="ruler-band" style={{ left: at(Number(faixa.min)), width: width(Number(faixa.min), Number(faixa.max)) }}/>}
      {media && <div className="ruler-average" style={{ left: at(Number(media)) }}/>}
      {orcamento && budgetHigh !== null && proposta && <div className="ruler-point" style={{ left: at(budgetHigh) }}/>}
      {orcamento && budgetHigh !== null && !proposta && <div className={`ruler-budget ${orcamento.tipo === "ATE" ? "until" : ""}`} style={orcamento.tipo === "ATE" ? { left: "0%", width: at(budgetHigh) } : { left: at(budgetLow ?? 0), width: width(budgetLow ?? 0, budgetHigh) }}/>}
    </div>
    <ul className="ruler-legend">
      <li><span className="swatch band" aria-hidden="true"/>{faixa ? <>Faixa anunciada: <strong>{money(faixa.min)} a {money(faixa.max)}</strong></> : <>Faixa anunciada: <strong>dados insuficientes</strong></>}</li>
      {media && <li><span className="swatch average" aria-hidden="true"/>Média dos preços fixos: <strong>{money(media)}</strong></li>}
      {orcamento && orcamento.tipo !== "NAO_SEI" && budgetHigh !== null && <li><span className={`swatch ${proposta ? "point" : "budget"}`} aria-hidden="true"/>{proposta ? "Valor da proposta" : data.sujeito === "valor" ? "Seu valor" : "Seu orçamento"}: <strong>{proposta ? money(orcamento.max) : orcamento.tipo === "ATE" ? `até ${money(orcamento.max)}` : `${money(orcamento.min)} a ${money(orcamento.max)}`}</strong></li>}
    </ul>
    <figcaption className="ruler-caption">{data.compact ? <>{posicao && posicao !== "INDEFINIDO" ? <strong>{positionSentence(posicao, data.sujeito)} </strong> : ""}Baseado em {data.n} prestadores com preço por projeto.</> : <>{posicao && posicao !== "INDEFINIDO" ? <strong>{positionSentence(posicao, data.sujeito)} </strong> : orcamento?.tipo === "NAO_SEI" ? "Você ainda não definiu um orçamento: use a faixa como ponto de partida. " : ""}Baseado em {data.n} {data.n === 1 ? "prestador" : "prestadores"} com preço por projeto. Preço de referência não é orçamento.</>}</figcaption>
  </figure>;
}
