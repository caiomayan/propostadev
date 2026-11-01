import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ toString: () => "" }) }));

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const created: string[] = [];

async function newUser(type: "CLIENTE" | "PRESTADOR" | null) {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Conta de teste", `${id}@test.example`, type]);
  created.push(id);
  return id;
}
const sessionFor = (id: string, accountType: string | null) => ({ user: { id, accountType } });
async function count(sql: string, params: unknown[]) { return Number((await pool.query<{ n: string }>(sql, params)).rows[0].n); }
async function tipoDe(id: string) { return (await pool.query<{ tipo_conta: string | null }>('SELECT tipo_conta FROM "user" WHERE id=$1', [id])).rows[0].tipo_conta; }

describe.skipIf(!testUrl)("tipo de conta (ticket 03)", () => {
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterEach(async () => {
    const ids = created.splice(0);
    if (!ids.length) return;
    await pool.query("DELETE FROM oferta_servico WHERE prestador_id IN (SELECT id FROM perfil_prestador WHERE usuario_id = ANY($1))", [ids]);
    await pool.query("DELETE FROM avaliacao WHERE usuario_id = ANY($1) OR prestador_id IN (SELECT id FROM perfil_prestador WHERE usuario_id = ANY($1))", [ids]);
    await pool.query("DELETE FROM perfil_prestador WHERE usuario_id = ANY($1)", [ids]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [ids]);
  });
  afterAll(async () => { await pool.end(); });

  it("o banco aceita só CLIENTE, PRESTADOR ou nulo", async () => {
    await expect(newUser(null)).resolves.toBeTruthy();
    await expect(pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [randomUUID(), "x", `${randomUUID()}@test.example`, "ADMIN"])).rejects.toMatchObject({ code: "23514" });
  });

  it("tipo definido é imutável no banco, mas nulo pode ser definido uma vez", async () => {
    const id = await newUser(null);
    await pool.query("UPDATE \"user\" SET tipo_conta='CLIENTE' WHERE id=$1", [id]);
    await expect(pool.query("UPDATE \"user\" SET tipo_conta='PRESTADOR' WHERE id=$1", [id])).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query('UPDATE "user" SET tipo_conta=NULL WHERE id=$1', [id])).rejects.toMatchObject({ code: "23514" });
    await pool.query("UPDATE \"user\" SET name='Outro nome' WHERE id=$1", [id]);
    expect(await tipoDe(id)).toBe("CLIENTE");
  });

  it("setAccountType define uma única vez e recusa troca", async () => {
    const { setAccountType } = await import("@/lib/auth/account-type");
    const id = await newUser(null);
    expect(await setAccountType(id, "PRESTADOR")).toBe(true);
    expect(await setAccountType(id, "CLIENTE")).toBe(false);
    expect(await tipoDe(id)).toBe("PRESTADOR");
  });

  it("backfill da migration: com perfil vira PRESTADOR, sem perfil vira CLIENTE", async () => {
    const statement = readFileSync("drizzle/0002_tipo-conta.sql", "utf8").split("--> statement-breakpoint").map((part) => part.trim()).find((part) => /UPDATE "user"/.test(part));
    expect(statement).toBeTruthy();
    const withProfile = await newUser(null);
    const withoutProfile = await newUser(null);
    await pool.query("INSERT INTO perfil_prestador(usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,'PESSOA_FISICA','Perfil legado','Descrição de teste suficientemente longa para o perfil.',5,'publico@test.example',now())", [withProfile, randomUUID()]);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Simula a coluna recém-criada: ninguém tem tipo (contas de execuções E2E anteriores já têm) e sem o trigger de imutabilidade.
      await client.query('ALTER TABLE "user" DISABLE TRIGGER user_tipo_conta_imutavel');
      await client.query('UPDATE "user" SET tipo_conta = NULL');
      await client.query(statement!);
      const rows = await client.query<{ id: string; tipo_conta: string }>('SELECT id,tipo_conta FROM "user" WHERE id = ANY($1)', [[withProfile, withoutProfile]]);
      const byId = Object.fromEntries(rows.rows.map((row) => [row.id, row.tipo_conta]));
      expect(byId[withProfile]).toBe("PRESTADOR");
      expect(byId[withoutProfile]).toBe("CLIENTE");
    } finally { await client.query("ROLLBACK"); client.release(); }
  });

  it("o cliente do Better Auth não consegue definir o tipo no sign-up nem no update", async () => {
    const { auth } = await import("@/lib/auth/config");
    const email = `${randomUUID()}@test.example`;
    await expect(auth.api.signUpEmail({ body: { email, password: "Proposta-test-password-2026", name: "Conta forjada", accountType: "PRESTADOR" } as never })).rejects.toBeTruthy();
    expect(await count('SELECT count(*) n FROM "user" WHERE email=$1', [email])).toBe(0);
    const signed = await auth.api.signUpEmail({ body: { email, password: "Proposta-test-password-2026", name: "Conta nova" }, returnHeaders: true });
    created.push(signed.response.user.id);
    const cookie = signed.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    await expect(auth.api.updateUser({ body: { accountType: "PRESTADOR" } as never, headers: new Headers({ cookie }) })).rejects.toBeTruthy();
    expect(await tipoDe(signed.response.user.id)).toBeNull();
  });

  it("Cliente não cria perfil nem oferta", async () => {
    const { saveProvider } = await import("@/modules/providers/actions");
    const { saveOffer } = await import("@/modules/offers/actions");
    const id = await newUser("CLIENTE");
    mocks.getSession.mockResolvedValue(sessionFor(id, "CLIENTE"));
    const profile = new FormData();
    for (const [key, value] of Object.entries({ type: "PESSOA_FISICA", displayName: "Cliente tentando", description: "Descrição de teste suficientemente longa para o perfil.", yearsExperience: "3", contactEmail: "c@test.example", country: "BR", contactConsent: "on" })) profile.set(key, value);
    expect((await saveProvider({}, profile)).error).toContain("Prestador");
    expect(await count("SELECT count(*) n FROM perfil_prestador WHERE usuario_id=$1", [id])).toBe(0);
    const offer = new FormData();
    offer.set("serviceTypeId", randomUUID());
    expect((await saveOffer({}, offer)).error).toContain("Prestador");
    expect(await count("SELECT count(*) n FROM oferta_servico o JOIN perfil_prestador p ON p.id=o.prestador_id WHERE p.usuario_id=$1", [id])).toBe(0);
  });

  it("Prestador não avalia", async () => {
    const { saveReview } = await import("@/modules/reviews/actions");
    const owner = await newUser("PRESTADOR");
    const reviewer = await newUser("PRESTADOR");
    const providerId = randomUUID();
    await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,$3,'PESSOA_FISICA','Perfil alvo','Descrição de teste suficientemente longa para o perfil.',5,'publico@test.example',now())", [providerId, owner, providerId]);
    mocks.getSession.mockResolvedValue(sessionFor(reviewer, "PRESTADOR"));
    const form = new FormData();
    form.set("providerId", providerId);
    form.set("rating", "5");
    expect((await saveReview({}, form)).error).toContain("Cliente");
    expect(await count("SELECT count(*) n FROM avaliacao WHERE usuario_id=$1", [reviewer])).toBe(0);
    // Cliente continua podendo avaliar (a verificação por Aceite é o ticket 07).
    const cliente = await newUser("CLIENTE");
    mocks.getSession.mockResolvedValue(sessionFor(cliente, "CLIENTE"));
    expect((await saveReview({}, form)).success).toBeTruthy();
  });
});
