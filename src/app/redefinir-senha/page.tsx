import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { PasswordField } from "@/components/forms/password-field";
import { resetPassword } from "@/lib/auth/actions";
// O token vem na URL: não o repasse em Referer a terceiros.
export const metadata = { title: "Redefinir senha", referrer: "no-referrer" as const, robots: { index: false } };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  if (!token || error) return <section className="panel auth-panel stack"><h1>Link inválido.</h1><p>Este link é inválido, já foi usado ou expirou. Peça um novo link para redefinir a senha.</p><p><Link href="/esqueci-senha">Pedir novo link</Link></p></section>;
  return <section className="panel auth-panel stack"><h1>Crie uma nova senha.</h1><p>Ao salvar, as outras sessões abertas da sua conta serão encerradas.</p><ActionForm action={resetPassword} label="Redefinir senha"><input type="hidden" name="token" value={token} /><PasswordField label="Nova senha" name="newPassword" required minLength={12} maxLength={128} autoComplete="new-password" hint="Use de 12 a 128 caracteres." showStrength /></ActionForm></section>;
}
