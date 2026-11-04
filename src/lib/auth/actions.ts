"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHash } from "node:crypto";
import { auth } from "./config";
import { getSession } from "./session";
import { safeDestination, internalNext, withNext, type ActionState } from "./action-state";
import { mutationAllowed } from "./mutation-limit";
import { setAccountType } from "./account-type";
import { accountTypes } from "./user-fields";
import { socialProviderIds, enabledSocialProviders } from "./providers";
import { emailAvailable } from "@/lib/email/mailer";

const credentials = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(12).max(128) });
const accountType = z.enum(accountTypes);
const registration = credentials.extend({ name: z.string().trim().min(2).max(100), accountType });
export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Confira seu e-mail e senha.", fields: parsed.error.flatten().fieldErrors };
  if (!await mutationAllowed(createHash("sha256").update(parsed.data.email).digest("hex"), "auth")) return { error: "Muitas tentativas. Aguarde um minuto." };
  try { await auth.api.signInEmail({ body: parsed.data, headers: await headers() }); }
  catch { return { error: "Não foi possível entrar. Confira e-mail e senha ou tente novamente em alguns instantes." }; }
  redirect(safeDestination(form.get("next")));
}
export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = registration.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Confira os dados. A senha deve ter de 12 a 128 caracteres.", fields: parsed.error.flatten().fieldErrors };
  if (!await mutationAllowed(createHash("sha256").update(parsed.data.email).digest("hex"), "auth")) return { error: "Muitas tentativas. Aguarde um minuto." };
  const { accountType: chosenType, ...body } = parsed.data;
  let createdId: string;
  try { createdId = (await auth.api.signUpEmail({ body: { ...body, callbackURL: "/painel" }, headers: await headers() })).user.id; }
  catch { return { error: "Não foi possível criar a conta com esses dados. Tente entrar ou aguarde para tentar novamente." }; }
  // O tipo nunca passa pelo input do Better Auth: só o servidor o define, uma vez.
  // Se falhar, a conta fica sem tipo e o painel redireciona para /boas-vindas.
  try { await setAccountType(createdId, chosenType); } catch { /* tratado por /boas-vindas */ }
  redirect(safeDestination(form.get("next")));
}
export async function chooseAccountType(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para escolher o tipo da conta." };
  const parsed = z.object({ accountType }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Escolha Cliente ou Prestador.", fields: parsed.error.flatten().fieldErrors };
  if (session.user.accountType) return { error: "O tipo de conta já foi definido e não pode ser alterado." };
  if (!await mutationAllowed(session.user.id, "account")) return { error: "Muitas alterações. Aguarde um minuto." };
  try { if (!await setAccountType(session.user.id, parsed.data.accountType)) return { error: "O tipo de conta já foi definido e não pode ser alterado." }; }
  catch { return { error: "Não foi possível salvar o tipo da conta." }; }
  redirect(safeDestination(form.get("next")));
}
export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
export async function updateName(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para alterar a conta." };
  const parsed = z.object({ name: z.string().trim().min(2).max(100) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Informe um nome de 2 a 100 caracteres." };
  if (!await mutationAllowed(session.user.id, "account")) return { error: "Muitas alterações. Aguarde um minuto." };
  try { await auth.api.updateUser({ body: parsed.data, headers: await headers() }); revalidatePath("/painel", "layout"); return { success: "Nome atualizado." }; }
  catch { return { error: "Não foi possível atualizar o nome." }; }
}
export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para alterar a senha." };
  const parsed = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "A nova senha deve ter de 12 a 128 caracteres." };
  if (!await mutationAllowed(session.user.id, "account")) return { error: "Muitas alterações. Aguarde um minuto." };
  try { await auth.api.changePassword({ body: { ...parsed.data, revokeOtherSessions: true }, headers: await headers() }); return { success: "Senha alterada. As outras sessões foram encerradas." }; }
  catch { return { error: "Não foi possível alterar a senha. Confira a senha atual." }; }
}

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const resetRequestMessage = "Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha. O link vale por 1 hora.";
// Sempre responde a mesma mensagem, exista ou não a conta, e a entrega do e-mail roda depois da resposta.
export async function requestPasswordReset(_: ActionState, form: FormData): Promise<ActionState> {
  if (!emailAvailable()) return { error: "A recuperação de senha não está disponível no momento." };
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Informe um e-mail válido.", fields: parsed.error.flatten().fieldErrors };
  if (!await mutationAllowed(digest(parsed.data.email), "reset")) return { error: "Muitas tentativas. Aguarde um minuto." };
  try { await auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo: "/redefinir-senha" }, headers: await headers() }); } catch { /* resposta neutra mesmo em falha */ }
  return { success: resetRequestMessage };
}
export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ token: z.string().min(1).max(256), newPassword: z.string().min(12).max(128) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "A nova senha deve ter de 12 a 128 caracteres.", fields: { newPassword: ["invalid"] } };
  if (!await mutationAllowed(digest(parsed.data.token), "reset-token")) return { error: "Muitas tentativas. Aguarde um minuto." };
  try { await auth.api.resetPassword({ body: parsed.data, headers: await headers() }); }
  catch { return { error: "Este link é inválido, já foi usado ou expirou. Peça um novo link." }; }
  redirect("/entrar?senha=redefinida");
}
export async function resendVerification(): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para reenviar a confirmação." };
  if (session.user.emailVerified) return { success: "Seu e-mail já está confirmado." };
  if (!emailAvailable()) return { error: "O envio de e-mail não está disponível no momento." };
  if (!await mutationAllowed(session.user.id, "verify")) return { error: "Muitas tentativas. Aguarde um minuto." };
  try { await auth.api.sendVerificationOTP({ body: { email: session.user.email, type: "email-verification" }, headers: await headers() }); }
  catch { return { error: "Não foi possível reenviar agora. Tente novamente em alguns instantes." }; }
  return { success: "Enviamos um novo código para o seu e-mail." };
}
const otpErrors: Record<string, string> = { INVALID_OTP: "Código incorreto. Confira e tente de novo.", OTP_EXPIRED: "Este código expirou. Peça um novo.", TOO_MANY_ATTEMPTS: "Muitas tentativas com este código. Peça um novo." };
// O e-mail vem sempre da sessão: um código só confirma a conta de quem está logado.
export async function verifyEmailCode(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Entre para confirmar o e-mail." };
  if (session.user.emailVerified) return { success: "Seu e-mail já está confirmado." };
  const code = z.string().regex(/^\d{6}$/).safeParse(form.get("code"));
  if (!code.success) return { error: "Digite os 6 dígitos do código." };
  if (!await mutationAllowed(session.user.id, "verify-otp")) return { error: "Muitas tentativas. Aguarde um minuto." };
  try { await auth.api.verifyEmailOTP({ body: { email: session.user.email, otp: code.data }, headers: await headers() }); }
  catch (error) {
    const reason = (error as { body?: { code?: string } }).body?.code ?? "";
    return { error: otpErrors[reason] ?? "Não foi possível confirmar agora. Tente novamente em alguns instantes." };
  }
  return { success: "E-mail confirmado." };
}
export async function socialSignIn(form: FormData) {
  const provider = z.enum(socialProviderIds).safeParse(form.get("provider"));
  if (!provider.success || !enabledSocialProviders().includes(provider.data)) redirect("/entrar?erro=login-social");
  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!await mutationAllowed(digest(forwarded), "social")) redirect("/entrar?erro=tentativas");
  const next = internalNext(form.get("next"));
  let url: string | undefined;
  try { url = (await auth.api.signInSocial({ body: { provider: provider.data, callbackURL: next ?? "/painel", newUserCallbackURL: withNext("/boas-vindas", next), errorCallbackURL: "/entrar?erro=login-social" }, headers: await headers() })).url; }
  catch { /* cai no redirect de erro */ }
  redirect(url ?? "/entrar?erro=login-social");
}
