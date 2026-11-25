import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { grantAcceptance } from "./support";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ toString: () => "" }) }));

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const categoryId = randomUUID();
const typeA = randomUUID();
const typeB = randomUUID();
const userIds: string[] = [];
const sessionFor = (id: string, accountType: string | null, emailVerified = true) => ({ user: { id, accountType, emailVerified } });

async function newUser(type: "CLIENTE" | "PRESTADOR") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Conta de teste", `${id}@test.example`, type]);
  userIds.push(id);
  return id;
}
async function newProvider(typeId: string, opts: { name: string; vip?: boolean; active?: boolean; years?: number }) {
  const userId = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo,vip) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',$5,'p@test.example',now(),$6,$7)", [id, userId, id, opts.name, opts.years ?? 5, opts.active ?? true, opts.vip ?? false]);
  await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',20,true)", [id, typeId]);
  return { id, userId };
}
const interests = async (providerId: string) => Number((await pool.query<{ n: string }>("SELECT count(*) n FROM interesse_vip WHERE prestador_id=$1", [providerId])).rows[0].n);
const isVip = async (providerId: string) => (await pool.query<{ vip: boolean }>("SELECT vip FROM perfil_prestador WHERE id=$1", [providerId])).rows[0].vip;

describe.skipIf(!testUrl)("Prestador VIP (ticket 04)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'VIP teste',$2)", [categoryId, categoryId]);
    for (const id of [typeA, typeB]) await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Tipo VIP teste',$3)", [id, categoryId, `t-${id}`]);
  });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM mutation_rate_limit WHERE key = ANY($1)", [userIds.map((id) => `vip-interest:${id}`)]);
    await pool.query("DELETE FROM tipo_servico WHERE id = ANY($1::uuid[])", [[typeA, typeB]]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });
  beforeEach(() => mocks.getSession.mockReset());

  describe("Destaque VIP", () => {
    it("traz só VIP ativo que atende ao filtro, no máximo 3, por nota e depois nome", async () => {
      const { searchVipHighlight } = await import("@/modules/search/queries");
      const { searchSchema } = await import("@/modules/search/validation");
      const client = await newUser("CLIENTE");
      const [zeta, beta, alfa, delta] = await Promise.all(["Zeta", "Beta", "Alfa", "Delta"].map((name) => newProvider(typeA, { name: `${name} ${typeA}`, vip: true })));
      const comum = await newProvider(typeA, { name: `Comum ${typeA}` });
      const inativo = await newProvider(typeA, { name: `Inativo ${typeA}`, vip: true, active: false });
      const outro = await newProvider(typeB, { name: `Outro ${typeB}`, vip: true });
      await grantAcceptance(pool, client, zeta.id, typeA);
      await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [client, zeta.id]);
      const result = await searchVipHighlight(searchSchema.parse({ tipo: `t-${typeA}` }));
      expect(result.map((row) => row.providerId)).toEqual([zeta.id, alfa.id, beta.id]); // nota primeiro; depois nome (Alfa, Beta); Delta fica fora pelo limite
      expect(result.every((row) => row.vip)).toBe(true);
      const ids = result.map((row) => row.providerId);
      for (const excluded of [comum.id, inativo.id, outro.id, delta.id]) expect(ids).not.toContain(excluded);
      // filtro que ninguém VIP atende: faixa vazia
      expect(await searchVipHighlight(searchSchema.parse({ tipo: `t-${typeA}`, experiencia_min: "80" }))).toEqual([]);
      const other = await searchVipHighlight(searchSchema.parse({ tipo: `t-${typeB}` }));
      expect(other.map((row) => row.providerId)).toEqual([outro.id]);
    });
  });

  describe("Interesse no VIP", () => {
    it("Prestador registra uma única vez, sem escrever vip", async () => {
      const { registerVipInterest } = await import("@/modules/vip/actions");
      const provider = await newProvider(typeA, { name: `Interessado ${typeA}` });
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      expect(await registerVipInterest()).toEqual({ success: "Interesse registrado." });
      const first = (await pool.query("SELECT created_at FROM interesse_vip WHERE prestador_id=$1", [provider.id])).rows[0].created_at;
      expect(await registerVipInterest()).toEqual({ success: "Interesse registrado." });
      expect(await interests(provider.id)).toBe(1);
      expect((await pool.query("SELECT created_at FROM interesse_vip WHERE prestador_id=$1", [provider.id])).rows[0].created_at).toEqual(first);
      expect(await isVip(provider.id)).toBe(false);
    });
    it("recusa visitante, Cliente, e-mail não confirmado e Prestador sem perfil", async () => {
      const { registerVipInterest } = await import("@/modules/vip/actions");
      const provider = await newProvider(typeA, { name: `Recusado ${typeA}` });
      const client = await newUser("CLIENTE");
      const semPerfil = await newUser("PRESTADOR");
      mocks.getSession.mockResolvedValue(null);
      expect((await registerVipInterest()).error).toBeTruthy();
      mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
      expect((await registerVipInterest()).error).toMatch(/Prestador/);
      mocks.getSession.mockResolvedValue(sessionFor(semPerfil, "PRESTADOR"));
      expect((await registerVipInterest()).error).toMatch(/perfil/);
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR", false));
      expect((await registerVipInterest()).error).toMatch(/e-mail/i);
      expect(await interests(provider.id)).toBe(0);
    });
    it("aplica o rate limit de mutações", async () => {
      const { registerVipInterest } = await import("@/modules/vip/actions");
      const provider = await newProvider(typeA, { name: `Limite ${typeA}` });
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      let last = {} as Awaited<ReturnType<typeof registerVipInterest>>;
      for (let i = 0; i < 21; i++) last = await registerVipInterest();
      expect(last.error).toMatch(/Muitas alterações/);
      expect(await interests(provider.id)).toBe(1);
    });
  });

  describe("Neutralidade", () => {
    it("a Triagem e os compatíveis mantêm a ordem quando o Prestador vira VIP", async () => {
      const { prestadoresCompativeis } = await import("@/modules/triage/queries");
      const input = { tipoServicoId: typeB, orcamento: { tipo: "NAO_SEI" as const, min: null, max: null }, prazoDias: null };
      const a = await newProvider(typeB, { name: `Aaa ${typeB}` });
      const z = await newProvider(typeB, { name: `Zzz ${typeB}` });
      const before = (await prestadoresCompativeis(input as never)).map((row) => row.providerId);
      await pool.query("UPDATE perfil_prestador SET vip=true WHERE id=$1", [z.id]);
      const after = (await prestadoresCompativeis(input as never)).map((row) => row.providerId);
      expect(after).toEqual(before);
      expect(after.indexOf(a.id)).toBeLessThan(after.indexOf(z.id));
    });
  });
});
