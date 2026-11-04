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
const typeA = randomUUID();
const typeB = randomUUID();
const userIds: string[] = [];
const extraTypes: string[] = [];
const sessionFor = (id: string, accountType: string | null) => ({ user: { id, accountType, emailVerified: true } });
const message = "Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.";

async function newUser(type: "CLIENTE" | "PRESTADOR", name = "Conta de teste") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, name, `${id}@test.example`, type]);
  userIds.push(id);
  return { id, email: `${id}@test.example` };
}
async function newProvider(typeId: string | null, opts: { active?: boolean; offerActive?: boolean; name?: string } = {}) {
  const user = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,'p@test.example',now(),$5)", [id, user.id, id, opts.name ?? `Prestador ${id}`, opts.active ?? true]);
  if (typeId) await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',20,$3)", [id, typeId, opts.offerActive ?? true]);
  return { id, userId: user.id };
}
async function newProject(clientId: string, typeId = typeA, status = "ABERTO") {
  const id = randomUUID();
  await pool.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_max,status) VALUES($1,$2,$3,'Projeto de teste','Descrição suficiente para o projeto de teste do banco.','ATE',3000,$4)", [id, clientId, typeId, status]);
  return id;
}
const proposalForm = (projectId: string, extra: Record<string, string> = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ projetoId: projectId, valor: "2500,00", prazo: "30", mensagem: message, ...extra })) form.set(key, value);
  return form;
};
const idForm = (name: string, id: string, extra: Record<string, string> = {}) => { const form = new FormData(); form.set(name, id); for (const [k, v] of Object.entries(extra)) form.set(k, v); return form; };
const proposalRow = async (projectId: string, providerId: string) => (await pool.query<{ id: string; status: string; valor: string; prazo_dias: number }>("SELECT id,status,valor,prazo_dias FROM proposta WHERE projeto_id=$1 AND prestador_id=$2", [projectId, providerId])).rows[0];
const count = async (sql: string, params: unknown[]) => Number((await pool.query<{ n: string }>(sql, params)).rows[0].n);

