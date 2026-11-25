// Dados de demonstração do MVP 3 para este ticket. Idempotente e só aditivo: pode rodar de novo sem duplicar nem apagar.
import { inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { user } from "../../src/lib/db/auth-schema";
import { providers } from "../../src/lib/db/schema";

// Conjunto VIP do seed: prestadores 2, 3, 5 e 8, identificados pelo e-mail de login (o slug e o nome mudam). O prestador1 fica fora para demonstrar o Interesse no VIP.
export const demoVipEmails = ["prestador2@demo.example", "prestador3@demo.example", "prestador5@demo.example", "prestador8@demo.example"];

export async function seedDemoVip(): Promise<void> {
  const owners = db.select({ id: user.id }).from(user).where(inArray(user.email, demoVipEmails));
  await db.update(providers).set({ vip: true }).where(inArray(providers.userId, owners));
}
