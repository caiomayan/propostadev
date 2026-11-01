import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ toString: () => "" }) }));

const testUrl = process.env.DATABASE_URL_TEST;
const pool = new Pool({ connectionString: testUrl });
const categoryId = randomUUID();
const types = { fixos: randomUUID(), mistos: randomUUID(), poucos: randomUUID(), ordem: randomUUID(), vazio: randomUUID() };
const slug = (id: string) => `t-${id}`;
const userIds: string[] = [];
const sessionFor = (id: string, accountType: string | null) => ({ user: { id, accountType } });

async function newUser(type: "CLIENTE" | "PRESTADOR") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Conta de teste", `${id}@test.example`, type]);
  userIds.push(id);
  return id;
}
type OfferInput = { price: "FIXO" | "A_PARTIR_DE" | "INTERVALO" | "POR_HORA" | "SOB_CONSULTA"; min?: string; max?: string; days?: number | null; name?: string; active?: boolean };
async function newProvider(typeId: string, offer: OfferInput) {
  const userId = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,'p@test.example',now())", [id, userId, id, offer.name ?? `Prestador ${id}`]);
  await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,preco_maximo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.',$3,$4,$5,$6,$7,$8)",
    [id, typeId, offer.price, offer.min ?? null, offer.max ?? null, offer.days === null || offer.days === undefined ? "A_COMBINAR" : "FIXO", offer.days ?? null, offer.active ?? true]);
  return { id, userId };
}
async function projectCount(clientId: string) { return Number((await pool.query<{ n: string }>("SELECT count(*) AS n FROM projeto WHERE cliente_id=$1", [clientId])).rows[0].n); }
const draftForm = (tipo: string, extra: Record<string, string> = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ tipo, titulo: "Loja virtual para confeitaria", descricao: "Preciso de uma loja virtual com catálogo, carrinho e pagamento por Pix.", orcamento: "FAIXA", min: "1000", max: "3000", prazo: "45", ...extra })) form.set(key, value);
  return form;
};