describe.skipIf(!testUrl)("Oportunidades, Propostas e Convites (ticket 05)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Propostas teste',$2)", [categoryId, categoryId]);
    for (const id of [typeA, typeB]) await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço de proposta',$3)", [id, categoryId, id]);
  });
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id = ANY($1::uuid[])", [[typeA, typeB, ...extraTypes]]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  describe("Proposta", () => {
    it("uma Proposta por par; valor guardado como decimal; segunda tentativa é recusada", async () => {
      const { submitProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const provider = await newProvider(typeA);
      const project = await newProject(client.id);
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      await submitProposal({}, proposalForm(project));
      expect(await proposalRow(project, provider.id)).toMatchObject({ status: "ENVIADA", valor: "2500.00", prazo_dias: 30 });
      expect(await submitProposal({}, proposalForm(project, { valor: "100" }))).toMatchObject({ error: expect.stringContaining("já enviou") });
      expect(await count("SELECT count(*) AS n FROM proposta WHERE projeto_id=$1", [project])).toBe(1);
      await expect(pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem) VALUES($1,$2,10,5,$3)", [project, provider.id, message])).rejects.toMatchObject({ code: "23505" });
    });

    it("Cliente, visitante e Prestador sem Oferta ativa no tipo não propõem; Projeto não aberto também não", async () => {
      const { submitProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.stringContaining("Prestador") });
      mocks.getSession.mockResolvedValue(null);
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.any(String) });
      const otherType = await newProvider(typeB);
      mocks.getSession.mockResolvedValue(sessionFor(otherType.userId, "PRESTADOR"));
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.stringContaining("não está disponível") });
      const paused = await newProvider(typeA, { offerActive: false });
      mocks.getSession.mockResolvedValue(sessionFor(paused.userId, "PRESTADOR"));
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.any(String) });
      const inactive = await newProvider(typeA, { active: false });
      mocks.getSession.mockResolvedValue(sessionFor(inactive.userId, "PRESTADOR"));
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.any(String) });
      const noProfile = await newUser("PRESTADOR");
      mocks.getSession.mockResolvedValue(sessionFor(noProfile.id, "PRESTADOR"));
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.any(String) });
      const ok = await newProvider(typeA);
      const cancelled = await newProject(client.id, typeA, "CANCELADO");
      mocks.getSession.mockResolvedValue(sessionFor(ok.userId, "PRESTADOR"));
      expect(await submitProposal({}, proposalForm(cancelled))).toMatchObject({ error: expect.stringContaining("não está disponível") });
      expect(await submitProposal({}, proposalForm("não-é-uuid"))).toMatchObject({ error: "Projeto inválido." });
      expect(await count("SELECT count(*) AS n FROM proposta WHERE projeto_id = ANY($1)", [[project, cancelled]])).toBe(0);
    });

    it("valida valor, prazo e mensagem sem criar Proposta", async () => {
      const { submitProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const provider = await newProvider(typeA);
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      for (const patch of [{ valor: "0" } as Record<string, string>, { valor: "abc" }, { valor: "100000000" }, { valor: "1.234,50" }, { prazo: "0" }, { prazo: "3651" }, { mensagem: "curta" }, { mensagem: "x".repeat(3001) }]) {
        expect(await submitProposal({}, proposalForm(project, patch))).toMatchObject({ error: expect.any(String), fields: expect.any(Object) });
      }
      expect(await proposalRow(project, provider.id)).toBeUndefined();
      await submitProposal({}, proposalForm(project, { valor: "99999999,99", prazo: "3650" }));
      expect(await proposalRow(project, provider.id)).toMatchObject({ valor: "99999999.99", prazo_dias: 3650 });
    });

    it("editar e retirar só em ENVIADA/PRE_SELECIONADA, com Projeto ABERTO e pelo dono", async () => {
      const { submitProposal, updateProposal, withdrawProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const provider = await newProvider(typeA);
      const rival = await newProvider(typeA);
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      await submitProposal({}, proposalForm(project));
      const { id } = await proposalRow(project, provider.id);
      const edit = (valor: string) => updateProposal({}, idForm("propostaId", id, { valor, prazo: "10", mensagem: message }));

      mocks.getSession.mockResolvedValue(sessionFor(rival.userId, "PRESTADOR"));
      expect(await edit("1")).toMatchObject({ error: expect.any(String) });
      expect(await withdrawProposal({}, idForm("propostaId", id))).toMatchObject({ error: expect.any(String) });
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      expect(await edit("1")).toMatchObject({ error: expect.any(String) });
      expect((await proposalRow(project, provider.id)).valor).toBe("2500.00");

      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      expect(await edit("1800,50")).toMatchObject({ success: expect.any(String) });
      expect(await proposalRow(project, provider.id)).toMatchObject({ valor: "1800.50", prazo_dias: 10 });
      await pool.query("UPDATE proposta SET status='PRE_SELECIONADA' WHERE id=$1", [id]);
      expect(await edit("1700")).toMatchObject({ success: expect.any(String) });
      expect((await proposalRow(project, provider.id)).status).toBe("PRE_SELECIONADA");

      for (const status of ["RECUSADA", "ACEITA", "RETIRADA"]) {
        await pool.query("UPDATE proposta SET status=$2 WHERE id=$1", [id, status]);
        expect(await edit("1")).toMatchObject({ error: expect.any(String) });
        expect(await withdrawProposal({}, idForm("propostaId", id))).toMatchObject({ error: expect.any(String) });
        expect((await proposalRow(project, provider.id)).status).toBe(status);
      }
      await pool.query("UPDATE proposta SET status='ENVIADA' WHERE id=$1", [id]);
      await pool.query("UPDATE projeto SET status='CANCELADO' WHERE id=$1", [project]);
      expect(await edit("1")).toMatchObject({ error: expect.any(String) });
      expect(await withdrawProposal({}, idForm("propostaId", id))).toMatchObject({ error: expect.any(String) });
      await pool.query("UPDATE projeto SET status='ABERTO' WHERE id=$1", [project]);
      expect(await withdrawProposal({}, idForm("propostaId", id))).toMatchObject({ success: expect.any(String) });
      expect((await proposalRow(project, provider.id)).status).toBe("RETIRADA");
      // retirada é final: não dá para reenviar para o mesmo Projeto
      expect(await submitProposal({}, proposalForm(project))).toMatchObject({ error: expect.stringContaining("já enviou") });
    });

    it("banco: no máximo uma ACEITA por Projeto, checks e FK proposta_aceita_id com SET NULL", async () => {
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [a, b] = [await newProvider(typeA), await newProvider(typeA)];
      const insert = (providerId: string, status: string, valor = "10", prazo = 5, text = message) => pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id", [project, providerId, valor, prazo, text, status]);
      const accepted = (await insert(a.id, "ACEITA")).rows[0].id;
      await expect(insert(b.id, "ACEITA")).rejects.toMatchObject({ code: "23505" });
      await expect(insert(b.id, "ENVIADA", "0")).rejects.toMatchObject({ code: "23514" });
      await expect(insert(b.id, "ENVIADA", "10", 0)).rejects.toMatchObject({ code: "23514" });
      await expect(insert(b.id, "ENVIADA", "10", 3651)).rejects.toMatchObject({ code: "23514" });
      await expect(insert(b.id, "ENVIADA", "10", 5, "curta")).rejects.toMatchObject({ code: "23514" });
      await expect(insert(b.id, "ENVIADA", "100000000")).rejects.toMatchObject({ code: "22003" });
      await expect(insert(b.id, "RECUSADA")).resolves.toBeTruthy();
      await pool.query("UPDATE projeto SET status='ENCERRADO', proposta_aceita_id=$2 WHERE id=$1", [project, accepted]);
      await pool.query("DELETE FROM proposta WHERE id=$1", [accepted]);
      expect((await pool.query("SELECT proposta_aceita_id FROM projeto WHERE id=$1", [project])).rows[0].proposta_aceita_id).toBeNull();
    });
  });

  describe("Oportunidades", () => {
    it("só aparecem Projetos ABERTOS do tipo da Oferta ativa; convidados primeiro; sem e-mail nem sobrenome do Cliente", async () => {
      const { listOpportunities, getOpportunity } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE", "Marina Souza Ferreira");
      const typeC = randomUUID();
      await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço isolado',$3)", [typeC, categoryId, typeC]);
      extraTypes.push(typeC);
      const provider = await newProvider(typeC);
      const older = await newProject(client.id, typeC);
      const invited = await newProject(client.id, typeC);
      const newer = await newProject(client.id, typeC);
      const otherType = await newProject(client.id, typeB);
      const closed = await newProject(client.id, typeC, "CANCELADO");
      await pool.query("UPDATE projeto SET created_at = now() - interval '2 days' WHERE id=$1", [invited]);
      await pool.query("UPDATE projeto SET created_at = now() - interval '1 day' WHERE id=$1", [older]);
      await pool.query("INSERT INTO convite(projeto_id,prestador_id) VALUES($1,$2)", [invited, provider.id]);

      const { standing, items } = await listOpportunities(provider.userId);
      expect(standing.state).toBe("ok");
      expect(items.map((item) => item.id)).toEqual([invited, newer, older]);
      expect(items[0].invited).toBe(true);
      expect(items[0].createdAt).toBeInstanceOf(Date);
      expect(items[1].invited).toBe(false);
      expect(items.map((item) => item.id)).not.toContain(otherType);
      expect(items.map((item) => item.id)).not.toContain(closed);
      const serialized = JSON.stringify(items);
      expect(serialized).not.toContain(client.email);
      expect(serialized).not.toContain("Souza");
      expect(serialized).not.toContain(client.id);
      expect(items[0].clientFirstName).toBe("Marina");
      expect((await getOpportunity(provider.userId, otherType)).item).toBeNull();
      expect((await getOpportunity(provider.userId, closed)).item).toBeNull();
      expect((await getOpportunity(provider.userId, "x")).item).toBeNull();
      expect((await getOpportunity(provider.userId, newer)).item).toMatchObject({ id: newer, eligible: true });
    });

    it("Prestador sem Oferta no tipo, com Oferta pausada, sem perfil ativo ou sem perfil não vê nada", async () => {
      const { listOpportunities, getOpportunity } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const wrongType = await newProvider(typeB);
      const paused = await newProvider(typeA, { offerActive: false });
      const inactive = await newProvider(typeA, { active: false });
      const bare = await newProvider(null);
      const noProfile = await newUser("PRESTADOR");
      expect(await listOpportunities(wrongType.userId)).toMatchObject({ standing: { state: "ok" }, items: expect.not.arrayContaining([expect.objectContaining({ id: project })]) });
      expect(await listOpportunities(paused.userId)).toMatchObject({ standing: { state: "sem-oferta" }, items: [] });
      expect(await listOpportunities(inactive.userId)).toMatchObject({ standing: { state: "inativo" }, items: [] });
      expect(await listOpportunities(bare.userId)).toMatchObject({ standing: { state: "sem-oferta" }, items: [] });
      expect(await listOpportunities(noProfile.id)).toMatchObject({ standing: { state: "sem-perfil" }, items: [] });
      for (const who of [wrongType, paused, inactive, bare]) expect((await getOpportunity(who.userId, project)).item).toBeNull();
    });

    it("Minhas propostas lista com o estado do Projeto e mantém o detalhe somente leitura após o encerramento", async () => {
      const { submitProposal } = await import("@/modules/proposals/actions");
      const { listMyProposals, getOpportunity } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const provider = await newProvider(typeA);
      mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
      await submitProposal({}, proposalForm(project));
      await pool.query("UPDATE projeto SET status='CANCELADO' WHERE id=$1", [project]);
      expect(await listMyProposals(provider.userId)).toEqual([expect.objectContaining({ projectId: project, status: "ENVIADA", projectStatus: "CANCELADO", amount: "2500.00" })]);
      expect((await getOpportunity(provider.userId, project)).item).toMatchObject({ status: "CANCELADO", eligible: false, proposal: { status: "ENVIADA" } });
      expect(await listMyProposals((await newUser("PRESTADOR")).id)).toEqual([]);
    });
  });

  describe("Convites", () => {
    it("só o dono de Projeto ABERTO convida, só Prestador compatível, sem repetir", async () => {
      const { inviteProvider } = await import("@/modules/projects/actions");
      const owner = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const providerUser = await newUser("PRESTADOR");
      const project = await newProject(owner.id);
      const compatible = await newProvider(typeA);
      const form = (projectId: string, providerId: string) => { const f = new FormData(); f.set("projetoId", projectId); f.set("prestadorId", providerId); return f; };
      const invites = () => count("SELECT count(*) AS n FROM convite WHERE projeto_id=$1", [project]);

      mocks.getSession.mockResolvedValue(sessionFor(stranger.id, "CLIENTE"));
      expect(await inviteProvider({}, form(project, compatible.id))).toMatchObject({ error: expect.any(String) });
      mocks.getSession.mockResolvedValue(sessionFor(providerUser.id, "PRESTADOR"));
      expect(await inviteProvider({}, form(project, compatible.id))).toMatchObject({ error: expect.any(String) });
      mocks.getSession.mockResolvedValue(null);
      expect(await inviteProvider({}, form(project, compatible.id))).toMatchObject({ error: expect.any(String) });
      expect(await invites()).toBe(0);

      mocks.getSession.mockResolvedValue(sessionFor(owner.id, "CLIENTE"));
      for (const bad of [await newProvider(typeB), await newProvider(typeA, { offerActive: false }), await newProvider(typeA, { active: false }), await newProvider(null)]) {
        expect(await inviteProvider({}, form(project, bad.id))).toMatchObject({ error: expect.stringContaining("compatíveis") });
      }
      expect(await inviteProvider({}, form(project, randomUUID()))).toMatchObject({ error: expect.stringContaining("compatíveis") });
      expect(await inviteProvider({}, form("x", compatible.id))).toMatchObject({ error: "Convite inválido." });
      expect(await invites()).toBe(0);

      expect(await inviteProvider({}, form(project, compatible.id))).toMatchObject({ success: expect.any(String) });
      expect(await inviteProvider({}, form(project, compatible.id))).toMatchObject({ error: expect.stringContaining("já foi convidado") });
      expect(await invites()).toBe(1);

      await pool.query("UPDATE projeto SET status='CANCELADO' WHERE id=$1", [project]);
      const another = await newProvider(typeA);
      expect(await inviteProvider({}, form(project, another.id))).toMatchObject({ error: expect.any(String) });
      expect(await invites()).toBe(1);
    });

    it("limita a 10 convites por Projeto, inclusive em pedidos concorrentes", async () => {
      const { inviteProvider } = await import("@/modules/projects/actions");
      const owner = await newUser("CLIENTE");
      const project = await newProject(owner.id);
      const providers = await Promise.all(Array.from({ length: 13 }, () => newProvider(typeA)));
      mocks.getSession.mockResolvedValue(sessionFor(owner.id, "CLIENTE"));
      const form = (providerId: string) => { const f = new FormData(); f.set("projetoId", project); f.set("prestadorId", providerId); return f; };
      for (const provider of providers.slice(0, 8)) await inviteProvider({}, form(provider.id));
      const results = await Promise.all(providers.slice(8).map((provider) => inviteProvider({}, form(provider.id))));
      expect(results.filter((result) => result.success)).toHaveLength(2);
      expect(results.filter((result) => result.error?.includes("limite"))).toHaveLength(3);
      expect(await count("SELECT count(*) AS n FROM convite WHERE projeto_id=$1", [project])).toBe(10);
    });
  });

  describe("Contador de Propostas do Cliente", () => {
    it("conta ENVIADA e PRE_SELECIONADA por Projeto, só do próprio Cliente", async () => {
      const { listClientProjects } = await import("@/modules/projects/queries");
      const { listProposalsForTriage } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const empty = await newProject(client.id);
      const providers = await Promise.all([1, 2, 3, 4].map(() => newProvider(typeA)));
      for (const [index, status] of ["ENVIADA", "PRE_SELECIONADA", "RECUSADA", "RETIRADA"].entries()) await pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,100,5,$3,$4)", [project, providers[index].id, message, status]);
      const rows = await listClientProjects(client.id);
      expect(rows.find((row) => row.id === project)?.proposalCount).toBe(2);
      expect(rows.find((row) => row.id === empty)?.proposalCount).toBe(0);
      expect((await listProposalsForTriage(client.id, project)).map((item) => item.status).sort()).toEqual(["ENVIADA", "PRE_SELECIONADA", "RECUSADA"]);
      expect(JSON.stringify(await listProposalsForTriage(client.id, project))).not.toContain("@");
      expect(await listProposalsForTriage(stranger.id, project)).toEqual([]);
    });
  });
});
