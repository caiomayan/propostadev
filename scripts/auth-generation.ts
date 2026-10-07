import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";

// CLI-only configuration: generation does not open a database connection.
export const auth = betterAuth({
  database: drizzleAdapter(drizzle(process.env.DATABASE_URL ?? "postgres://localhost/propostadev"), { provider: "pg" }),
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
});
