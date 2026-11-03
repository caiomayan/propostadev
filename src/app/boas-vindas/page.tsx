import { AuthShell } from "@/components/auth/auth-shell";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { chooseAccountType } from "@/lib/auth/actions";
import { safeDestination, internalNext } from "@/lib/auth/action-state";
import { ActionForm } from "@/components/forms/action-form";
import { AccountTypePicker } from "@/components/forms/account-type-picker";
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await requireSession();
  const next = internalNext((await searchParams).next);
  if (session.user.accountType) redirect(safeDestination(next));
  return <AuthShell><section className="auth-panel stack"><h1>Boas-vindas, {session.user.name}.</h1><p>Escolha o tipo da sua conta. Essa escolha é feita uma única vez e não pode ser alterada depois.</p><ActionForm action={chooseAccountType} label="Continuar">{next && <input type="hidden" name="next" value={next} />}<AccountTypePicker /></ActionForm></section></AuthShell>;
}
