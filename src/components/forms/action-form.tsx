"use client";
import { createContext, useActionState, useContext, type ReactNode } from "react";
import type { ActionState } from "@/lib/auth/action-state";
const FieldErrors = createContext<ActionState['fields']>(undefined);
export function useFieldError(name?: string) { return useContext(FieldErrors)?.[name ?? ""]?.length ? `error-${name}` : undefined; }
const labels: Record<string, string> = { name: "Nome", email: "E-mail", password: "Senha", type: "Tipo de pessoa", displayName: "Nome de exibição", description: "Descrição", yearsExperience: "Experiência", contactEmail: "E-mail de contato", contactConsent: "Autorização dos contatos", photoUrl: "Foto", city: "Cidade", state: "UF", country: "País", phone: "Telefone", whatsapp: "WhatsApp", siteUrl: "Site", githubUrl: "GitHub", linkedinUrl: "LinkedIn", serviceTypeId: "Tipo de serviço", title: "Título", priceType: "Modelo de preço", priceMin: "Preço mínimo", priceMax: "Preço máximo", deadlineType: "Modelo de prazo", deadlineMinDays: "Prazo mínimo", deadlineMaxDays: "Prazo máximo", rating: "Nota", comment: "Comentário" };

export function ActionForm({ action, children, label = "Salvar" }: { action: (state: ActionState, data: FormData) => Promise<ActionState>; children: ReactNode; label?: string }) {
  const [state, submit, pending] = useActionState(action, {});
  return <FieldErrors.Provider value={state.fields}><form action={submit} className="stack" aria-busy={pending}>{children}{state.error && <div role="alert" className="form-error">{state.error}{state.fields && <ul>{Object.entries(state.fields).filter(([, messages]) => messages?.length).map(([field]) => <li key={field} id={`error-${field}`}>Revise o campo {labels[field] ?? field.toLowerCase()}.</li>)}</ul>}</div>}{state.success && <p role="status">{state.success}</p>}<button className="button" disabled={pending}>{pending ? "Salvando…" : label}</button></form></FieldErrors.Provider>;
}
