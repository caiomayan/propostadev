import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";
import { userAdditionalFields } from "./user-fields";
import { socialProviderConfig } from "./providers";
import { fetchGooglePicture } from "./google-photo";
import { sendEmail } from "@/lib/email/mailer";
import { passwordResetEmail, verificationCodeEmail } from "@/lib/email/templates";

// Copia só a foto a cada login. A opção overrideUserInfoOnSignIn trocaria também o nome que a pessoa editou em Conta.
async function syncGooglePhoto(account: { providerId: string; userId: string; accessToken?: string | null }) {
  if (account.providerId !== "google" || !account.accessToken) return;
  const picture = await fetchGooglePicture(account.accessToken);
  if (picture) await db.update(schema.user).set({ image: picture }).where(eq(schema.user.id, account.userId)).catch(() => undefined);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  user: { additionalFields: userAdditionalFields },
  emailAndPassword: {
    enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: false,
    // Token de uso único (consumido na redefinição) com validade de 1 hora; encerra todas as sessões abertas.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => { sendEmail({ to: user.email, preview: `Link: ${url}`, ...passwordResetEmail(user.name, url) }); },
  },
  // requireEmailVerification fica false de propósito: com true, o login recusaria quem ainda precisa de sessão para digitar o código.
  // A exigência mora nas guardas (session.ts, account-type.ts), que levam a /confirmar-email.
  // O envio do código vem do plugin emailOTP (overrideDefaultEmailVerification).
  emailVerification: { sendOnSignUp: true },
  // Vínculo automático por e-mail só quando o provedor marca o e-mail como verificado (padrão do Better Auth,
  // sem trustedProviders) e a conta local já confirmou o mesmo e-mail.
  socialProviders: socialProviderConfig(),
  rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
  databaseHooks: {
    account: { create: { after: syncGooglePhoto }, update: { after: syncGooglePhoto } },
    user: {
      create: { before: async (user) => {
        const parsed = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254) }).safeParse(user);
        if (!parsed.success) throw new APIError("BAD_REQUEST", { message: "Nome ou e-mail inválido." });
        return { data: { ...user, ...parsed.data } };
      } },
      update: { before: async (user) => {
        if (user.name !== undefined) {
          const name = z.string().trim().min(2).max(100).safeParse(user.name);
          if (!name.success) throw new APIError("BAD_REQUEST", { message: "Nome inválido." });
          return { data: { ...user, name: name.data } };
        }
        return { data: user };
      } },
    },
  },
  // O plugin também traria login, recuperação de senha e troca de e-mail por código: nada disso existe no produto.
  // Toda a superfície HTTP dele fica desligada e o uso passa só pelas Server Actions, com o e-mail vindo da sessão.
  disabledPaths: ["/sign-in/email-otp", "/email-otp/send-verification-otp", "/email-otp/check-verification-otp", "/email-otp/verify-email", "/email-otp/request-password-reset", "/forget-password/email-otp", "/email-otp/reset-password", "/email-otp/request-email-change", "/email-otp/change-email"],
  plugins: [
    emailOTP({
      otpLength: 6, expiresIn: 10 * 60, allowedAttempts: 5, storeOTP: "hashed", disableSignUp: true, overrideDefaultEmailVerification: true,
      sendVerificationOTP: async ({ email, otp, type }) => { if (type === "email-verification") sendEmail({ to: email, preview: `Código: ${otp}`, ...verificationCodeEmail(otp) }); },
    }),
    nextCookies(),
  ],
});
