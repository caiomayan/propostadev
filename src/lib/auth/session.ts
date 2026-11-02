import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./config";
import type { AccountType } from "./user-fields";

export async function getSession() {
  const requestHeaders = new Headers(await headers());
  // Server Actions can rotate cookies before their Server Components rerender.
  requestHeaders.set("cookie", (await cookies()).toString());
  return auth.api.getSession({ headers: requestHeaders });
}
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return session;
}
// Rotas privadas exigem um tipo de conta; sem tipo, a escolha acontece em /boas-vindas.
export async function requireAccount() {
  const session = await requireSession();
  const accountType = session.user.accountType;
  if (accountType !== "CLIENTE" && accountType !== "PRESTADOR") redirect("/boas-vindas");
  return { session, accountType: accountType as AccountType };
}
async function requireType(type: AccountType) {
  const account = await requireAccount();
  if (account.accountType !== type) redirect("/painel");
  return account.session;
}
export const requireCliente = () => requireType("CLIENTE");
export const requirePrestador = () => requireType("PRESTADOR");
