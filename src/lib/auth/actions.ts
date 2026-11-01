"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHash } from "node:crypto";
import { auth } from "./config";
import { getSession } from "./session";
import { safeDestination, type ActionState } from "./action-state";
import { mutationAllowed } from "./mutation-limit";
import { setAccountType } from "./account-type";
import { accountTypes } from "./user-fields";

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
  try { createdId = (await auth.api.signUpEmail({ body, headers: await headers() })).user.id; }
  catch { return { error: "Não foi possível criar a conta com esses dados. Tente entrar ou aguarde para tentar novamente." }; }
  // O tipo nunca passa pelo input do Better Auth: só o servidor o define, uma vez.
  // Se falhar, a conta fica sem tipo e o painel redireciona para /boas-vindas.
  try { await setAccountType(createdId, chosenType); } catch { /* tratado por /boas-vindas */ }
  redirect("/painel");
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
  redirect("/painel");
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
