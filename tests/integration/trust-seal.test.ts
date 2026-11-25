import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../src/lib/db";
import { searchProviders, getPublicProvider } from "../../src/modules/search/queries";
import { searchSchema } from "../../src/modules/search/validation";
import { prestadoresCompativeis } from "../../src/modules/triage/queries";
import { getTrustCriteria } from "../../src/modules/reviews/queries";
import { grantAcceptance } from "./support";

const categoryId = randomUUID();
const typeId = randomUUID();
const keyword = randomUUID();
const userIds: string[] = [];
const tag = (name: string) => `${keyword} ${name}`;
type Scenario = { name: string; emailVerified: boolean; verified: number[]; legacy: number[] };
const scenarios: Scenario[] = [
  { name: "selo", emailVerified: true, verified: [5], legacy: [] },
  { name: "limite", emailVerified: true, verified: [4], legacy: [] },
  { name: "sem avaliação", emailVerified: true, verified: [], legacy: [] },
  { name: "email pendente", emailVerified: false, verified: [5], legacy: [] },
  { name: "média baixa", emailVerified: true, verified: [3, 4], legacy: [] },
  { name: "só antigas", emailVerified: true, verified: [], legacy: [5, 5] },
  { name: "duas contratações", emailVerified: true, verified: [5, 4], legacy: [1] },
];
const providers = new Map<string, { id: string; slug: string; ownerId: string }>();
let created = false;

async function newUser(emailVerified: boolean) {
  const id = randomUUID();
  await pool.query('INSERT INTO "user"(id,name,email,email_verified) VALUES($1,$2,$3,$4)', [id, "Autor", `${id}@test.example`, emailVerified]);
  userIds.push(id);
  return id;
}

describe.skipIf(!process.env.DATABASE_URL_TEST)("Selo de confiança", () => {
  beforeAll(async () => {
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Selo teste',$2)", [categoryId, categoryId]);
    await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço do selo',$3)", [typeId, categoryId, typeId]);
    for (const scenario of scenarios) {
      const ownerId = await newUser(scenario.emailVerified);
      const id = randomUUID();
      await pool.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,'publico@test.example',now())", [id, ownerId, id, tag(scenario.name)]);
      await pool.query("INSERT INTO oferta_servico(id,prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,$3,'Oferta do selo','Descrição completa do serviço de desenvolvimento para teste.','FIXO',500,'FIXO',30,true)", [randomUUID(), id, typeId]);
      for (const rating of scenario.verified) {
        const author = await newUser(true);
        await grantAcceptance(pool, author, id, typeId);
        await pool.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,$3)", [author, id, rating]);
        // Segundo Aceite do mesmo Cliente: não pode duplicar contagem nem média.
        await grantAcceptance(pool, author, id, typeId);
      }
      for (const rating of scenario.legacy) {
        const author = await newUser(true);
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query("ALTER TABLE avaliacao DISABLE TRIGGER avaliacao_requer_aceite");
          await client.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,$3)", [author, id, rating]);
          await client.query("ALTER TABLE avaliacao ENABLE TRIGGER avaliacao_requer_aceite");
          await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
      }
      providers.set(scenario.name, { id, slug: id, ownerId });
    }
    created = true;
  });
  afterAll(async () => {
    if (created) {
      await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [userIds]);
      await pool.query("DELETE FROM tipo_servico WHERE id=$1", [typeId]);
      await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    }
    await pool.end();
  });

  const expected: Record<string, boolean> = { selo: true, limite: true, "sem avaliação": false, "email pendente": false, "média baixa": false, "só antigas": false, "duas contratações": true };

  it("a busca marca o selo só de quem cumpre os três critérios", async () => {
    const { results } = await searchProviders(searchSchema.parse({ q: keyword }));
    expect(results).toHaveLength(scenarios.length);
    for (const scenario of scenarios) {
      const row = results.find((item) => item.providerId === providers.get(scenario.name)!.id);
      expect(row?.trusted, scenario.name).toBe(expected[scenario.name]);
    }
  });

  it("o Perfil público traz o mesmo veredito e agregados sem duplicação", async () => {
    for (const scenario of scenarios) {
      const profile = await getPublicProvider(providers.get(scenario.name)!.slug);
      expect(profile?.trusted, scenario.name).toBe(expected[scenario.name]);
    }
    const two = await getPublicProvider(providers.get("duas contratações")!.slug);
    expect(two?.verifiedCount).toBe(2);
    expect(two?.reviewCount).toBe(3);
  });

  it("os Prestadores compatíveis da Triagem trazem o selo", async () => {
    const compatible = await prestadoresCompativeis({ tipoServicoId: typeId, orcamento: { tipo: "NAO_SEI", min: null, max: null }, prazoDias: null });
    expect(compatible).toHaveLength(scenarios.length);
    for (const scenario of scenarios) {
      expect(compatible.find((item) => item.providerId === providers.get(scenario.name)!.id)?.trusted, scenario.name).toBe(expected[scenario.name]);
    }
  });

  it("a média das verificadas ignora as Avaliações antigas e fica exata em decimal", async () => {
    const two = await getTrustCriteria(providers.get("duas contratações")!.id);
    expect(two).toMatchObject({ emailVerified: true, verifiedCount: 2, verifiedAverage: "4.5", trusted: true });
    const low = await getTrustCriteria(providers.get("média baixa")!.id);
    expect(low).toMatchObject({ verifiedCount: 2, verifiedAverage: "3.5", trusted: false });
    const border = await getTrustCriteria(providers.get("limite")!.id);
    expect(border).toMatchObject({ verifiedAverage: "4.0", trusted: true });
  });

  it("o checklist mostra o critério que falta", async () => {
    const pending = await getTrustCriteria(providers.get("email pendente")!.id);
    expect(pending).toMatchObject({ emailVerified: false, verifiedCount: 1, trusted: false });
    const none = await getTrustCriteria(providers.get("sem avaliação")!.id);
    expect(none).toMatchObject({ emailVerified: true, verifiedCount: 0, verifiedAverage: null, trusted: false });
    const legacy = await getTrustCriteria(providers.get("só antigas")!.id);
    expect(legacy).toMatchObject({ verifiedCount: 0, verifiedAverage: null, trusted: false });
  });
});