describe.skipIf(!testUrl)("Triagem, Preço de referência e Projeto (ticket 04)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Triagem teste',$2)", [categoryId, categoryId]);
    for (const id of Object.values(types)) await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço de triagem',$3)", [id, categoryId, slug(id)]);
  });
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query("DELETE FROM avaliacao WHERE usuario_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id = ANY($1::uuid[])", [Object.values(types)]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  describe("precoReferencia", () => {
    it("FIXO 800/1000/1200 → média 1000,00 com n=3; inativas e por hora/sob consulta ficam fora", async () => {
      for (const min of ["800", "1000", "1200"]) await newProvider(types.fixos, { price: "FIXO", min });
      await newProvider(types.fixos, { price: "POR_HORA", min: "90" });
      await newProvider(types.fixos, { price: "SOB_CONSULTA" });
      await newProvider(types.fixos, { price: "FIXO", min: "50", active: false });
      const { precoReferencia } = await import("@/modules/triage/queries");
      const reference = await precoReferencia(types.fixos);
      expect(reference).toMatchObject({ mediaFixos: "1000.00", fixosN: 3, n: 3, suficiente: true, faixa: { min: "800.00", max: "1200.00" } });
    });

    it("faixa usa o mínimo de FIXO e A_PARTIR_DE e os dois extremos de INTERVALO", async () => {
      await newProvider(types.mistos, { price: "FIXO", min: "1000" });
      await newProvider(types.mistos, { price: "A_PARTIR_DE", min: "500" });
      await newProvider(types.mistos, { price: "INTERVALO", min: "700", max: "5000" });
      const { precoReferencia } = await import("@/modules/triage/queries");
      const reference = await precoReferencia(types.mistos);
      expect(reference.faixa).toEqual({ min: "500.00", max: "5000.00" });
      expect(reference.n).toBe(3);
      expect(reference.mediaFixos).toBeNull(); // só 1 FIXO: a regra de S07 exige 3 prestadores
      expect(reference.fixosN).toBe(1);
    });

    it("com n=2 é insuficiente: nem média nem faixa", async () => {
      await newProvider(types.poucos, { price: "FIXO", min: "800" });
      await newProvider(types.poucos, { price: "FIXO", min: "1200" });
      const { precoReferencia } = await import("@/modules/triage/queries");
      expect(await precoReferencia(types.poucos)).toMatchObject({ mediaFixos: null, faixa: null, n: 2, suficiente: false });
    });

    it("tipo sem oferta ou inexistente não quebra", async () => {
      const { precoReferencia } = await import("@/modules/triage/queries");
      expect(await precoReferencia(types.vazio)).toMatchObject({ n: 0, suficiente: false, faixa: null });
      expect(await precoReferencia(randomUUID())).toMatchObject({ n: 0, suficiente: false });
    });
  });

  describe("prestadoresCompativeis", () => {
    it("ordena por orçamento, prazo, nota e nome; desconhecido fica entre verdadeiro e falso; limita a 12", async () => {
      const { prestadoresCompativeis } = await import("@/modules/triage/queries");
      // teto 1000, prazo desejado 30
      const caro = await newProvider(types.ordem, { price: "FIXO", min: "5000", days: 10, name: "A caro e rápido" });
      const cabeNaoPrazo = await newProvider(types.ordem, { price: "FIXO", min: "900", days: 60, name: "B cabe sem prazo" });
      const cabeEPrazo = await newProvider(types.ordem, { price: "FIXO", min: "900", days: 20, name: "C cabe e prazo" });
      const sobConsulta = await newProvider(types.ordem, { price: "SOB_CONSULTA", days: 10, name: "D sob consulta" });
      const porHora = await newProvider(types.ordem, { price: "POR_HORA", min: "100", days: 10, name: "E por hora" });
      const empateA = await newProvider(types.ordem, { price: "FIXO", min: "800", days: 20, name: "F empate" });
      const notaBoa = await newProvider(types.ordem, { price: "FIXO", min: "800", days: 20, name: "Z nota alta" });
      const reviewer = [await newUser("CLIENTE"), await newUser("CLIENTE")];
      await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$3,5),($2,$3,4)", [reviewer[0], reviewer[1], notaBoa.id]);
      const result = await prestadoresCompativeis({ tipoServicoId: types.ordem, orcamento: { tipo: "ATE", min: null, max: "1000.00" }, prazoDias: 30 });
      expect(result.map((item) => item.providerId)).toEqual([notaBoa.id, cabeEPrazo.id, empateA.id, cabeNaoPrazo.id, sobConsulta.id, porHora.id, caro.id]);
      const byId = new Map(result.map((item) => [item.providerId, item]));
      expect(byId.get(notaBoa.id)).toMatchObject({ cabeOrcamento: true, cabePrazo: true, reviewCount: 2, rating: "4.5000000000000000", verificadas: 0 });
      expect(byId.get(cabeNaoPrazo.id)).toMatchObject({ cabeOrcamento: true, cabePrazo: false });
      expect(byId.get(sobConsulta.id)).toMatchObject({ cabeOrcamento: null, cabePrazo: true });
      expect(byId.get(porHora.id)?.cabeOrcamento).toBeNull();
      expect(byId.get(caro.id)).toMatchObject({ cabeOrcamento: false, cabePrazo: true });
      // sem teto e prazo flexível: tudo desconhecido, ordem por nota e nome
      const flexible = await prestadoresCompativeis({ tipoServicoId: types.ordem, orcamento: { tipo: "NAO_SEI", min: null, max: null }, prazoDias: null });
      expect(flexible.every((item) => item.cabeOrcamento === null && item.cabePrazo === null)).toBe(true);
      expect(flexible[0].providerId).toBe(notaBoa.id);
      for (let i = 0; i < 7; i++) await newProvider(types.ordem, { price: "FIXO", min: "700", days: 5, name: `Extra ${i}` });
      expect(await prestadoresCompativeis({ tipoServicoId: types.ordem, orcamento: { tipo: "NAO_SEI", min: null, max: null }, prazoDias: null })).toHaveLength(12);
    });

    it("ignora perfil inativo e oferta pausada ou de outro tipo", async () => {
      const { prestadoresCompativeis } = await import("@/modules/triage/queries");
      const paused = await newProvider(types.vazio, { price: "FIXO", min: "100", days: 5, active: false });
      const inactive = await newProvider(types.vazio, { price: "FIXO", min: "100", days: 5 });
      await pool.query("UPDATE perfil_prestador SET ativo=false WHERE id=$1", [inactive.id]);
      expect(paused.id).toBeTruthy();
      expect(await prestadoresCompativeis({ tipoServicoId: types.vazio, orcamento: { tipo: "NAO_SEI", min: null, max: null }, prazoDias: null })).toEqual([]);
    });
  });

  describe("Projeto: publicação e cancelamento", () => {
    it("só CLIENTE publica; Prestador, visitante e conta sem tipo são recusados", async () => {
      const { publishProject } = await import("@/modules/projects/actions");
      const provider = await newUser("PRESTADOR");
      mocks.getSession.mockResolvedValue(sessionFor(provider, "PRESTADOR"));
      expect(await publishProject({}, draftForm(slug(types.fixos)))).toMatchObject({ error: expect.stringContaining("Cliente") });
      mocks.getSession.mockResolvedValue(null);
      expect(await publishProject({}, draftForm(slug(types.fixos)))).toMatchObject({ error: expect.any(String) });
      mocks.getSession.mockResolvedValue(sessionFor(provider, null));
      expect(await publishProject({}, draftForm(slug(types.fixos)))).toMatchObject({ error: expect.any(String) });
      expect(await projectCount(provider)).toBe(0);
    });

    it("Cliente publica ABERTO com o próprio id da sessão, ignorando cliente_id do formulário", async () => {
      const { publishProject } = await import("@/modules/projects/actions");
      const client = await newUser("CLIENTE");
      const other = await newUser("CLIENTE");
      mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
      const form = draftForm(slug(types.fixos), { cliente_id: other, clientId: other });
      await publishProject({}, form);
      const rows = (await pool.query<{ cliente_id: string; status: string; orcamento_tipo: string; orcamento_min: string; orcamento_max: string; prazo_desejado_dias: number; proposta_aceita_id: string | null }>("SELECT * FROM projeto WHERE cliente_id = ANY($1)", [[client, other]])).rows;
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ cliente_id: client, status: "ABERTO", orcamento_tipo: "FAIXA", orcamento_min: "1000.00", orcamento_max: "3000.00", prazo_desejado_dias: 45, proposta_aceita_id: null });
    });

    it("recusa rascunho inválido e tipo inexistente sem criar Projeto", async () => {
      const { publishProject } = await import("@/modules/projects/actions");
      const client = await newUser("CLIENTE");
      mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
      expect(await publishProject({}, draftForm(slug(types.fixos), { titulo: "abc" }))).toMatchObject({ error: expect.any(String), fields: { titulo: expect.any(Array) } });
      expect(await publishProject({}, draftForm(slug(types.fixos), { orcamento: "FAIXA", min: "3000", max: "1000" }))).toMatchObject({ fields: { max: expect.any(Array) } });
      expect(await publishProject({}, draftForm("nao-existe"))).toMatchObject({ error: expect.any(String) });
      expect(await projectCount(client)).toBe(0);
    });

    it("outro Cliente e Prestador não cancelam; o dono cancela uma vez, e só se ABERTO", async () => {
      const { publishProject, cancelProject } = await import("@/modules/projects/actions");
      const { getClientProject } = await import("@/modules/projects/queries");
      const owner = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const provider = await newUser("PRESTADOR");
      mocks.getSession.mockResolvedValue(sessionFor(owner, "CLIENTE"));
      await publishProject({}, draftForm(slug(types.fixos)));
      const id = (await pool.query<{ id: string }>("SELECT id FROM projeto WHERE cliente_id=$1", [owner])).rows[0].id;
      const form = () => { const f = new FormData(); f.set("id", id); return f; };
      const status = async () => (await pool.query<{ status: string }>("SELECT status FROM projeto WHERE id=$1", [id])).rows[0].status;

      expect(await getClientProject(stranger, id)).toBeNull();
      expect(await getClientProject(owner, "não-é-uuid")).toBeNull();
      mocks.getSession.mockResolvedValue(sessionFor(stranger, "CLIENTE"));
      expect(await cancelProject({}, form())).toMatchObject({ error: expect.any(String) });
      mocks.getSession.mockResolvedValue(sessionFor(provider, "PRESTADOR"));
      expect(await cancelProject({}, form())).toMatchObject({ error: expect.any(String) });
      expect(await status()).toBe("ABERTO");

      mocks.getSession.mockResolvedValue(sessionFor(owner, "CLIENTE"));
      const bad = new FormData(); bad.set("id", "x");
      expect(await cancelProject({}, bad)).toMatchObject({ error: "Projeto inválido." });
      expect(await cancelProject({}, form())).toMatchObject({ success: expect.any(String) });
      expect(await status()).toBe("CANCELADO");
      expect(await cancelProject({}, form())).toMatchObject({ error: expect.any(String) });

      // ENCERRADO também não cancela
      await pool.query("UPDATE projeto SET status='ENCERRADO' WHERE id=$1", [id]);
      expect(await cancelProject({}, form())).toMatchObject({ error: expect.any(String) });
      expect(await status()).toBe("ENCERRADO");
    });
  });

  describe("constraints da tabela projeto", () => {
    const insert = async (budget: [string, string | null, string | null], days: number | null = 10, title = "Título válido") => {
      const client = await newUser("CLIENTE");
      return pool.query("INSERT INTO projeto(cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_min,orcamento_max,prazo_desejado_dias) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [client, types.fixos, title, "Descrição suficiente para o projeto de teste do banco.", ...budget, days]);
    };
    it("aceita combinações coerentes e recusa as incoerentes", async () => {
      await expect(insert(["NAO_SEI", null, null], null)).resolves.toBeTruthy();
      await expect(insert(["ATE", null, "500"])).resolves.toBeTruthy();
      await expect(insert(["FAIXA", "100", "100"])).resolves.toBeTruthy();
      await expect(insert(["NAO_SEI", "1", null])).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["ATE", "1", "500"])).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["ATE", null, null])).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["FAIXA", "500", "100"])).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["FAIXA", null, "100"])).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["FAIXA", "0", "100"])).rejects.toMatchObject({ code: "23514" });
    });
    it("limita prazo a 1–3650 e título a 5–120", async () => {
      await expect(insert(["NAO_SEI", null, null], 0)).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["NAO_SEI", null, null], 3651)).rejects.toMatchObject({ code: "23514" });
      await expect(insert(["NAO_SEI", null, null], 3650)).resolves.toBeTruthy();
      await expect(insert(["NAO_SEI", null, null], 5, "abc")).rejects.toMatchObject({ code: "23514" });
    });
  });
});
