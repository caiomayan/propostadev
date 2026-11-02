"use client";
import { useActionState } from "react";
import { inviteProvider } from "@/modules/projects/actions";

/** Convidar um Prestador compatível. O servidor confere dono, estado do Projeto, compatibilidade e limite. */
export function InviteButton({ projectId, providerId, providerName, invited }: { projectId: string; providerId: string; providerName: string; invited: boolean }) {
  const [state, submit, pending] = useActionState(inviteProvider, {});
  const done = invited || Boolean(state.success);
  if (done) return <p className="chip" role="status">Convidado</p>;
  return <form action={submit} className="invite-form"><input type="hidden" name="projetoId" value={projectId}/><input type="hidden" name="prestadorId" value={providerId}/>
    <button type="submit" className="button accent" disabled={pending} aria-label={`Convidar ${providerName}`}>{pending ? "Convidando…" : "Convidar"}</button>
    {state.error && <p role="alert" className="field-error">{state.error}</p>}</form>;
}
