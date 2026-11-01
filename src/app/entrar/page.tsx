import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { PasswordField } from "@/components/forms/password-field";
import { SocialButtons } from "@/components/auth/social-buttons";
import { signIn } from "@/lib/auth/actions";
import { safeDestination, internalNext, withNext } from "@/lib/auth/action-state";
import { enabledSocialProviders } from "@/lib/auth/providers";
import { emailAvailable } from "@/lib/email/mailer";
const notices: Record<string, string> = { "login-social": "Não foi possível entrar com esse provedor. Tente novamente ou use e-mail e senha.", tentativas: "Muitas tentativas. Aguarde um minuto." };
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; senha?: string; erro?: string }> }) {
  const params = await searchParams;
  const next = internalNext(params.next);
  const error = params.erro ? notices[params.erro] : undefined;
  return <section className="panel auth-panel stack"><h1>Bom ter você de volta.</h1><p>Entre para gerenciar serviços e avaliar prestadores.</p>{params.senha === "redefinida" && <p role="status" className="form-success">Senha redefinida. Entre com a nova senha.</p>}{error && <div role="alert" className="form-error">{error}</div>}<ActionForm action={signIn} label="Entrar"><input type="hidden" name="next" value={safeDestination(params.next)} /><Field label="E-mail" name="email" type="email" required autoComplete="email" maxLength={254} /><PasswordField label="Senha" name="password" required minLength={12} maxLength={128} autoComplete="current-password" /></ActionForm>{emailAvailable() && <p><Link href="/esqueci-senha">Esqueci minha senha</Link></p>}<SocialButtons providers={enabledSocialProviders()} next={next} /><p>Ainda não tem conta? <Link href={withNext("/cadastro", next)}>Criar conta</Link></p></section>;
}
