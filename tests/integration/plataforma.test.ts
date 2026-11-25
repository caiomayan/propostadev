import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ toString: () => "" }) }));

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const userIds: string[] = [];
const staff = `equipe-${randomUUID()}@test.example`;
const sessionFor = (id: string, email: string, emailVerified = true) => ({ user: { id, email, emailVerified, accountType: "CLIENTE" } });

async function newUser(email: string) {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Conta de teste", email, "PRESTADOR"]);
  userIds.push(id);
  return id;
}
async function newProvider(opts: { vip?: boolean; interest?: boolean }) {
  const userId = await newUser(`p-${randomUUID()}@test.example`);
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo,vip) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',3,'p@test.example',now(),true,$5)", [id, userId, id, `Plataforma ${id}`, opts.vip ?? false]);
  if (opts.interest) await pool.query("INSERT INTO interesse_vip(prestador_id) VALUES($1)", [id]);
  return { id, userId };
}
// updated_at é mantido por trigger do banco; o resto da linha tem de ficar intacto.
const row = async (id: string) => { const found = (await pool.query("SELECT * FROM perfil_prestador WHERE id=$1", [id])).rows[0]; delete found.updated_at; return found; };
const interests = async (id: string) => Number((await pool.query<{ n: string }>("SELECT count(*) n FROM interesse_vip WHERE prestador_id=$1", [id])).rows[0].n);
const form = (providerId: unknown) => { const data = new FormData(); data.set("providerId", String(providerId)); return data; };

describe.skipIf(!testUrl)("Painel da plataforma (ticket 02)", () => {
  afterAll(async () => {
    await pool.query("DELETE FROM mutation_rate_limit WHERE key LIKE 'plataforma-vip:%'");
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.end();
  });
  beforeEach(() => { mocks.getSession.mockReset(); vi.stubEnv("PLATAFORMA_EMAILS", ` ${staff.toUpperCase()} , outro@test.example`); });

  it("a página recusa (404) visitante, quem não é da Equipe e e-mail não confirmado", async () => {
    const { requirePlataforma } = await import("@/lib/auth/plataforma");
    mocks.getSession.mockResolvedValue(null);
    await expect(requirePlataforma()).rejects.toThrow("NEXT_NOT_FOUND");
    mocks.getSession.mockResolvedValue(sessionFor("u1", "alguem@test.example"));
    await expect(requirePlataforma()).rejects.toThrow("NEXT_NOT_FOUND");
    mocks.getSession.mockResolvedValue(sessionFor("u2", staff, false));
    await expect(requirePlataforma()).rejects.toThrow("NEXT_NOT_FOUND");
    mocks.getSession.mockResolvedValue(sessionFor("u3", staff));
    await expect(requirePlataforma()).resolves.toBeTruthy();
    vi.stubEnv("PLATAFORMA_EMAILS", "");
    await expect(requirePlataforma()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("as ações recusam quem não é da Equipe, inclusive o próprio Prestador, e não mudam nada", async () => {
    const { grantVip, revokeVip } = await import("@/modules/plataforma/actions");
    const pedinte = await newProvider({ interest: true });
    const vip = await newProvider({ vip: true });
    const equipeSemConfirmar = await newUser(`nc-${randomUUID()}@test.example`);
    vi.stubEnv("PLATAFORMA_EMAILS", `nc-${equipeSemConfirmar}@x.example`);
    for (const session of [null, sessionFor(pedinte.userId, `p@test.example`), sessionFor(equipeSemConfirmar, staff, false)]) {
      mocks.getSession.mockResolvedValue(session);
      expect((await grantVip({}, form(pedinte.id))).error).toBeTruthy();
      expect((await revokeVip({}, form(vip.id))).error).toBeTruthy();
    }
    vi.stubEnv("PLATAFORMA_EMAILS", staff);
    mocks.getSession.mockResolvedValue(sessionFor(pedinte.userId, "prestador@test.example")); // o autor do pedido não se concede VIP
    expect((await grantVip({}, form(pedinte.id))).error).toBeTruthy();
    expect((await row(pedinte.id)).vip).toBe(false);
    expect((await row(vip.id)).vip).toBe(true);
  });

  it("valida o id do Prestador no servidor", async () => {
    const { grantVip } = await import("@/modules/plataforma/actions");
    mocks.getSession.mockResolvedValue(sessionFor("u3", staff));
    for (const bad of ["", "nao-e-uuid", "1; DROP TABLE perfil_prestador"]) expect((await grantVip({}, form(bad))).error).toBe("Prestador inválido.");
    expect((await grantVip({}, form(randomUUID()))).error).toBe("Prestador não encontrado.");
    expect((await grantVip({}, new FormData())).error).toBe("Prestador inválido.");
  });

  it("conceder e retirar mudam só a coluna vip e o Interesse no VIP continua registrado", async () => {
    const { grantVip, revokeVip } = await import("@/modules/plataforma/actions");
    const provider = await newProvider({ interest: true });
    const before = await row(provider.id);
    mocks.getSession.mockResolvedValue(sessionFor("u3", staff));
    expect(await grantVip({}, form(provider.id))).toEqual({ success: "VIP concedido." });
    const granted = await row(provider.id);
    expect(granted.vip).toBe(true);
    expect({ ...granted, vip: false }).toEqual(before);
    expect(await interests(provider.id)).toBe(1);
    expect(await revokeVip({}, form(provider.id))).toEqual({ success: "VIP retirado." });
    expect(await row(provider.id)).toEqual(before);
    expect(await interests(provider.id)).toBe(1);
  });

  it("as listas separam quem pediu (não VIP) de quem é VIP; conceder move o Prestador de uma para a outra", async () => {
    const { listVipProviders, listVipRequests } = await import("@/modules/plataforma/queries");
    const { grantVip } = await import("@/modules/plataforma/actions");
    const pediu = await newProvider({ interest: true });
    const semPedido = await newProvider({});
    const jaVip = await newProvider({ vip: true, interest: true });
    const ids = async (list: () => Promise<{ providerId: string }[]>) => (await list()).map((r) => r.providerId);
    expect(await ids(listVipRequests)).toContain(pediu.id);
    expect(await ids(listVipRequests)).not.toContain(semPedido.id);
    expect(await ids(listVipRequests)).not.toContain(jaVip.id);
    expect(await ids(listVipProviders)).toContain(jaVip.id);
    expect(await ids(listVipProviders)).not.toContain(pediu.id);
    mocks.getSession.mockResolvedValue(sessionFor("u3", staff));
    await grantVip({}, form(pediu.id));
    expect(await ids(listVipRequests)).not.toContain(pediu.id);
    expect(await ids(listVipProviders)).toContain(pediu.id);
    expect((await (await listVipProviders()).find((r) => r.providerId === pediu.id))?.requestedAt).toBeInstanceOf(Date);
  });
});
