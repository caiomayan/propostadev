import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { grantAcceptance } from "./support";
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
const userIds: string[] = [];
const sessionFor = (id: string, accountType: string | null) => ({ user: { id, accountType } });
const message = "Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.";
const idForm = (id: string) => { const form = new FormData(); form.set("propostaId", id); return form; };
const count = async (sql: string, params: unknown[]) => Number((await pool.query<{ n: string }>(sql, params)).rows[0].n);

async function newUser(type: "CLIENTE" | "PRESTADOR", name = "Cliente Teste Silva") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, name, `${id}@test.example`, type]);
  userIds.push(id);
  return { id, email: `${id}@test.example` };
}
async function newProvider(name = "Prestador de teste") {
  const user = await newUser("PRESTADOR", name);
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,telefone,contatos_publicados_em,ativo) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,$5,'+5583999990000',now(),true)", [id, user.id, id, `${name} ${id.slice(0, 6)}`, `contato-${id}@prestador.example`]);
  await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',20,true)", [id, typeA]);
  return { id, userId: user.id, contactEmail: `contato-${id}@prestador.example` };
}
async function newProject(clientId: string, status = "ABERTO") {
  const id = randomUUID();
  await pool.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_max,prazo_desejado_dias,status) VALUES($1,$2,$3,'Projeto de teste','Descrição suficiente para o projeto de teste do banco.','ATE',3000,30,$4)", [id, clientId, typeA, status]);
  return id;
}
async function newProposal(projectId: string, providerId: string, extra: { valor?: string; prazo?: number; status?: string } = {}) {
  const id = randomUUID();
  await pool.query("INSERT INTO proposta(id,projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,$3,$4,$5,$6,$7)", [id, projectId, providerId, extra.valor ?? "2000", extra.prazo ?? 30, message, extra.status ?? "ENVIADA"]);
  return id;
}
const statusOf = async (id: string) => (await pool.query<{ status: string }>("SELECT status FROM proposta WHERE id=$1", [id])).rows[0].status;
const projectRow = async (id: string) => (await pool.query<{ status: string; proposta_aceita_id: string | null }>("SELECT status,proposta_aceita_id FROM projeto WHERE id=$1", [id])).rows[0];

