"use client";
import { useState } from "react";
import type { Offer } from "@/lib/db/schema";
import { saveOffer } from "@/modules/offers/actions";
import { ActionForm } from "./action-form";
import { Field, TextAreaField, SelectField } from "./field";
const prices = { FIXO: "Preço fixo", A_PARTIR_DE: "A partir de", INTERVALO: "Intervalo de preços", POR_HORA: "Por hora", SOB_CONSULTA: "Sob consulta" };
const deadlines = { FIXO: "Prazo fixo", A_PARTIR_DE: "A partir de", INTERVALO: "Intervalo de dias", A_COMBINAR: "A combinar" };
export function OfferForm({ offer, catalog }: { offer?: Offer; catalog: { id: string; name: string }[] }) {
  const [price, setPrice] = useState<string>(offer?.priceType ?? "SOB_CONSULTA");
  const [deadline, setDeadline] = useState<string>(offer?.deadlineType ?? "A_COMBINAR");
  const [priceChanged, setPriceChanged] = useState(false);
  const [deadlineChanged, setDeadlineChanged] = useState(false);
  return <ActionForm action={saveOffer} label="Salvar oferta">{offer && <input type="hidden" name="id" value={offer.id} />}
    <fieldset className="form-section"><legend>O serviço</legend>
      <SelectField label="Tipo de serviço" name="serviceTypeId" defaultValue={offer?.serviceTypeId} required><option value="">Selecione</option>{catalog.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</SelectField>
      <Field name="title" label="Título" required minLength={5} maxLength={120} defaultValue={offer?.title} hint="De 5 a 120 caracteres. Diga o que o cliente recebe." />
      <TextAreaField label="Descrição" name="description" minLength={30} maxLength={5000} required rows={6} defaultValue={offer?.description} /><small className="form-note">Mínimo de 30 caracteres. Inclua o que está e o que não está no escopo.</small>
    </fieldset>
    <fieldset className="form-section"><legend>Preço</legend>
      <div className="form-grid">
        <SelectField label="Modelo de preço" name="priceType" value={price} onChange={(e) => { setPrice(e.target.value); setPriceChanged(true); }}>{Object.entries(prices).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        {price !== "SOB_CONSULTA" && <Field key={`${price}-min`} name="priceMin" label={price === "INTERVALO" ? "Preço mínimo" : "Preço anunciado"} required inputMode="decimal" pattern="[0-9]{1,8}(\.[0-9]{1,2})?" placeholder="1500.00" defaultValue={!priceChanged && price === offer?.priceType ? offer?.priceMin ?? '' : ''} />}
        {price === "INTERVALO" && <Field name="priceMax" label="Preço máximo" required inputMode="decimal" placeholder="3000.00" defaultValue={!priceChanged ? offer?.priceMax ?? '' : ''} />}
      </div>
      <small className="form-note">Valores em reais, com ponto nos decimais: 1500.00. Por hora representa R$/hora; os demais modelos representam R$/projeto.</small>
    </fieldset>
    <fieldset className="form-section"><legend>Prazo</legend>
      <div className="form-grid">
        <SelectField label="Modelo de prazo" name="deadlineType" value={deadline} onChange={(e) => { setDeadline(e.target.value); setDeadlineChanged(true); }}>{Object.entries(deadlines).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        {deadline !== "A_COMBINAR" && <Field key={`${deadline}-min`} name="deadlineMinDays" label={deadline === "INTERVALO" ? "Prazo mínimo (dias)" : "Prazo anunciado (dias)"} type="number" required min={1} max={3650} defaultValue={!deadlineChanged && deadline === offer?.deadlineType ? offer?.deadlineMinDays ?? '' : ''} />}
        {deadline === "INTERVALO" && <Field name="deadlineMaxDays" label="Prazo máximo (dias)" type="number" required min={1} max={3650} defaultValue={!deadlineChanged ? offer?.deadlineMaxDays ?? '' : ''} />}
      </div>
    </fieldset>
    <label className="checkbox consent"><input name="active" type="checkbox" defaultChecked={offer?.active ?? false} /> Publicar oferta (desmarque para pausar)</label>
  </ActionForm>;
}
