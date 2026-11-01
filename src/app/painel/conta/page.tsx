import { requireAccount } from "@/lib/auth/session";
import { updateName, changePassword } from "@/lib/auth/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { PasswordField } from "@/components/forms/password-field";
export default async function AccountPage() {
  const { session, accountType } = await requireAccount();
  return <section className="stack form-page">
    <header className="dash-heading"><h1>Minha conta</h1><p className="muted">Conta {accountType === "PRESTADOR" ? "de Prestador" : "de Cliente"}. O tipo não pode ser alterado.</p></header>
    <div className="panel stack"><h2>Seus dados</h2><dl className="dash-status"><div><dt>E-mail de acesso</dt><dd>{session.user.email}</dd></div></dl>
      <ActionForm action={updateName}><Field label="Nome" name="name" required minLength={2} maxLength={100} defaultValue={session.user.name} autoComplete="name" /></ActionForm></div>
    <div className="panel stack"><h2>Alterar senha</h2><p className="muted">Ao alterar, as outras sessões abertas são encerradas.</p>
      <ActionForm action={changePassword} label="Alterar senha"><PasswordField label="Senha atual" name="currentPassword" required autoComplete="current-password" maxLength={128} /><PasswordField label="Nova senha" name="newPassword" required autoComplete="new-password" minLength={12} maxLength={128} showStrength /></ActionForm></div>
  </section>;
}
