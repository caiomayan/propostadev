"use client";
import { useState } from "react";
import { priceLabels } from "@/lib/format";

export function PriceFilters({ model = "", min, max }: { model?: string; min?: string; max?: string }) {
  const [selected, setSelected] = useState(model);
  const disabled = !selected || selected === "SOB_CONSULTA";
  return <><label>Modelo de preço<select name="modelo_preco" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Todos os modelos</option>{Object.entries(priceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p className="muted">Escolha um modelo numérico para filtrar ou ordenar por preço. Valores por hora e por projeto têm unidades diferentes.</p>
    <div className="inline"><label>Preço mínimo<input name="preco_min" inputMode="decimal" type="number" min="0.01" step="0.01" defaultValue={min} disabled={disabled}/></label><label>Preço máximo<input name="preco_max" inputMode="decimal" type="number" min="0.01" step="0.01" defaultValue={max} disabled={disabled}/></label></div>
  </>;
}
