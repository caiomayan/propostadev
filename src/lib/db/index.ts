import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as domain from "./schema";
import * as authSchema from "./auth-schema";

const globalDb = globalThis as unknown as { propostaPool?: Pool };
export const pool = globalDb.propostaPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalDb.propostaPool = pool;
export const db = drizzle(pool, { schema: { ...domain, ...authSchema } });
