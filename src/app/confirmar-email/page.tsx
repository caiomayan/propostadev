import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailCodeForm } from "@/components/auth/email-code-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { safeDestination, internalNext } from "@/lib/auth/action-state";
import { hasLiveEmailCode, needsEmailConfirmation } from "@/lib/auth/email-gate";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Confirmar e-mail", robots: { index: false } };

// Etapa obrigatória: enquanto o e-mail não é confirmado, nenhuma área privada abre.
export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await requireSession();
  const next = internalNext((await searchParams).next);
  if (!needsEmailConfirmation(session.user)) redirect(safeDestination(next));
  const { email } = session.user;
  return <AuthShell><section className="auth-panel stack confirm-email">
    <EmailCodeForm email={email} destination={safeDestination(next)} sendOnArrival={!await hasLiveEmailCode(email)}/>
    <div className="confirm-email-out"><span>E-mail errado?</span><SignOutButton to="cadastro" label="Sair e criar a conta de novo" className="link-button"/></div>
  </section></AuthShell>;
}
