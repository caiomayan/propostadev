import Link from "next/link";
import type { TriageOrder } from "@/modules/proposals/queries";

const orders: { value: TriageOrder | undefined; label: string }[] = [
  { value: undefined, label: "Pré-selecionadas primeiro" }, { value: "valor", label: "Menor valor" }, { value: "prazo", label: "Menor prazo" }, { value: "reputacao", label: "Melhor reputação" },
];

/** Ordenação e filtro por links: o estado vive na URL (`ordem`, `pre=1`), sem estado no cliente. */
export function TriageControls({ basePath, ordem, soPre, canFilter }: { basePath: string; ordem?: TriageOrder; soPre: boolean; canFilter: boolean }) {
  const href = (next: { ordem?: TriageOrder; pre?: boolean }) => {
    const params = new URLSearchParams();
    if (next.ordem) params.set("ordem", next.ordem);
    if (next.pre) params.set("pre", "1");
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  return <div className="triage-controls">
    <nav aria-label="Ordenar propostas"><p className="eyebrow" id="ordenar">Ordenar por</p>
      <ul className="chips-row" aria-labelledby="ordenar">{orders.map((order) => {
        const current = order.value === ordem;
        return <li key={order.label}><Link href={href({ ordem: order.value, pre: soPre })} className={`filter-link${current ? " current" : ""}`} aria-current={current ? "true" : undefined}>{order.label}</Link></li>;
      })}</ul></nav>
    {canFilter && <nav aria-label="Filtrar propostas"><p className="eyebrow" id="filtrar">Mostrar</p>
      <ul className="chips-row" aria-labelledby="filtrar">
        <li><Link href={href({ ordem })} className={`filter-link${soPre ? "" : " current"}`} aria-current={soPre ? undefined : "true"}>Todas</Link></li>
        <li><Link href={href({ ordem, pre: true })} className={`filter-link${soPre ? " current" : ""}`} aria-current={soPre ? "true" : undefined}>Só pré-selecionadas</Link></li>
      </ul></nav>}
  </div>;
}
