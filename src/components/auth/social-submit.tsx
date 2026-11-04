"use client";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Abrir o provedor leva um instante e não há navegação interna: o retorno fica no próprio botão. */
export function SocialSubmit({ icon, label }: { icon: ReactNode; label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="social-button" aria-disabled={pending} data-pending={pending || undefined} onClick={(event) => { if (pending) event.preventDefault(); }}>{icon}{pending ? `Abrindo ${label}…` : `Continuar com ${label}`}</button>;
}
