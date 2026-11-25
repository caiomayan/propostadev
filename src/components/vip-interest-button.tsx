"use client";
import { useActionState } from "react";
import { registerVipInterest } from "@/modules/vip/actions";

export function VipInterestButton() {
  const [state, submit, pending] = useActionState(registerVipInterest, {});
  return <form action={submit} className="stack"><button type="submit" className="button" disabled={pending}>{pending ? "Registrando…" : "Tenho interesse"}</button>
    {state.error && <p role="alert" className="field-error">{state.error}</p>}</form>;
}
