import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";
import { userAdditionalFields } from "./user-fields";
import { socialProviderConfig } from "./providers";
import { sendEmail } from "@/lib/email/mailer";
import { passwordResetEmail, verificationEmail } from "@/lib/email/templates";

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
    sendResetPassword: async ({ user, url }) => { sendEmail({ to: user.email, link: url, ...passwordResetEmail(user.name, url) }); },
  },
  // Verificação não bloqueia o login (requireEmailVerification false); o painel mostra um aviso.
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => { sendEmail({ to: user.email, link: url, ...verificationEmail(user.name, url) }); },
  },
  // Vínculo automático por e-mail só quando o provedor marca o e-mail como verificado (padrão do Better Auth,
  // sem trustedProviders) e a conta local já confirmou o mesmo e-mail.
  socialProviders: socialProviderConfig(),
  rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
  databaseHooks: {
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
  plugins: [nextCookies()],
});
