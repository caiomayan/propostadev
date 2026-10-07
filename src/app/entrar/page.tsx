import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { signIn } from "@/lib/auth/actions";
import { safeDestination } from "@/lib/auth/action-state";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <section className="panel auth-panel stack"><p className="eyebrow">SUA CONTA</p><h1>Bom ter você de volta.</h1><p>Entre para gerenciar serviços e avaliar prestadores.</p><ActionForm action={signIn} label="Entrar"><input type="hidden" name="next" value={safeDestination(params.next)} /><Field label="E-mail" name="email" type="email" required autoComplete="email" maxLength={254} /><Field label="Senha" name="password" type="password" required minLength={12} maxLength={128} autoComplete="current-password" /></ActionForm><p>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></p></section>;
}
