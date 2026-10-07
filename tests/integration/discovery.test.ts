import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../src/lib/db";
import { user } from "../../src/lib/db/auth-schema";
import { searchProviders, getComparison } from "../../src/modules/search/queries";
import { getPriceAverage } from "../../src/modules/catalog/queries";
import { searchSchema } from "../../src/modules/search/validation";

const categoryId = randomUUID();
const typeId = randomUUID();
const secondTypeId = randomUUID();
const userIds = Array.from({ length: 4 }, () => randomUUID());
const providerIds = Array.from({ length: 4 }, () => randomUUID());
const offerIds = Array.from({ length: 5 }, () => randomUUID());
const keyword = randomUUID();
let created = false;

describe.skipIf(!process.env.DATABASE_URL_TEST)("descoberta e agregados públicos", () => {
  beforeAll(async () => {
    const connection = await pool.connect();
    try {
      await connection.query("BEGIN");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      await drizzle(connection).insert(user).values(userIds.map((id, i) => ({ id, name: `Autor ${i}`, email: `${id}@test.example` })));
      await connection.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Web teste',$2)", [categoryId, categoryId]);
      for (const id of [typeId, secondTypeId]) await connection.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço teste',$3)", [id, categoryId, id]);
      for (let i = 0; i < providerIds.length; i++) {
        await connection.query("INSERT INTO perfil_prestador(id,usuario_id,slug,tipo,nome_exibicao,descricao,anos_experiencia,email_contato,contatos_publicados_em) VALUES($1,$2,$3,'PESSOA_FISICA',$4,'Descrição completa do perfil de desenvolvimento para teste.',5,'publico@test.example',now())", [providerIds[i], userIds[i], providerIds[i], `${keyword} Ágil ${i}`]);
        await connection.query("INSERT INTO oferta_servico(id,prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,$3,'Oferta principal','Descrição completa do serviço de desenvolvimento para teste.',$4,$5,'FIXO',30,true)", [offerIds[i], providerIds[i], typeId, i === 3 ? "POR_HORA" : "FIXO", ["800", "1000", "1200", "90"][i]]);
      }
      await connection.query("INSERT INTO oferta_servico(id,prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo) VALUES($1,$2,$3,'Outra oferta rápida','Descrição completa do outro serviço de desenvolvimento para teste.','FIXO',100,'FIXO',5,true)", [offerIds[4], providerIds[0], secondTypeId]);
      await connection.query("INSERT INTO avaliacao(usuario_id,prestador_id,nota) VALUES($1,$3,3),($2,$3,5)", [userIds[2], userIds[3], providerIds[0]]);
      await connection.query("COMMIT");
      created = true;
    } finally { await connection.query("ROLLBACK"); connection.release(); }
  });
  afterAll(async () => {
    if (created) {
      await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [userIds]);
      await pool.query("DELETE FROM tipo_servico WHERE id = ANY($1::uuid[])", [[typeId, secondTypeId]]);
      await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]);
    }
    await pool.end();
  });
  it("filtra tipo, preço e prazo sobre a mesma oferta", async () => {
    const matching = await searchProviders(searchSchema.parse({ tipo: secondTypeId, modelo_preco: "FIXO", preco_max: "500", prazo_ate: 10 }));
    expect(matching.total).toBe(1);
    expect(matching.results[0].id).toBe(offerIds[4]);
    const crossed = await searchProviders(searchSchema.parse({ tipo: typeId, modelo_preco: "FIXO", preco_max: "500", prazo_ate: 10 }));
    expect(crossed.total).toBe(0);
  });
  it("busca sem acentos agrupa por prestador e escapa curingas", async () => {
    const result = await searchProviders(searchSchema.parse({ q: `${keyword} agil` }));
    expect(result.total).toBe(4);
    expect(new Set(result.results.map((row) => row.providerId)).size).toBe(4);
    expect(Number(result.results.find((row) => row.providerId === providerIds[0])?.rating)).toBe(4);
    const wildcard = await searchProviders(searchSchema.parse({ q: `${keyword}%` }));
    expect(wildcard.total).toBe(0);
  });
  it("média usa três FIXO distintos, exclui hora e não multiplica reviews", async () => {
    const mean = await getPriceAverage(typeId);
    expect(mean.count).toBe(3);
    expect(Number(mean.average)).toBe(1000);
    expect(await getPriceAverage(secondTypeId)).toEqual({ average: null, count: 1 });
  });
  it("comparação deduplica prestador e descarta oferta pausada", async () => {
    const initial = await getComparison([offerIds[0], offerIds[4], offerIds[1]]);
    expect(initial.offers.map((row) => row.id)).toEqual([offerIds[0], offerIds[1]]);
    expect(initial.removed).toBe(true);
    await pool.query("UPDATE oferta_servico SET ativo=false WHERE id=$1", [offerIds[1]]);
    try {
      const paused = await getComparison([offerIds[0], offerIds[1]]);
      expect(paused.offers.map((row) => row.id)).toEqual([offerIds[0]]);
      expect(paused.removed).toBe(true);
    } finally { await pool.query("UPDATE oferta_servico SET ativo=true WHERE id=$1", [offerIds[1]]); }
  });
});
