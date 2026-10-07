"use client";
import { useId, useState } from "react";
import { priceLabels } from "@/lib/format";

export function PriceFilters({ model = "", min, max }: { model?: string; min?: string; max?: string }) {
  const [selected, setSelected] = useState(model);
  const prefix = useId();
  const disabled = !selected || selected === "SOB_CONSULTA";
  return <><div className="field"><label htmlFor={`${prefix}-model`}>Modelo de preço</label><select id={`${prefix}-model`} name="modelo_preco" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Todos os modelos</option>{Object.entries(priceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <p className="muted">Escolha um modelo numérico para filtrar ou ordenar por preço. Valores por hora e por projeto têm unidades diferentes.</p>
    <div className="inline"><div className="field"><label htmlFor={`${prefix}-min`}>Preço mínimo</label><input id={`${prefix}-min`} name="preco_min" inputMode="decimal" type="number" min="0.01" step="0.01" defaultValue={min} disabled={disabled}/></div><div className="field"><label htmlFor={`${prefix}-max`}>Preço máximo</label><input id={`${prefix}-max`} name="preco_max" inputMode="decimal" type="number" min="0.01" step="0.01" defaultValue={max} disabled={disabled}/></div></div>
  </>;
}
