import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { withNext } from "@/lib/auth/action-state";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import { enabledSocialProviders } from "@/lib/auth/providers";
import { lojaReturnPath, signLojaToken } from "@/lib/loja/sso";

// Entrada da loja WooCommerce pelo login do Proposta.dev (ADR 0006).
// Sem sessão: com ?google=1 começa direto o login com Google; senão, abre /entrar. Ao voltar com sessão e e-mail
// verificado, devolve a pessoa à loja com um token assinado de uso único.
export async function GET(request: NextRequest) {
  const secret = process.env.LOJA_SSO_SECRET;
  const store = process.env.LOJA_URL ?? "https://propostadev.caiomayan.com";
  if (!secret) notFound();
  const back = lojaReturnPath(request.nextUrl.searchParams.get("volta"));
  const self = `/api/loja/entrar?volta=${encodeURIComponent(back)}`;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    if (request.nextUrl.searchParams.get("google") === "1" && enabledSocialProviders().includes("google")) {
      const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (!await mutationAllowed(createHash("sha256").update(forwarded).digest("hex"), "social")) redirect(withNext("/entrar", self));
      let url: string | undefined;
      try { url = (await auth.api.signInSocial({ body: { provider: "google", callbackURL: self, newUserCallbackURL: withNext("/boas-vindas", self), errorCallbackURL: "/entrar?erro=login-social" }, headers: requestHeaders })).url; }
      catch { /* cai no /entrar */ }
      if (url) redirect(url);
    }
    redirect(withNext("/entrar", self));
  }
  if (!session.user.emailVerified) redirect(`${store}/minha-conta/?pd_sso_erro=email`);
  const token = signLojaToken({ email: session.user.email, name: session.user.name }, secret, Date.now());
  redirect(`${store}/?pd_sso=${token}&volta=${encodeURIComponent(back)}`);
}
