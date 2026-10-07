import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { user } from "../../src/lib/db/auth-schema";

const testUrl = process.env.DATABASE_URL_TEST;
if (testUrl && process.env.DATABASE_URL_DEVELOPMENT && new URL(testUrl).pathname === new URL(process.env.DATABASE_URL_DEVELOPMENT).pathname) throw new Error("DATABASE_URL_TEST deve nomear banco diferente do desenvolvimento.");
const pool = new Pool({ connectionString: testUrl });
let client: PoolClient;
let owner: string;
let reviewer: string;
let provider: string;
let service: string;

async function fixture(connection: PoolClient) {
  const ids = { owner: randomUUID(), reviewer: randomUUID(), provider: randomUUID(), service: randomUUID(), category: randomUUID() };
  await drizzle(connection).insert(user).values([{ id: ids.owner, name: "Dono de teste", email: `${ids.owner}@test.example` }, { id: ids.reviewer, name: "Autor de teste", email: `${ids.reviewer}@test.example` }]);
  await connection.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Categoria de teste',$2)", [ids.category, ids.category]);
  await connection.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Tipo de teste',$3)", [ids.service, ids.category, ids.service]);
  await connection.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,$3,'PESSOA_FISICA','Perfil de teste','Descrição de teste suficientemente longa para o perfil.',5,'publico@test.example',now())", [ids.provider, ids.owner, ids.provider]);
  return ids;
}
async function offer(connection: PoolClient, providerId: string, serviceId: string, active = false) {
  const id = randomUUID();
  await connection.query("INSERT INTO oferta_servico(id,prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,$3,'Oferta de teste','Descrição de teste suficientemente longa para a oferta.','FIXO',1000,'FIXO',10,$4)", [id, providerId, serviceId, active]);
  return id;
}
async function rejected(sql: string, params: unknown[]) {
  await client.query("SAVEPOINT invalid_payload");
  try { await expect(client.query(sql, params)).rejects.toMatchObject({ code: "23514" }); }
  finally { await client.query("ROLLBACK TO SAVEPOINT invalid_payload"); }
}

describe.skipIf(!testUrl)("constraints reais do PostgreSQL", () => {
  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
    ({ owner, reviewer, provider, service } = await fixture(client));
  });
  afterEach(async () => { await client.query("ROLLBACK"); client.release(); });
  afterAll(async () => { await pool.end(); });

  it("recusa nota inválida e self-review em inserção e edição", async () => {
    await rejected("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,6)", [reviewer, provider]);
    await rejected("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,4)", [owner, provider]);
    const saved = await client.query<{ id: string }>("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,4) RETURNING id", [reviewer, provider]);
    await client.query("SAVEPOINT duplicate_review");
    await expect(client.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$2,5)", [reviewer, provider])).rejects.toMatchObject({ code: "23505" });
    await client.query("ROLLBACK TO SAVEPOINT duplicate_review");
    await rejected("UPDATE avaliacao SET usuario_id=$1 WHERE id=$2", [owner, saved.rows[0].id]);
    await rejected("UPDATE perfil_prestador SET usuario_id=$1 WHERE id=$2", [reviewer, provider]);
  });
  it("recusa preços/prazos incompletos, invertidos e exclusão ativa", async () => {
    const id = await offer(client, provider, service);
    await rejected("UPDATE oferta_servico SET preco_minimo=NULL WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET tipo_preco='INTERVALO',preco_maximo=999 WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET tipo_preco='INTERVALO',preco_maximo=NULL WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET tipo_preco='SOB_CONSULTA' WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET prazo_minimo_dias=NULL WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET tipo_prazo='INTERVALO',prazo_maximo_dias=9 WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET tipo_prazo='A_COMBINAR' WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET prazo_minimo_dias=3651 WHERE id=$1", [id]);
    await rejected("UPDATE oferta_servico SET deleted_at=now(),ativo=true WHERE id=$1", [id]);
  });
  it("preserva created_at e atualiza updated_at no SQL direto", async () => {
    const before = await client.query<{ created_at: Date; updated_at: Date }>("SELECT created_at,updated_at FROM perfil_prestador WHERE id=$1", [provider]);
    await client.query("UPDATE perfil_prestador SET descricao='Descrição modificada com tamanho suficiente para persistência.' WHERE id=$1", [provider]);
    const after = await client.query<{ created_at: Date; updated_at: Date }>("SELECT created_at,updated_at FROM perfil_prestador WHERE id=$1", [provider]);
    expect(after.rows[0].created_at.getTime()).toBe(before.rows[0].created_at.getTime());
    expect(after.rows[0].updated_at.getTime()).toBeGreaterThan(before.rows[0].updated_at.getTime());
  });
  it("permite ofertas pausadas coexistirem, mas só uma publicação", async () => {
    await offer(client, provider, service);
    await offer(client, provider, service);
    await offer(client, provider, service, true);
    await client.query("SAVEPOINT duplicate_publication");
    await expect(offer(client, provider, service, true)).rejects.toMatchObject({ code: "23505" });
    await client.query("ROLLBACK TO SAVEPOINT duplicate_publication");
  });
  it("duas publicações concorrentes resultam em uma ativa", async () => {
    const setup = await pool.connect();
    const a = await pool.connect();
    const b = await pool.connect();
    let ids: Awaited<ReturnType<typeof fixture>> | undefined;
    try {
      await setup.query("BEGIN");
      ids = await fixture(setup);
      await setup.query("COMMIT");
      await a.query("BEGIN"); await b.query("BEGIN");
      await offer(a, ids.provider, ids.service, true);
      const second = expect(offer(b, ids.provider, ids.service, true)).rejects.toMatchObject({ code: "23505" });
      await a.query("COMMIT");
      await second;
      await b.query("ROLLBACK");
      const count = await setup.query<{ count: string }>("SELECT count(*) FROM oferta_servico WHERE prestador_id=$1 AND ativo AND deleted_at IS NULL", [ids.provider]);
      expect(count.rows[0].count).toBe("1");
    } finally {
      await setup.query("ROLLBACK");
      await a.query("ROLLBACK"); await b.query("ROLLBACK");
      if (ids) { await setup.query('DELETE FROM "user" WHERE id IN ($1,$2)', [ids.owner, ids.reviewer]); await setup.query("DELETE FROM tipo_servico WHERE id=$1", [ids.service]); await setup.query("DELETE FROM categoria WHERE id=$1", [ids.category]); }
      setup.release(); a.release(); b.release();
    }
  });
});
