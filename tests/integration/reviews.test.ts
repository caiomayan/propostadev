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
const typeId = randomUUID();
const userIds: string[] = [];
const message = "Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.";
const projectText = "Descrição suficiente para o projeto de teste do banco.";
const session = (id: string, accountType: string | null) => ({ user: { id, accountType } });
const n = async (sql: string, params: unknown[]) => Number((await pool.query<{ n: string }>(sql, params)).rows[0].n);
const form = (providerId: string, rating = 5, comment = "") => { const data = new FormData(); data.set("providerId", providerId); data.set("rating", String(rating)); data.set("comment", comment); return data; };

async function newUser(type: "CLIENTE" | "PRESTADOR") {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,tipo_conta) VALUES($1,$2,$3,$4)', [id, "Autor de teste", `${id}@test.example`, type]);
  userIds.push(id);
  return id;
}
async function newProvider() {
  const owner = await newUser("PRESTADOR");
  const id = randomUUID();
  await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em,ativo) VALUES($1,$2,$3,'PESSOA_FISICA','Prestador de avaliação','Descrição completa do perfil de desenvolvimento para teste.',5,'contato@test.example',now(),true)", [id, owner, id]);
  return { id, owner, slug: id };
}
async function openProject(clientId: string) {
  const id = randomUUID();
  await pool.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_max,prazo_desejado_dias,status) VALUES($1,$2,$3,'Projeto aberto',$4,'ATE',3000,30,'ABERTO')", [id, clientId, typeId, projectText]);
  return id;
}
/** Avaliação sem Aceite, como as do MVP 1: o trigger é desativado só nesta transação. */
async function legacyReview(userId: string, providerId: string, rating = 3) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("ALTER TABLE avaliacao DISABLE TRIGGER avaliacao_requer_aceite");
    await client.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,$3)", [userId, providerId, rating]);
    await client.query("ALTER TABLE avaliacao ENABLE TRIGGER avaliacao_requer_aceite");
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

