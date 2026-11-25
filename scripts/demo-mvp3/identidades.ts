// Demo realista (ADR 0005, decisão 1): aplica nomes, slugs, contatos e textos novos aos Prestadores demo que já existem
// (produção). Idempotente e restrito às contas @demo.example; não apaga nada. Bancos novos já nascem assim pelo seed-demo.
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { user } from "../../src/lib/db/auth-schema";
import { providers } from "../../src/lib/db/schema";
import { LEGACY_REVIEW, OLD_LEGACY_REVIEW, demoIdentity, demoIdentityNumbers } from "../demo-identidades";
import { OLD_GENERIC_MESSAGE, proposalMessages } from "./oportunidades";

export async function seedDemoIdentidades(): Promise<void> {
  let renamed = 0;
  for (const n of demoIdentityNumbers) {
    const identity = demoIdentity(n);
    const [account] = await db.select({ id: user.id }).from(user).where(eq(user.email, identity.loginEmail)).limit(1);
    if (!account) continue;
    await db.update(user).set({ name: identity.name }).where(eq(user.id, account.id));
    const result = await db.update(providers).set({ displayName: identity.name, slug: identity.slug, contactEmail: identity.contact, ...(identity.about ? { description: identity.about } : {}) }).where(eq(providers.userId, account.id));
    renamed += result.rowCount ?? 0;
  }
  await db.update(user).set({ name: "Mariana Costa" }).where(and(eq(user.email, "cliente1@demo.example"), eq(user.name, "Cliente Demo")));
  await db.execute(sql`UPDATE avaliacao a SET comentario = ${LEGACY_REVIEW} FROM "user" u WHERE u.id = a.usuario_id AND u.email = 'cliente1@demo.example' AND a.comentario = ${OLD_LEGACY_REVIEW}`);
  for (const [title, message] of [["Landing page para consultoria contábil", proposalMessages.contabil], ["Landing page de curso de culinária", proposalMessages.culinaria]] as const) {
    await db.execute(sql`UPDATE proposta pr SET mensagem = ${message} FROM projeto p WHERE p.id = pr.projeto_id AND p.titulo = ${title} AND pr.mensagem = ${OLD_GENERIC_MESSAGE}`);
  }
  console.info(`Identidade realista aplicada a ${renamed} Prestadores demo.`);
}
