import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { chooseAccountType } from "@/lib/auth/actions";
import { ActionForm } from "@/components/forms/action-form";
import { AccountTypePicker } from "@/components/forms/account-type-picker";
export default async function WelcomePage() {
  const session = await requireSession();
  if (session.user.accountType) redirect("/painel");
  return <section className="panel auth-panel stack"><h1>Boas-vindas, {session.user.name}.</h1><p>Escolha o tipo da sua conta. Essa escolha é feita uma única vez e não pode ser alterada depois.</p><ActionForm action={chooseAccountType} label="Continuar"><AccountTypePicker /></ActionForm></section>;
}