describe.skipIf(!testUrl)("Triagem de Propostas e Aceite (ticket 06)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Aceite teste',$2)", [categoryId, categoryId]);
    await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço de aceite',$3)", [typeA, categoryId, typeA]);
  });
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id=$1", [typeA]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  describe("Aceite", () => {
    it("aceita uma Proposta: as demais ativas viram RECUSADA, a retirada fica como está e o Projeto é encerrado", async () => {
      const { acceptProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [a, b, c, d] = await Promise.all([newProvider(), newProvider(), newProvider(), newProvider()]);
      const winner = await newProposal(project, a.id, { status: "PRE_SELECIONADA" });
      const sent = await newProposal(project, b.id);
      const pre = await newProposal(project, c.id, { status: "PRE_SELECIONADA" });
      const withdrawn = await newProposal(project, d.id, { status: "RETIRADA" });
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      expect(await acceptProposal({}, idForm(winner))).toMatchObject({ success: expect.any(String) });
      expect(await projectRow(project)).toEqual({ status: "ENCERRADO", proposta_aceita_id: winner });
      expect(await statusOf(winner)).toBe("ACEITA");
      expect(await statusOf(sent)).toBe("RECUSADA");
      expect(await statusOf(pre)).toBe("RECUSADA");
      expect(await statusOf(withdrawn)).toBe("RETIRADA");
      // Depois do Aceite, nada mais muda.
      expect(await acceptProposal({}, idForm(sent))).toMatchObject({ error: expect.any(String) });
      expect(await statusOf(sent)).toBe("RECUSADA");
    });

    it("dois aceites concorrentes no mesmo Projeto: exatamente um ACEITA, Projeto ENCERRADO e as demais RECUSADA", async () => {
      const { acceptProposal } = await import("@/modules/proposals/actions");
      for (let round = 0; round < 3; round += 1) {
        const client = await newUser("CLIENTE");
        const project = await newProject(client.id);
        const providers = await Promise.all([newProvider(), newProvider(), newProvider()]);
        const [first, second, third] = await Promise.all(providers.map((provider) => newProposal(project, provider.id)));
        mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
        // Nunca lança: o perdedor devolve { error } amigável, não um 500.
        const results = await Promise.all([acceptProposal({}, idForm(first)), acceptProposal({}, idForm(second))]);
        expect(results.filter((result) => result.success)).toHaveLength(1);
        const loser = results.find((result) => !result.success);
        expect(loser?.error).toMatch(/não aceita mais essa proposta|encerrado/);
        const rows = (await pool.query<{ id: string; status: string }>("SELECT id,status FROM proposta WHERE projeto_id=$1", [project])).rows;
        const accepted = rows.filter((row) => row.status === "ACEITA");
        expect(accepted).toHaveLength(1);
        expect([first, second]).toContain(accepted[0].id);
        expect(rows.filter((row) => row.status === "RECUSADA").map((row) => row.id).sort()).toEqual([first, second, third].filter((id) => id !== accepted[0].id).sort());
        expect(await projectRow(project)).toEqual({ status: "ENCERRADO", proposta_aceita_id: accepted[0].id });
      }
    });

    it("a mesma Proposta aceita duas vezes ao mesmo tempo: um sucesso e uma mensagem amigável", async () => {
      const { acceptProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const provider = await newProvider();
      const proposal = await newProposal(project, provider.id);
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      const results = await Promise.all([acceptProposal({}, idForm(proposal)), acceptProposal({}, idForm(proposal)), acceptProposal({}, idForm(proposal))]);
      expect(results.filter((result) => result.success)).toHaveLength(1);
      expect(results.filter((result) => result.error)).toHaveLength(2);
      expect(await count("SELECT count(*) AS n FROM proposta WHERE projeto_id=$1 AND status='ACEITA'", [project])).toBe(1);
    });

    it("o índice único parcial é a última barreira: o banco recusa uma segunda ACEITA no Projeto", async () => {
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [a, b] = await Promise.all([newProvider(), newProvider()]);
      await newProposal(project, a.id, { status: "ACEITA" });
      await expect(newProposal(project, b.id, { status: "ACEITA" })).rejects.toMatchObject({ code: "23505", constraint: "proposta_aceita_por_projeto_unique" });
    });
  });

  describe("Transições do Cliente", () => {
    it("pré-seleciona, desmarca e recusa; recusa é definitiva (não volta para pré-seleção)", async () => {
      const { preselectProposal, unselectProposal, rejectProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const provider = await newProvider();
      const proposal = await newProposal(project, provider.id);
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      expect(await unselectProposal({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      expect(await preselectProposal({}, idForm(proposal))).toMatchObject({ success: expect.any(String) });
      expect(await statusOf(proposal)).toBe("PRE_SELECIONADA");
      expect(await preselectProposal({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      expect(await unselectProposal({}, idForm(proposal))).toMatchObject({ success: expect.any(String) });
      expect(await statusOf(proposal)).toBe("ENVIADA");
      expect(await preselectProposal({}, idForm(proposal))).toMatchObject({ success: expect.any(String) });
      expect(await rejectProposal({}, idForm(proposal))).toMatchObject({ success: expect.any(String) });
      expect(await statusOf(proposal)).toBe("RECUSADA");
      expect(await preselectProposal({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      expect(await unselectProposal({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      expect(await rejectProposal({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      expect(await statusOf(proposal)).toBe("RECUSADA");
    });

    it("Proposta retirada ou já aceita não aceita nenhuma transição do Cliente", async () => {
      const { preselectProposal, rejectProposal, acceptProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [a, b] = await Promise.all([newProvider(), newProvider()]);
      const withdrawn = await newProposal(project, a.id, { status: "RETIRADA" });
      const refused = await newProposal(project, b.id, { status: "RECUSADA" });
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      for (const id of [withdrawn, refused]) {
        for (const action of [preselectProposal, rejectProposal, acceptProposal]) expect(await action({}, idForm(id))).toMatchObject({ error: expect.any(String) });
      }
      expect(await statusOf(withdrawn)).toBe("RETIRADA");
      expect(await statusOf(refused)).toBe("RECUSADA");
      expect((await projectRow(project)).status).toBe("ABERTO");
    });

    it("Projeto ENCERRADO ou CANCELADO: todas as transições são recusadas e nada muda", async () => {
      const { preselectProposal, unselectProposal, rejectProposal, acceptProposal } = await import("@/modules/proposals/actions");
      const client = await newUser("CLIENTE");
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      for (const status of ["CANCELADO", "ENCERRADO"]) {
        const project = await newProject(client.id, status);
        const [a, b] = await Promise.all([newProvider(), newProvider()]);
        const sent = await newProposal(project, a.id);
        const pre = await newProposal(project, b.id, { status: "PRE_SELECIONADA" });
        for (const [action, id] of [[preselectProposal, sent], [unselectProposal, pre], [rejectProposal, sent], [rejectProposal, pre], [acceptProposal, sent], [acceptProposal, pre]] as const) {
          expect(await action({}, idForm(id))).toMatchObject({ error: expect.any(String) });
        }
        expect(await statusOf(sent)).toBe("ENVIADA");
        expect(await statusOf(pre)).toBe("PRE_SELECIONADA");
        expect((await projectRow(project)).status).toBe(status);
        expect((await projectRow(project)).proposta_aceita_id).toBeNull();
      }
    });

    it("quem não é o dono do Projeto não decide nada, mesmo conhecendo o id da Proposta", async () => {
      const { preselectProposal, rejectProposal, acceptProposal } = await import("@/modules/proposals/actions");
      const owner = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const project = await newProject(owner.id);
      const [a, b] = await Promise.all([newProvider(), newProvider()]);
      const sent = await newProposal(project, a.id);
      const pre = await newProposal(project, b.id, { status: "PRE_SELECIONADA" });
      mocks.getSession.mockResolvedValue(sessionFor(stranger.id, "CLIENTE"));
      for (const action of [preselectProposal, rejectProposal, acceptProposal]) expect(await action({}, idForm(sent))).toMatchObject({ error: expect.any(String) });
      expect(await rejectProposal({}, idForm(pre))).toMatchObject({ error: expect.any(String) });
      // O dono vem da sessão: um campo "clienteId" forjado no formulário não muda nada.
      const forged = idForm(sent); forged.set("clienteId", owner.id); forged.set("projetoId", project);
      expect(await acceptProposal({}, forged)).toMatchObject({ error: expect.any(String) });
      expect(await statusOf(sent)).toBe("ENVIADA");
      expect(await statusOf(pre)).toBe("PRE_SELECIONADA");
      expect(await projectRow(project)).toEqual({ status: "ABERTO", proposta_aceita_id: null });
    });

    it("Prestador (inclusive o autor da Proposta), visitante e conta sem tipo não decidem", async () => {
      const { preselectProposal, rejectProposal, acceptProposal } = await import("@/modules/proposals/actions");
      const owner = await newUser("CLIENTE");
      const project = await newProject(owner.id);
      const author = await newProvider();
      const proposal = await newProposal(project, author.id);
      const sessions = [sessionFor(author.userId, "PRESTADOR"), sessionFor(owner.id, null), null];
      for (const session of sessions) {
        mocks.getSession.mockResolvedValue(session);
        for (const action of [preselectProposal, rejectProposal, acceptProposal]) expect(await action({}, idForm(proposal))).toMatchObject({ error: expect.any(String) });
      }
      mocks.getSession.mockResolvedValue(sessionFor(owner.id, "CLIENTE"));
      for (const action of [preselectProposal, rejectProposal, acceptProposal]) expect(await action({}, idForm("não-é-uuid"))).toMatchObject({ error: "Proposta inválida." });
      expect(await statusOf(proposal)).toBe("ENVIADA");
      expect((await projectRow(project)).status).toBe("ABERTO");
    });
  });

  describe("Consulta de triagem", () => {
    it("ordena por valor, prazo e reputação; filtra pré-selecionadas; omite retiradas; ignora ordem inválida", async () => {
      const { listProposalsForTriage, parseTriageOrder } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [cheap, fast, famous, pre, gone, refused] = await Promise.all([1, 2, 3, 4, 5, 6].map(() => newProvider()));
      const pCheap = await newProposal(project, cheap.id, { valor: "1000", prazo: 40 });
      const pFast = await newProposal(project, fast.id, { valor: "2500", prazo: 10 });
      const pFamous = await newProposal(project, famous.id, { valor: "3000", prazo: 25 });
      const pPre = await newProposal(project, pre.id, { valor: "2000", prazo: 30, status: "PRE_SELECIONADA" });
      await newProposal(project, gone.id, { status: "RETIRADA" });
      const pRefused = await newProposal(project, refused.id, { valor: "500", prazo: 5, status: "RECUSADA" });
      const reviewer = await newUser("CLIENTE");
      await grantAcceptance(pool, reviewer.id, famous.id, typeA);
      await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota,comentario) VALUES($1,$2,5,'Excelente')", [reviewer.id, famous.id]);
      const ids = async (options: Parameters<typeof listProposalsForTriage>[2]) => (await listProposalsForTriage(client.id, project, options)).map((item) => item.id);

      // Padrão: pré-selecionadas, depois ENVIADAS da mais recente à mais antiga, recusadas por último.
      const sentNewestFirst = (await pool.query<{ id: string }>("SELECT id FROM proposta WHERE id = ANY($1) ORDER BY created_at DESC, id", [[pCheap, pFast, pFamous]])).rows.map((row) => row.id);
      expect(await ids({})).toEqual([pPre, ...sentNewestFirst, pRefused]);
      expect(await ids({ ordem: "valor" })).toEqual([pCheap, pPre, pFast, pFamous, pRefused]);
      expect(await ids({ ordem: "prazo" })).toEqual([pFast, pFamous, pPre, pCheap, pRefused]);
      expect((await ids({ ordem: "reputacao" }))[0]).toBe(pFamous);
      expect(await ids({ soPre: true })).toEqual([pPre]);
      expect(await ids({ soPre: true, ordem: "valor" })).toEqual([pPre]);
      expect(parseTriageOrder("drop")).toBeUndefined();
      const first = (await listProposalsForTriage(client.id, project))[0];
      expect(first).toMatchObject({ status: "PRE_SELECIONADA", amount: "2000.00", days: 30, reviewCount: 0, verifiedCount: 0 });
      const famousRow = (await listProposalsForTriage(client.id, project)).find((item) => item.id === pFamous);
      expect(famousRow).toMatchObject({ reviewCount: 1, verifiedCount: 1, rating: expect.stringMatching(/^5/) });
      // Outro Cliente não enxerga nada; a lista nunca carrega e-mails.
      expect(await listProposalsForTriage(stranger.id, project)).toEqual([]);
      expect(JSON.stringify(await listProposalsForTriage(client.id, project))).not.toContain("@");
    });
  });

  describe("Contatos depois do Aceite", () => {
    it("o Cliente dono vê os contatos do Prestador escolhido só com o Projeto ENCERRADO; outros recebem null", async () => {
      const { acceptProposal } = await import("@/modules/proposals/actions");
      const { getAcceptedProvider } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE");
      const stranger = await newUser("CLIENTE");
      const project = await newProject(client.id);
      const [chosen, other] = await Promise.all([newProvider("Escolhido"), newProvider("Outro")]);
      const chosenProposal = await newProposal(project, chosen.id);
      await newProposal(project, other.id);
      expect(await getAcceptedProvider(client.id, project)).toBeNull();
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      await acceptProposal({}, idForm(chosenProposal));
      const accepted = await getAcceptedProvider(client.id, project);
      expect(accepted).toMatchObject({ proposalId: chosenProposal, contactEmail: chosen.contactEmail, phone: "+5583999990000", active: true });
      expect(JSON.stringify(accepted)).not.toContain(other.contactEmail);
      expect(await getAcceptedProvider(stranger.id, project)).toBeNull();
      expect(await getAcceptedProvider(client.id, "não-é-uuid")).toBeNull();
      const cancelled = await newProject(client.id, "CANCELADO");
      expect(await getAcceptedProvider(client.id, cancelled)).toBeNull();
    });

    it("o e-mail do Cliente só é visível ao Prestador da Proposta ACEITA, e em nenhum outro caso", async () => {
      const { acceptProposal } = await import("@/modules/proposals/actions");
      const { listMyProposals, getOpportunity, listOpportunities } = await import("@/modules/proposals/queries");
      const client = await newUser("CLIENTE", "Maria Aparecida Souza");
      const project = await newProject(client.id);
      const openProject = await newProject(client.id);
      const [winner, loser, bystander] = await Promise.all([newProvider(), newProvider(), newProvider()]);
      const winnerProposal = await newProposal(project, winner.id);
      const loserProposal = await newProposal(project, loser.id);
      const openProposal = await newProposal(openProject, winner.id, { status: "PRE_SELECIONADA" });
      const everything = async (providerUserId: string) => JSON.stringify([await listMyProposals(providerUserId), await listOpportunities(providerUserId), await getOpportunity(providerUserId, project), await getOpportunity(providerUserId, openProject)]);

      // Antes do Aceite ninguém vê o e-mail nem o nome completo.
      for (const provider of [winner, loser, bystander]) {
        const text = await everything(provider.userId);
        expect(text).not.toContain(client.email);
        expect(text).not.toContain("Aparecida");
      }
      mocks.getSession.mockResolvedValue(sessionFor(client.id, "CLIENTE"));
      await acceptProposal({}, idForm(winnerProposal));

      const mine = await listMyProposals(winner.userId);
      expect(mine.find((item) => item.id === winnerProposal)?.client).toEqual({ name: "Maria Aparecida Souza", email: client.email });
      // Outra Proposta do mesmo Prestador, em Projeto ainda aberto, não revela o Cliente.
      expect(mine.find((item) => item.id === openProposal)?.client).toBeNull();
      // O Prestador recusado do mesmo Projeto e quem nem propôs não veem nada.
      expect((await listMyProposals(loser.userId)).find((item) => item.id === loserProposal)).toMatchObject({ status: "RECUSADA", client: null });
      for (const provider of [loser, bystander]) {
        const text = await everything(provider.userId);
        expect(text).not.toContain(client.email);
        expect(text).not.toContain("Aparecida");
      }
      // Nem as Oportunidades do vencedor trazem o e-mail: o primeiro nome continua sendo tudo que elas expõem.
      const opportunities = JSON.stringify([await listOpportunities(winner.userId), await getOpportunity(winner.userId, project), await getOpportunity(winner.userId, openProject)]);
      expect(opportunities).not.toContain(client.email);
      expect(opportunities).not.toContain("Aparecida");
    });
  });
});
