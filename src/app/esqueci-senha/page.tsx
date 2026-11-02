import Link from "next/link";
import { connection } from "next/server";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { requestPasswordReset } from "@/lib/auth/actions";
import { emailAvailable } from "@/lib/email/mailer";
export const metadata = { title: "Esqueci minha senha" };
export default async function ForgotPasswordPage() {
  await connection();
  if (!emailAvailable()) return <section className="panel auth-panel stack"><h1>Recuperação indisponível.</h1><p>A recuperação de senha por e-mail não está disponível no momento.</p><p><Link href="/entrar">Voltar para entrar</Link></p></section>;
  return <section className="panel auth-panel stack"><h1>Esqueci minha senha.</h1><p>Informe o e-mail da conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.</p><ActionForm action={requestPasswordReset} label="Enviar link"><Field label="E-mail" name="email" type="email" required autoComplete="email" maxLength={254} /></ActionForm><p><Link href="/entrar">Voltar para entrar</Link></p></section>;
}
