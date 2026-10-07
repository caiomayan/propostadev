import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./config";

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
