import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
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
