"use client";
import { useActionState } from "react";
import { grantVip, revokeVip } from "@/modules/plataforma/actions";

/** Um formulário por Prestador. O id vai no formulário, mas quem pode agir é decidido só pela sessão no servidor. */
export function PlataformaVipButton({ providerId, name, mode }: { providerId: string; name: string; mode: "grant" | "revoke" }) {
  const [state, submit, pending] = useActionState(mode === "grant" ? grantVip : revokeVip, {});
  const label = mode === "grant" ? "Conceder VIP" : "Retirar VIP";
  return <form action={submit} className="plataforma-action">
    <input type="hidden" name="providerId" value={providerId}/>
    <button type="submit" className={mode === "grant" ? "button" : "button secondary"} disabled={pending} aria-label={`${label} a ${name}`}>{pending ? "Salvando…" : label}</button>
    {state.error && <p role="alert" className="field-error">{state.error}</p>}
  </form>;
}