describe.skipIf(!testUrl)("Avaliações verificadas (ticket 07)", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Avaliação teste',$2)", [categoryId, categoryId]);
    await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço de avaliação',$3)", [typeId, categoryId, typeId]);
  });
  beforeEach(() => { mocks.getSession.mockReset(); });
  afterAll(async () => {
    await pool.query("DELETE FROM avaliacao WHERE usuario_id = ANY($1)", [userIds]);
    await pool.query("DELETE FROM perfil_prestador WHERE usuario_id = ANY($1)", [userIds]);
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [userIds]);
    await pool.query("DELETE FROM tipo_servico WHERE id=$1", [typeId]);
    await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    await pool.end();
  });

  it("o trigger existe no banco com o nome exportado", async () => {
    const { REVIEW_ACCEPTANCE_TRIGGER } = await import("@/modules/reviews/rules");
    expect(await n("SELECT count(*) n FROM pg_trigger WHERE tgname=$1 AND tgrelid='avaliacao'::regclass AND NOT tgisinternal", [REVIEW_ACCEPTANCE_TRIGGER])).toBe(1);
  });

  describe("criação", () => {
    it("sem Aceite: a action e o INSERT direto no banco recusam", async () => {
      const { saveReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider();
      const client = await newUser("CLIENTE");
      mocks.getSession.mockResolvedValue(session(client, "CLIENTE"));
      expect((await saveReview({}, form(provider.id))).error).toContain("Proposta aceita");
      await expect(pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [client, provider.id])).rejects.toMatchObject({ code: "23514", message: expect.stringContaining("Proposta aceita") });
      expect(await n("SELECT count(*) n FROM avaliacao WHERE usuario_id=$1", [client])).toBe(0);
    });

    it("Proposta não ACEITA, ACEITA de outro Prestador ou ACEITA de outro Cliente não bastam", async () => {
      const { saveReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider(), other = await newProvider();
      const client = await newUser("CLIENTE"), stranger = await newUser("CLIENTE");
      await grantAcceptance(pool, stranger, provider.id, typeId); // Aceite de outro Cliente com este Prestador
      await grantAcceptance(pool, client, other.id, typeId); // Aceite deste Cliente com outro Prestador
      const open = await openProject(client);
      await pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,2000,30,$3,'PRE_SELECIONADA')", [open, provider.id, message]);
      mocks.getSession.mockResolvedValue(session(client, "CLIENTE"));
      expect((await saveReview({}, form(provider.id))).error).toContain("Proposta aceita");
      await expect(pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [client, provider.id])).rejects.toMatchObject({ code: "23514" });
    });

    it("com Aceite: a action cria; o id do usuário vem da sessão, não do formulário", async () => {
      const { saveReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider();
      const client = await newUser("CLIENTE"), forged = await newUser("CLIENTE");
      await grantAcceptance(pool, client, provider.id, typeId);
      mocks.getSession.mockResolvedValue(session(client, "CLIENTE"));
      const data = form(provider.id, 4, "Entregou no prazo.");
      data.set("userId", forged);
      expect((await saveReview({}, data)).success).toBeTruthy();
      expect((await pool.query("SELECT usuario_id, nota FROM avaliacao WHERE prestador_id=$1", [provider.id])).rows).toEqual([{ usuario_id: client, nota: 4 }]);
    });

    it("Prestador e autoavaliação continuam recusados, mesmo com Aceite no banco", async () => {
      const { saveReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider(), other = await newProvider();
      mocks.getSession.mockResolvedValue(session(other.owner, "PRESTADOR"));
      expect((await saveReview({}, form(provider.id))).error).toContain("Cliente");
      await grantAcceptance(pool, provider.owner, provider.id, typeId);
      mocks.getSession.mockResolvedValue(session(provider.owner, "PRESTADOR"));
      expect((await saveReview({}, form(provider.id))).error).toContain("próprio perfil");
      await expect(pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [provider.owner, provider.id])).rejects.toMatchObject({ code: "23514", message: expect.stringContaining("próprio perfil") });
    });
  });

  describe("edição e exclusão", () => {
    it("só o autor edita e exclui; quem tem Avaliação antiga (sem Aceite) também", async () => {
      const { saveReview, deleteReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider();
      const author = await newUser("CLIENTE"), legacyAuthor = await newUser("CLIENTE"), legacyPrestador = await newUser("PRESTADOR"), stranger = await newUser("CLIENTE");
      await grantAcceptance(pool, author, provider.id, typeId);
      await legacyReview(legacyAuthor, provider.id, 2);
      await legacyReview(legacyPrestador, provider.id, 3);
      mocks.getSession.mockResolvedValue(session(author, "CLIENTE"));
      expect((await saveReview({}, form(provider.id, 5))).success).toBeTruthy();
      expect((await saveReview({}, form(provider.id, 3, "Revisado."))).success).toBeTruthy();
      expect((await pool.query("SELECT nota, comentario FROM avaliacao WHERE usuario_id=$1", [author])).rows).toEqual([{ nota: 3, comentario: "Revisado." }]);
      // Antigas: editar é UPDATE e não passa pelo trigger, em conta Cliente ou Prestador.
      mocks.getSession.mockResolvedValue(session(legacyAuthor, "CLIENTE"));
      expect((await saveReview({}, form(provider.id, 4))).success).toBeTruthy();
      mocks.getSession.mockResolvedValue(session(legacyPrestador, "PRESTADOR"));
      expect((await saveReview({}, form(provider.id, 1))).success).toBeTruthy();
      expect((await pool.query("SELECT usuario_id, nota FROM avaliacao WHERE usuario_id = ANY($1) ORDER BY nota", [[legacyAuthor, legacyPrestador]])).rows).toEqual([{ usuario_id: legacyPrestador, nota: 1 }, { usuario_id: legacyAuthor, nota: 4 }]);
      // Quem não é autor não toca nas dos outros: a exclusão mira só a sessão.
      mocks.getSession.mockResolvedValue(session(stranger, "CLIENTE"));
      expect((await deleteReview({}, form(provider.id))).success).toBeTruthy();
      expect(await n("SELECT count(*) n FROM avaliacao WHERE prestador_id=$1", [provider.id])).toBe(3);
      for (const id of [author, legacyAuthor, legacyPrestador]) {
        mocks.getSession.mockResolvedValue(session(id, id === legacyPrestador ? "PRESTADOR" : "CLIENTE"));
        expect((await deleteReview({}, form(provider.id))).success).toBeTruthy();
      }
      expect(await n("SELECT count(*) n FROM avaliacao WHERE prestador_id=$1", [provider.id])).toBe(0);
    });

    it("excluída a Avaliação, o Cliente com Aceite pode criar outra", async () => {
      const { saveReview, deleteReview } = await import("@/modules/reviews/actions");
      const provider = await newProvider(), client = await newUser("CLIENTE");
      await grantAcceptance(pool, client, provider.id, typeId);
      mocks.getSession.mockResolvedValue(session(client, "CLIENTE"));
      await saveReview({}, form(provider.id));
      await deleteReview({}, form(provider.id));
      expect((await saveReview({}, form(provider.id, 2))).success).toBeTruthy();
    });
  });

  describe("verificada e agregados", () => {
    it("flag derivada: nova com Aceite é verificada; antiga sem Aceite não é", async () => {
      const { getProviderReviews } = await import("@/modules/search/queries");
      const provider = await newProvider();
      const verified = await newUser("CLIENTE"), previous = await newUser("CLIENTE");
      await grantAcceptance(pool, verified, provider.id, typeId);
      await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [verified, provider.id]);
      await legacyReview(previous, provider.id, 2);
      const page = await getProviderReviews(provider.id, 1, previous);
      expect(Object.fromEntries(page.reviews.map((review) => [review.rating, review.verified]))).toEqual({ 5: true, 2: false });
      expect(page.own).toMatchObject({ rating: 2, verified: false });
      expect(page.canCreate).toBe(false);
      expect((await getProviderReviews(provider.id, 1, verified)).own).toMatchObject({ rating: 5, verified: true });
    });

    it("dois Aceites do mesmo Cliente em Projetos diferentes não duplicam a Avaliação nem as verificadas", async () => {
      const { getPublicProvider, searchProviders } = await import("@/modules/search/queries");
      const { searchSchema } = await import("@/modules/search/validation");
      const { listProposalsForTriage } = await import("@/modules/proposals/queries");
      const { prestadoresCompativeis } = await import("@/modules/triage/queries");
      const provider = await newProvider();
      await pool.query("INSERT INTO oferta_servico(prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,'Oferta de avaliação','Descrição completa do serviço de desenvolvimento para teste.','FIXO',1000,'FIXO',20,true)", [provider.id, typeId]);
      const twice = await newUser("CLIENTE"), once = await newUser("CLIENTE"), legacy = await newUser("CLIENTE");
      await grantAcceptance(pool, twice, provider.id, typeId);
      await grantAcceptance(pool, twice, provider.id, typeId);
      await grantAcceptance(pool, once, provider.id, typeId);
      await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$3,5),($2,$3,4)", [twice, once, provider.id]);
      await legacyReview(legacy, provider.id, 3);
      const profile = await getPublicProvider(provider.slug);
      expect(profile).toMatchObject({ reviewCount: 3, verifiedCount: 2 });
      expect(Number(profile?.rating)).toBe(4);
      const search = await searchProviders(searchSchema.parse({ tipo: typeId }));
      expect(search.results.filter((row) => row.providerId === provider.id)).toHaveLength(1);
      expect(search.results.find((row) => row.providerId === provider.id)).toMatchObject({ reviewCount: 3, verifiedCount: 2 });
      const compatible = await prestadoresCompativeis({ tipoServicoId: typeId, orcamento: { tipo: "NAO_SEI", min: null, max: null }, prazoDias: null });
      expect(compatible.filter((row) => row.providerId === provider.id)).toMatchObject([{ reviewCount: 3, verificadas: 2 }]);
      const open = await openProject(twice);
      await pool.query("INSERT INTO proposta(projeto_id,prestador_id,valor,prazo_dias,mensagem) VALUES($1,$2,2000,30,$3)", [open, provider.id, message]);
      expect(await listProposalsForTriage(twice, open)).toMatchObject([{ reviewCount: 3, verifiedCount: 2 }]);
    });
  });
});
