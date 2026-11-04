"use client";
import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

function Submit({ label, pendingLabel, className, icon }: { label: string; pendingLabel: string; className: string; icon: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} aria-disabled={pending} data-pending={pending || undefined} onClick={(event) => { if (pending) event.preventDefault(); }}>{icon && <LogOut aria-hidden="true"/>}<span>{pending ? pendingLabel : label}</span></button>;
}

/** Encerra a sessão com retorno visível. `to="cadastro"` serve a quem digitou o e-mail errado. */
export function SignOutButton({ label = "Sair", pendingLabel = "Saindo…", className = "sign-out", icon = false, to }: { label?: string; pendingLabel?: string; className?: string; icon?: boolean; to?: "cadastro" }) {
  return <form action={signOut}>{to && <input type="hidden" name="to" value={to}/>}<Submit label={label} pendingLabel={pendingLabel} className={className} icon={icon}/></form>;
}
