import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { signUp } from "@/lib/auth/actions";
export default function RegistrationPage() {
  return <section className="panel auth-panel stack"><h1>Crie sua conta.</h1><p>Encontre profissionais ou apresente seus serviços.</p><ActionForm action={signUp} label="Criar conta"><Field label="Nome" name="name" required minLength={2} maxLength={100} autoComplete="name" /><Field label="E-mail" name="email" type="email" required maxLength={254} autoComplete="email" /><Field label="Senha" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" hint="Use de 12 a 128 caracteres." /></ActionForm><p>Já tem conta? <Link href="/entrar">Entrar</Link></p></section>;
}
