// Dados de demonstração do painel da plataforma (ticket 02). Idempotente e só aditivo.
// Prestadores e contas são identificados pelo e-mail de login, nunca pelo slug nem pelo nome.
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "../../src/lib/auth/config";
import { setAccountType } from "../../src/lib/auth/account-type";
import { db } from "../../src/lib/db";
import { user } from "../../src/lib/db/auth-schema";
import { providers, vipInterests } from "../../src/lib/db/schema";
import { demoPasswordForNewAccount } from "./senha";

export const PLATAFORMA_DEMO_EMAIL = "plataforma@demo.example";
// Pedem o VIP na demo: prestador4 e prestador6, que não são VIP no seed. O prestador1 fica de fora (o roteiro registra o interesse dele ao vivo).
const requesterEmails = ["prestador4@demo.example", "prestador6@demo.example"];

export async function seedDemoPlataforma(): Promise<void> {
  // Primeiro os pedidos de VIP, que não dependem da conta; a conta vai no fim porque pode recusar (senha).
  const requesters = await db.select({ id: providers.id }).from(providers).innerJoin(user, eq(user.id, providers.userId))
    .where(and(inArray(user.email, requesterEmails), eq(providers.vip, false)));
  if (requesters.length) await db.insert(vipInterests).values(requesters.map((row) => ({ providerId: row.id }))).onConflictDoNothing({ target: vipInterests.providerId });

  let [account] = await db.select({ id: user.id }).from(user).where(eq(user.email, PLATAFORMA_DEMO_EMAIL)).limit(1);
  // Só uma conta nova precisa de senha; fora do banco local, a senha padrão pública nunca é usada.
  if (!account) account = (await auth.api.signUpEmail({ body: { email: PLATAFORMA_DEMO_EMAIL, password: demoPasswordForNewAccount(process.env.DATABASE_URL, process.env.DEMO_PASSWORD), name: "Equipe Proposta.dev" } })).user;
  // A Equipe da plataforma não é um tipo de conta (glossário); a conta de demo é de Cliente só para ter o menu e o painel de uma conta comum.
  await setAccountType(account.id, "CLIENTE");
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, account.id));
}
