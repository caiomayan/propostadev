import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { verification } from "@/lib/db/auth-schema";
import { emailAvailable } from "@/lib/email/mailer";

// Sem e-mail configurado ninguém receberia o código: a exigência só vale quando há envio.
export function needsEmailConfirmation(user: { emailVerified?: boolean | null }) {
  return !user.emailVerified && emailAvailable();
}

// O plugin emailOTP guarda o código nesta chave. Com um código válido, abrir a tela não dispara outro e-mail.
export async function hasLiveEmailCode(email: string) {
  const rows = await db.select({ id: verification.id }).from(verification)
    .where(and(eq(verification.identifier, `email-verification-otp-${email}`), gt(verification.expiresAt, new Date()))).limit(1);
  return rows.length > 0;
}
