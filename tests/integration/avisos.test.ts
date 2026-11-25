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
const typeId = randomUUID();
const userIds: string[] = [];
const sessionFor = (id: string, accountType: string) => ({ user: { id, accountType, emailVerified: true } });
const message = "Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.";

async function newUser(type: "CLIENTE" | "PRESTADOR") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Conta de teste", `${id}@test.example`, type]);
  userIds.push(id);
  return id;
}
async function newProvider() {
  const userId = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo) VALUES($1,$2,$3,'PESSOA_FISICA','Prestador de aviso','Descrição completa do perfil de desenvolvimento para teste.',5,'p@test.example',now(),true)", [id, userId, `aviso-${id}`]);
  await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de teste','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',10,true)", [id, typeId]);
  return { id, userId };
}
async function newProject(clientId: string) {
  const id = randomUUID();
  await pool.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_max,status) VALUES($1,$2,$3,'Projeto de aviso','Descrição suficiente para o projeto de teste do banco.','ATE',3000,'ABERTO')", [id, clientId, typeId]);
  return id;
}
const form = (fields: Record<string, string>) => { const data = new FormData(); for (const [k, v] of Object.entries(fields)) data.set(k, v); return data; };
const avisosOf = async (userId: string) => (await pool.query<{ id: string; tipo: string; projeto_id: string; lido_em: Date | null }>("SELECT id,tipo,projeto_id,lido_em FROM aviso WHERE usuario_id=$1 ORDER BY created_at, id", [userId])).rows;
const tipos = async (userId: string) => (await avisosOf(userId)).map((row) => row.tipo);
const proposalOf = async (projectId: string, providerId: string) => (await pool.query<{ id: string }>("SELECT id FROM proposta WHERE projeto_id=$1 AND prestador_id=$2", [projectId, providerId])).rows[0].id;

