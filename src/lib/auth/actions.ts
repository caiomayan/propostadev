"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash } from "node:crypto";
import { auth } from "./config";
import { getSession } from "./session";
import { safeDestination, type ActionState } from "./action-state";
import { mutationAllowed } from "./mutation-limit";

const credentials = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(12).max(128) });
const registration = credentials.extend({ name: z.string().trim().min(2).max(100) });
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
  try { await auth.api.signUpEmail({ body: parsed.data, headers: await headers() }); }
  catch { return { error: "Não foi possível criar a conta com esses dados. Tente entrar ou aguarde para tentar novamente." }; }
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
  try { await auth.api.updateUser({ body: parsed.data, headers: await headers() }); return { success: "Nome atualizado." }; }
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
