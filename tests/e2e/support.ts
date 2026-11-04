import { createHash } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { Pool } from "pg";

async function withPool<T>(run: (pool: Pool) => Promise<T>) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { return await run(pool); } finally { await pool.end(); }
}

/** Cadastro leva à tela do código; o SMTP do E2E é fictício, então a confirmação é feita direto no banco. */
export async function confirmEmail(page: Page, email: string) {
  await expect(page).toHaveURL(/\/confirmar-email/);
  await withPool((pool) => pool.query('UPDATE "user" SET email_verified = true WHERE email = $1', [email]));
  await page.reload();
}

/** Troca o código guardado (com hash) por um conhecido, para digitar o código certo como uma pessoa faria. */
export async function plantEmailCode(email: string, code: string) {
  const hashed = createHash("sha256").update(code).digest("base64url");
  await withPool((pool) => pool.query("UPDATE verification SET value = $1 WHERE identifier = $2", [`${hashed}:0`, `email-verification-otp-${email}`]));
}

export const emailCodeCount = (email: string) => withPool(async (pool) => (await pool.query("SELECT 1 FROM verification WHERE identifier = $1 AND expires_at > now()", [`email-verification-otp-${email}`])).rowCount ?? 0);
export const expireEmailCode = (email: string) => withPool((pool) => pool.query("UPDATE verification SET expires_at = now() - interval '1 minute' WHERE identifier = $1", [`email-verification-otp-${email}`]));
