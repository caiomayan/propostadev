import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ toString: () => "" }) }));

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const created: string[] = [];
const oldPassword = "senha-antiga-segura-1";
const newPassword = "senha-nova-segura-2026";
const neutral = "Se esse e-mail estiver cadastrado";

describe.skipIf(!testUrl)("recuperação de senha (ticket 08)", () => {
  let info: MockInstance<typeof console.info>;
  beforeEach(() => { info = vi.spyOn(console, "info").mockImplementation(() => {}); });
  afterEach(async () => {
    vi.restoreAllMocks();
    const ids = created.splice(0);
    if (!ids.length) return;
    await pool.query("DELETE FROM verification WHERE value = ANY($1)", [ids]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [ids]);
  });
  afterAll(async () => { await pool.end(); });

  async function newUser() {
    const { auth } = await import("../../src/lib/auth/config");
    const email = `${randomUUID()}@test.example`;
    const { user } = await auth.api.signUpEmail({ body: { name: "Conta de teste", email, password: oldPassword } });
    created.push(user.id);
    return { auth, id: user.id, email };
  }
  // O modo console (sem SMTP, fora de produção) registra o link; é assim que o teste o captura.
  async function requestLink(email: string) {
    const { requestPasswordReset } = await import("../../src/lib/auth/actions");
    info.mockClear();
    const form = new FormData(); form.set("email", email);
    const result = await requestPasswordReset({}, form);
    const link = await vi.waitFor(() => {
      const line = info.mock.calls.map((call) => String(call[0])).find((text) => text.includes(email) && text.includes("reset-password"));
      if (!line) throw new Error("link ainda não registrado");
      return line.split("Link: ")[1];
    }, { timeout: 3000 }).catch(() => null);
    return { result, link, token: link ? new URL(link).pathname.split("/").pop()! : null };
  }
  async function reset(token: string, password = newPassword) {
    const { resetPassword } = await import("../../src/lib/auth/actions");
    const form = new FormData(); form.set("token", token); form.set("newPassword", password);
    return resetPassword({}, form);
  }

  it("responde a mesma mensagem neutra para e-mail existente e inexistente", async () => {
    const { email } = await newUser();
    const existing = await requestLink(email);
    const missing = await requestLink(`${randomUUID()}@test.example`);
    expect(existing.result).toEqual(missing.result);
    expect(existing.result.success).toContain(neutral);
    expect(existing.result.error).toBeUndefined();
    expect(existing.link).toContain("/reset-password/");
    expect(missing.link).toBeNull();
  });

  it("redefine com token válido, aceita a nova senha e recusa a antiga", async () => {
    const { auth, email } = await newUser();
    const { token } = await requestLink(email);
    expect((await reset(token!))?.error).toBeUndefined();
    await expect(auth.api.signInEmail({ body: { email, password: newPassword } })).resolves.toBeTruthy();
    await expect(auth.api.signInEmail({ body: { email, password: oldPassword } })).rejects.toBeTruthy();
  });

  it("recusa token reutilizado", async () => {
    const { auth, email } = await newUser();
    const { token } = await requestLink(email);
    expect((await reset(token!))?.error).toBeUndefined();
    const again = await reset(token!, "outra-senha-segura-2027");
    expect(again.error).toMatch(/inválido|expirou/);
    await expect(auth.api.signInEmail({ body: { email, password: newPassword } })).resolves.toBeTruthy();
  });

  it("recusa token expirado (validade de 1 hora) e não altera a senha", async () => {
    const { auth, email } = await newUser();
    const { token } = await requestLink(email);
    const row = await pool.query<{ ttl: number }>("SELECT extract(epoch FROM (expires_at - created_at)) AS ttl FROM verification WHERE identifier = $1", [`reset-password:${token}`]);
    expect(Math.round(row.rows[0].ttl)).toBe(3600);
    await pool.query("UPDATE verification SET expires_at = now() - interval '1 minute' WHERE identifier = $1", [`reset-password:${token}`]);
    expect((await reset(token!)).error).toMatch(/inválido|expirou/);
    await expect(auth.api.signInEmail({ body: { email, password: oldPassword } })).resolves.toBeTruthy();
  });

  it("recusa token inventado e senha fora de 12–128 caracteres sem consumir o token", async () => {
    const { email } = await newUser();
    expect((await reset("token-que-nao-existe")).error).toBeTruthy();
    const { token } = await requestLink(email);
    expect((await reset(token!, "curta")).error).toMatch(/12 a 128/);
    expect((await reset(token!, "a".repeat(129))).error).toMatch(/12 a 128/);
    expect((await reset(token!))?.error).toBeUndefined();
  });

  it("revoga as sessões abertas ao redefinir", async () => {
    const { auth, id, email } = await newUser();
    await auth.api.signInEmail({ body: { email, password: oldPassword } });
    await auth.api.signInEmail({ body: { email, password: oldPassword } });
    const sessions = () => pool.query<{ n: string }>("SELECT count(*) AS n FROM session WHERE user_id = $1", [id]).then((r) => Number(r.rows[0].n));
    expect(await sessions()).toBeGreaterThanOrEqual(2);
    const { token } = await requestLink(email);
    expect((await reset(token!))?.error).toBeUndefined();
    expect(await sessions()).toBe(0);
  });

  it("o cadastro não bloqueia o login mesmo com e-mail não verificado", async () => {
    const { auth, id, email } = await newUser();
    const verified = await pool.query<{ email_verified: boolean }>('SELECT email_verified FROM "user" WHERE id = $1', [id]);
    expect(verified.rows[0].email_verified).toBe(false);
    await expect(auth.api.signInEmail({ body: { email, password: oldPassword } })).resolves.toBeTruthy();
  });
});
