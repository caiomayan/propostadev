import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../src/lib/db";
import type { ExtractedPrice, PriceExtractor } from "../../src/modules/external-prices/client";
import { collectExternalPrices } from "../../src/modules/external-prices/collector";
import { latestExternalPrices } from "../../src/modules/external-prices/queries";
import { precoReferencia } from "../../src/modules/triage/queries";
import type { PriceSource } from "../../src/modules/external-prices/sources";
import { GET } from "../../src/app/api/cron/precos-externos/route";

const categoryId = randomUUID();
const slug = `ext-${randomUUID()}`;
let typeId = "";
const src = (name: string): PriceSource => ({ serviceSlug: slug, name, url: `https://example.com/${name}`, serviceDescription: "serviço de teste" });
const fake = (answers: Record<string, ExtractedPrice | Error>): PriceExtractor => ({ async extract({ url }) { const answer = answers[url.split("/").pop()!]; if (answer instanceof Error) throw answer; return answer; } });
const ok = (min: number, max: number): ExtractedPrice => ({ encontrado: true, valor_min: min, valor_max: max, trecho: `de ${min} a ${max}` });

async function rows(name: string) { return (await pool.query("SELECT status, valor_min::text AS min, valor_max::text AS max, erro FROM preco_mercado_externo WHERE tipo_servico_id=$1 AND fonte_nome=$2 ORDER BY coletado_em, id", [typeId, name])).rows; }

describe.skipIf(!process.env.DATABASE_URL_TEST)("preço de mercado externo", () => {
  beforeAll(async () => {
    typeId = randomUUID();
    await pool.query("INSERT INTO categoria(id,nome,slug) VALUES($1,'Externo teste',$2)", [categoryId, categoryId]);
    await pool.query("INSERT INTO tipo_servico(id,categoria_id,nome,slug) VALUES($1,$2,'Serviço externo',$3)", [typeId, categoryId, slug]);
  });
  afterAll(async () => { await pool.query("DELETE FROM tipo_servico WHERE id=$1", [typeId]); await pool.query("DELETE FROM categoria WHERE id=$1", [categoryId]); });

  it("grava faixas válidas e descarta as inválidas sem derrubar as outras fontes", async () => {
    const sources = ["boa", "texto", "zero", "invertida", "semPreco", "caiu"].map(src);
    const outcomes = await collectExternalPrices(fake({
      boa: ok(800, 2000), texto: { encontrado: true, valor_min: "800", valor_max: 2000, trecho: "x" }, zero: ok(0, 500), invertida: ok(900, 100),
      semPreco: { encontrado: false, valor_min: null, valor_max: null, trecho: null }, caiu: new Error("Firecrawl respondeu 429"),
    }), sources);
    expect(outcomes.filter((o) => o.status === "OK").map((o) => o.source)).toEqual(["boa"]);
    expect(await rows("boa")).toEqual([{ status: "OK", min: "800.00", max: "2000.00", erro: null }]);
    for (const name of ["texto", "zero", "invertida", "semPreco", "caiu"]) { const [row] = await rows(name); expect(row).toMatchObject({ status: "FALHA", min: null, max: null }); expect(row.erro).toBeTruthy(); }
    expect((await latestExternalPrices(typeId)).map((p) => p.sourceName)).toEqual(["boa"]);
  });

  it("mantém o último valor válido quando a fonte falha depois, e a coleta nova válida o substitui", async () => {
    const sources = [src("estavel")];
    await collectExternalPrices(fake({ estavel: ok(1000, 3000) }), sources);
    const before = (await latestExternalPrices(typeId)).find((p) => p.sourceName === "estavel")!;
    await collectExternalPrices(fake({ estavel: new Error("timeout") }), sources);
    const kept = (await latestExternalPrices(typeId)).find((p) => p.sourceName === "estavel")!;
    expect(kept).toMatchObject({ min: "1000.00", max: "3000.00" });
    expect(kept.collectedAt).toEqual(before.collectedAt);
    await collectExternalPrices(fake({ estavel: ok(1200, 3500) }), sources);
    const renewed = (await latestExternalPrices(typeId)).filter((p) => p.sourceName === "estavel");
    expect(renewed).toHaveLength(1);
    expect(renewed[0]).toMatchObject({ min: "1200.00", max: "3500.00" });
    expect(await rows("estavel")).toHaveLength(3);
  });

  it("fonte de Tipo de serviço inexistente falha isolada", async () => {
    const [outcome] = await collectExternalPrices(fake({}), [{ ...src("fantasma"), serviceSlug: `nao-existe-${randomUUID()}` }]);
    expect(outcome).toMatchObject({ status: "FALHA" });
  });

  it("preço externo nunca entra no Preço de referência", async () => {
    const before = await precoReferencia(typeId);
    await collectExternalPrices(fake({ alto: ok(50000, 90000) }), [src("alto")]);
    expect(await precoReferencia(typeId)).toEqual(before);
    expect(before).toMatchObject({ n: 0, mediaFixos: null, faixa: null });
  });

  describe("rota do cron", () => {
    const call = (authorization?: string) => GET(new Request("http://localhost/api/cron/precos-externos", { headers: authorization ? { authorization } : {} }));
    it("recusa sem o segredo, com segredo errado e sem CRON_SECRET configurado", async () => {
      const saved = process.env.CRON_SECRET;
      try {
        process.env.CRON_SECRET = "segredo-de-teste-123";
        expect((await call()).status).toBe(401);
        expect((await call("Bearer errado")).status).toBe(401);
        expect((await call("segredo-de-teste-123")).status).toBe(401);
        delete process.env.CRON_SECRET;
        expect((await call("Bearer undefined")).status).toBe(401);
        expect((await call("Bearer ")).status).toBe(401);
      } finally { if (saved === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = saved; }
    });
  });
});
