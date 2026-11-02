"use client";
import { useActionState } from "react";
import { resendVerification } from "@/lib/auth/actions";
import type { ActionState } from "@/lib/auth/action-state";

// Aviso discreto e não bloqueante no painel enquanto o e-mail não foi confirmado.
export function EmailVerificationNotice() {
  const [state, resend, pending] = useActionState<ActionState>(resendVerification, {});
  return <div className="verification-notice" role="region" aria-label="Confirmação de e-mail">
    <span><strong>Confirme seu e-mail.</strong> Enviamos um link quando você criou a conta.</span>
    <form action={resend}><button type="submit" className="button secondary" disabled={pending}>{pending ? "Enviando…" : "Reenviar e-mail"}</button></form>
    {state.success && <span role="status">{state.success}</span>}
    {state.error && <span role="alert" className="form-error">{state.error}</span>}
  </div>;
}