describe.skipIf(!testUrl)("Avisos (extras do MVP 3)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Avisos teste',$2)", [categoryId, categoryId]);
    await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço de aviso',$3)", [typeId, categoryId, typeId]);
  });
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterAll(async () => {
    await pool.query("DELETE FROM projeto WHERE cliente_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id=$1", [typeId]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  it("Convite avisa só o Prestador convidado; convite repetido ou bloqueado não gera outro", async () => {
    const { inviteProvider } = await import("@/modules/projects/actions");
    const client = await newUser("CLIENTE");
    const invited = await newProvider(), other = await newProvider();
    const project = await newProject(client);
    mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
    expect(await inviteProvider({}, form({ projetoId: project, prestadorId: invited.id }))).toMatchObject({ success: expect.any(String) });
    expect(await inviteProvider({}, form({ projetoId: project, prestadorId: invited.id }))).toMatchObject({ error: expect.any(String) });
    expect(await avisosOf(invited.userId)).toMatchObject([{ tipo: "CONVITE_RECEBIDO", projeto_id: project, lido_em: null }]);
    expect(await avisosOf(other.userId)).toHaveLength(0);
    expect(await avisosOf(client)).toHaveLength(0);
    // Outro Cliente não convida para Projeto alheio: nada é gravado.
    const stranger = await newUser("CLIENTE");
    mocks.getSession.mockResolvedValue(sessionFor(stranger, "CLIENTE"));
    await inviteProvider({}, form({ projetoId: project, prestadorId: other.id }));
    expect(await avisosOf(other.userId)).toHaveLength(0);
  });

  it("Proposta enviada avisa só o Cliente dono; tentativa recusada não avisa", async () => {
    const { submitProposal } = await import("@/modules/proposals/actions");
    const client = await newUser("CLIENTE"), bystander = await newUser("CLIENTE");
    const provider = await newProvider();
    const project = await newProject(client);
    mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR"));
    const proposal = { projetoId: project, valor: "2500,00", prazo: "30", mensagem: message };
    await submitProposal({}, form(proposal));
    expect(await submitProposal({}, form(proposal))).toMatchObject({ error: expect.stringContaining("já enviou") });
    expect(await avisosOf(client)).toMatchObject([{ tipo: "PROPOSTA_RECEBIDA", projeto_id: project }]);
    expect(await avisosOf(provider.userId)).toHaveLength(0);
    expect(await avisosOf(bystander)).toHaveLength(0);
    await submitProposal({}, form({ ...proposal, projetoId: randomUUID() }));
    expect(await avisosOf(client)).toHaveLength(1);
  });

  it("pré-seleção e recusa avisam o Prestador; desfazer a pré-seleção e decisões bloqueadas não avisam", async () => {
    const { submitProposal, preselectProposal, unselectProposal, rejectProposal } = await import("@/modules/proposals/actions");
    const client = await newUser("CLIENTE"), stranger = await newUser("CLIENTE");
    const a = await newProvider(), b = await newProvider();
    const project = await newProject(client);
    for (const provider of [a, b]) { mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR")); await submitProposal({}, form({ projetoId: project, valor: "2500,00", prazo: "30", mensagem: message })); }
    const idA = await proposalOf(project, a.id);
    // Cliente alheio não decide: nada é gravado.
    mocks.getSession.mockResolvedValue(sessionFor(stranger, "CLIENTE"));
    expect(await preselectProposal({}, form({ propostaId: idA }))).toMatchObject({ error: expect.any(String) });
    expect(await tipos(a.userId)).toEqual([]);
    mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
    await preselectProposal({}, form({ propostaId: idA }));
    expect(await tipos(a.userId)).toEqual(["PROPOSTA_PRE_SELECIONADA"]);
    await unselectProposal({}, form({ propostaId: idA }));
    expect(await tipos(a.userId)).toEqual(["PROPOSTA_PRE_SELECIONADA"]);
    await rejectProposal({}, form({ propostaId: idA }));
    expect(await tipos(a.userId)).toEqual(["PROPOSTA_PRE_SELECIONADA", "PROPOSTA_RECUSADA"]);
    expect(await rejectProposal({}, form({ propostaId: idA }))).toMatchObject({ error: expect.any(String) });
    expect(await tipos(a.userId)).toHaveLength(2);
    expect(await tipos(b.userId)).toEqual([]);
  });

  it("aceite avisa o vencedor (ACEITA) e cada Prestador recusado automaticamente; quem já tinha retirado não recebe", async () => {
    const { submitProposal, acceptProposal, withdrawProposal } = await import("@/modules/proposals/actions");
    const client = await newUser("CLIENTE");
    const winner = await newProvider(), loser = await newProvider(), withdrawn = await newProvider();
    const project = await newProject(client);
    for (const provider of [winner, loser, withdrawn]) { mocks.getSession.mockResolvedValue(sessionFor(provider.userId, "PRESTADOR")); await submitProposal({}, form({ projetoId: project, valor: "2500,00", prazo: "30", mensagem: message })); }
    mocks.getSession.mockResolvedValue(sessionFor(withdrawn.userId, "PRESTADOR"));
    await withdrawProposal({}, form({ propostaId: await proposalOf(project, withdrawn.id) }));
    mocks.getSession.mockResolvedValue(sessionFor(client, "CLIENTE"));
    await acceptProposal({}, form({ propostaId: await proposalOf(project, winner.id) }));
    expect(await tipos(winner.userId)).toEqual(["PROPOSTA_ACEITA"]);
    expect(await tipos(loser.userId)).toEqual(["PROPOSTA_RECUSADA"]);
    expect(await tipos(withdrawn.userId)).toEqual([]);
    expect(await tipos(client)).toEqual(["PROPOSTA_RECEBIDA", "PROPOSTA_RECEBIDA", "PROPOSTA_RECEBIDA"]);
    // Segundo aceite perde: nenhum Aviso novo.
    expect(await acceptProposal({}, form({ propostaId: await proposalOf(project, loser.id) }))).toMatchObject({ error: expect.any(String) });
    expect(await tipos(loser.userId)).toEqual(["PROPOSTA_RECUSADA"]);
  });

  it("ler, abrir e marcar como lido só afetam os Avisos do próprio usuário; contagem em uma consulta", async () => {
    const { countUnread, listAvisos, openAviso, markAllRead } = await import("@/modules/avisos/queries");
    const me = await newUser("PRESTADOR"), them = await newUser("PRESTADOR"), client = await newUser("CLIENTE");
    const project = await newProject(client);
    for (const user of [me, me, them]) await pool.query("INSERT INTO aviso(usuario_id,tipo,projeto_id) VALUES($1,'CONVITE_RECEBIDO',$2)", [user, project]);
    expect(await countUnread(me)).toBe(2);
    expect(await countUnread(them)).toBe(1);
    expect(await countUnread(client)).toBe(0);
    const mine = await listAvisos(me);
    expect(mine).toHaveLength(2);
    expect(mine.every((item) => item.projectTitle === "Projeto de aviso" && !item.read)).toBe(true);
    // Abrir o Aviso de outra pessoa: vai à lista e não marca nada.
    const theirId = (await avisosOf(them))[0].id;
    expect(await openAviso(me, theirId)).toBe("/painel/avisos");
    expect((await avisosOf(them))[0].lido_em).toBeNull();
    expect(await openAviso(me, "não-é-uuid")).toBe("/painel/avisos");
    expect(await openAviso(me, mine[0].id)).toBe(`/painel/oportunidades/${project}`);
    const readAt = (await avisosOf(me)).find((row) => row.id === mine[0].id)!.lido_em;
    expect(readAt).not.toBeNull();
    expect(await countUnread(me)).toBe(1);
    // Abrir de novo não muda a data de leitura.
    await openAviso(me, mine[0].id);
    expect((await avisosOf(me)).find((row) => row.id === mine[0].id)!.lido_em).toEqual(readAt);
    await markAllRead(me);
    expect((await avisosOf(me)).every((row) => row.lido_em)).toBe(true);
    expect((await avisosOf(them))[0].lido_em).toBeNull();
  });

  it("a lista traz no máximo 50, dos mais recentes, e o Aviso de um Projeto apagado some sem quebrar", async () => {
    const { listAvisos } = await import("@/modules/avisos/queries");
    const me = await newUser("PRESTADOR"), client = await newUser("CLIENTE");
    const gone = await newProject(client), kept = await newProject(client);
    await pool.query("INSERT INTO aviso(usuario_id,tipo,projeto_id,created_at) VALUES($1,'CONVITE_RECEBIDO',$2,now() - interval '1 day')", [me, gone]);
    await pool.query("INSERT INTO aviso(usuario_id,tipo,projeto_id,created_at) SELECT $1,'CONVITE_RECEBIDO',$2,now() - (g || ' minutes')::interval FROM generate_series(1,55) g", [me, kept]);
    expect(await listAvisos(me)).toHaveLength(50);
    await pool.query("DELETE FROM projeto WHERE id=$1", [gone]);
    const after = await listAvisos(me);
    expect(after).toHaveLength(50);
    expect(after.every((item) => item.projectId === kept)).toBe(true);
  });

  it("a ação de marcar todos como lidos usa a sessão e ignora visitante", async () => {
    const { markAllAvisosRead } = await import("@/modules/avisos/actions");
    const me = await newUser("PRESTADOR"), them = await newUser("PRESTADOR"), client = await newUser("CLIENTE");
    const project = await newProject(client);
    for (const user of [me, them]) await pool.query("INSERT INTO aviso(usuario_id,tipo,projeto_id) VALUES($1,'CONVITE_RECEBIDO',$2)", [user, project]);
    mocks.getSession.mockResolvedValue(null);
    await markAllAvisosRead();
    expect((await avisosOf(me))[0].lido_em).toBeNull();
    mocks.getSession.mockResolvedValue(sessionFor(me, "PRESTADOR"));
    await markAllAvisosRead();
    expect((await avisosOf(me))[0].lido_em).not.toBeNull();
    expect((await avisosOf(them))[0].lido_em).toBeNull();
  });
});
