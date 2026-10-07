import { requireSession } from "@/lib/auth/session";
import { updateName, changePassword } from "@/lib/auth/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
export default async function AccountPage() {
  const session = await requireSession();
  return <section className="stack"><h1>Minha conta</h1><div className="panel stack"><h2>Seus dados</h2><p>E-mail de acesso: {session.user.email}</p><ActionForm action={updateName}><Field label="Nome" name="name" required minLength={2} maxLength={100} defaultValue={session.user.name} /></ActionForm></div><div className="panel stack"><h2>Alterar senha</h2><ActionForm action={changePassword} label="Alterar senha"><Field label="Senha atual" name="currentPassword" type="password" required autoComplete="current-password" maxLength={128} /><Field label="Nova senha" name="newPassword" type="password" required autoComplete="new-password" minLength={12} maxLength={128} hint="As outras sessões serão encerradas." /></ActionForm></div></section>;
}
