import Link from "next/link";
import { connection } from "next/server";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { PasswordField } from "@/components/forms/password-field";
import { AccountTypePicker } from "@/components/forms/account-type-picker";
import { SocialButtons } from "@/components/auth/social-buttons";
import { signUp } from "@/lib/auth/actions";
import { enabledSocialProviders } from "@/lib/auth/providers";
// Lê variáveis de ambiente por requisição (provedores OAuth), então não pode ser pré-renderizada no build.
export default async function RegistrationPage() {
  await connection();
  const providers = enabledSocialProviders();
  return <section className="panel auth-panel stack"><h1>Crie sua conta.</h1><p>Escolha como você vai usar a Proposta.dev. O tipo de conta não pode ser alterado depois.</p><ActionForm action={signUp} label="Criar conta"><AccountTypePicker /><Field label="Nome" name="name" required minLength={2} maxLength={100} autoComplete="name" /><Field label="E-mail" name="email" type="email" required maxLength={254} autoComplete="email" /><PasswordField label="Senha" name="password" required minLength={12} maxLength={128} autoComplete="new-password" showStrength /></ActionForm>{providers.length > 0 && <p className="muted">Com GitHub ou Google, você escolhe o tipo de conta no passo seguinte.</p>}<SocialButtons providers={providers} /><p>Já tem conta? <Link href="/entrar">Entrar</Link></p></section>;
}
