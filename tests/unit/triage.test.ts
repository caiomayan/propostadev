import { describe, expect, it } from "vitest";
import { catalog } from "../../scripts/seed";
import { goalSeeds } from "../../src/modules/triage/goals";
import { compareDeadline, posicaoOrcamento, posicaoValor, positionSentence } from "../../src/modules/triage/position";
import { parseTriageOrder } from "../../src/modules/proposals/queries";
import { draftQuery, normalizeMoney, parseDraft } from "../../src/modules/triage/validation";

const faixa = { min: "500.00", max: "5000.00" };
const valid = { tipo: "landing-page", titulo: "Landing page da loja", descricao: "Preciso de uma página de vendas com formulário de contato e integração.", orcamento: "FAIXA", min: "1000", max: "3000,50", prazo: "30" };

describe("posicaoOrcamento", () => {
  it("teto: abaixo, dentro e acima da faixa", () => {
    expect(posicaoOrcamento({ tipo: "ATE", min: null, max: "499.99" }, faixa)).toBe("ABAIXO");
    expect(posicaoOrcamento({ tipo: "ATE", min: null, max: "500.00" }, faixa)).toBe("DENTRO");
    expect(posicaoOrcamento({ tipo: "ATE", min: null, max: "5000.00" }, faixa)).toBe("DENTRO");
    expect(posicaoOrcamento({ tipo: "ATE", min: null, max: "5000.01" }, faixa)).toBe("ACIMA");
  });
  it("faixa: dentro quando as faixas se sobrepõem", () => {
    expect(posicaoOrcamento({ tipo: "FAIXA", min: "100", max: "400" }, faixa)).toBe("ABAIXO");
    expect(posicaoOrcamento({ tipo: "FAIXA", min: "100", max: "600" }, faixa)).toBe("DENTRO");
    expect(posicaoOrcamento({ tipo: "FAIXA", min: "6000", max: "9000" }, faixa)).toBe("ACIMA");
    expect(posicaoOrcamento({ tipo: "FAIXA", min: "5000", max: "9000" }, faixa)).toBe("DENTRO");
  });
  it("valor único (Proposta) e casos indefinidos", () => {
    expect(posicaoOrcamento({ tipo: "FAIXA", min: "1200", max: "1200" }, faixa)).toBe("DENTRO");
    expect(posicaoOrcamento({ tipo: "NAO_SEI", min: null, max: null }, faixa)).toBe("INDEFINIDO");
    expect(posicaoOrcamento({ tipo: "ATE", min: null, max: "1000" }, null)).toBe("INDEFINIDO");
  });
});

describe("rascunho da Triagem", () => {
  it("normaliza dinheiro decimal sem float e recusa lixo", () => {
    expect(normalizeMoney("1500")).toBe("1500.00");
    expect(normalizeMoney("1500,5")).toBe("1500.50");
    expect(normalizeMoney("R$ 99999999.99")).toBe("99999999.99");
    for (const bad of ["1.500,00", "abc", "1e3", "-5", "100000000", "1,234"]) expect(normalizeMoney(bad)).toBeNull();
  });
  it("aceita um rascunho completo e devolve a mesma query ao serializar", () => {
    const parsed = parseDraft(valid);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.draft).toMatchObject({ orcamento: { tipo: "FAIXA", min: "1000.00", max: "3000.50" }, prazoDias: 30 });
    const again = parseDraft(Object.fromEntries(new URLSearchParams(draftQuery(parsed.draft))));
    expect(again).toEqual(parsed);
  });
  it("valida limites de título, descrição e prazo sem lançar", () => {
    for (const patch of [{ titulo: "abc" }, { titulo: "x".repeat(121) }, { descricao: "curta" }, { descricao: "x".repeat(2001) }, { prazo: "0" }, { prazo: "3651" }, { prazo: "abc" }, { prazo: "" }]) {
      expect(() => parseDraft({ ...valid, ...patch })).not.toThrow();
      expect(parseDraft({ ...valid, ...patch }).ok).toBe(false);
    }
    expect(parseDraft({ ...valid, prazo: "3650" }).ok).toBe(true);
    expect(parseDraft({ ...valid, prazo: "", flexivel: "1" })).toMatchObject({ ok: true, draft: { prazoDias: null } });
  });
  it("coerência do orçamento por tipo", () => {
    expect(parseDraft({ ...valid, min: "3000", max: "1000" })).toMatchObject({ ok: false, errors: { max: expect.any(String) } });
    expect(parseDraft({ ...valid, min: "" })).toMatchObject({ ok: false, errors: { min: expect.any(String) } });
    expect(parseDraft({ ...valid, orcamento: "ATE", min: "9", max: "800" })).toMatchObject({ ok: true, draft: { orcamento: { tipo: "ATE", min: null, max: "800.00" } } });
    expect(parseDraft({ ...valid, orcamento: "ATE", max: "" }).ok).toBe(false);
    expect(parseDraft({ ...valid, orcamento: "NAO_SEI", min: "5", max: "6" })).toMatchObject({ ok: true, draft: { orcamento: { tipo: "NAO_SEI", min: null, max: null } } });
    expect(parseDraft({ ...valid, orcamento: "OUTRO" }).ok).toBe(false);
    expect(parseDraft({}).ok).toBe(false);
  });
  it("lê valores repetidos na query pelo primeiro e ignora chaves desconhecidas", () => {
    expect(parseDraft({ ...valid, prazo: ["10", "20"], extra: "x" })).toMatchObject({ ok: true, draft: { prazoDias: 10 } });
  });
});

describe("mapeamento objetivo → tipos de serviço", () => {
  const known = new Set(catalog.flatMap((category) => category.services.map((service) => service.slug)));
  it("só aponta para tipos do catálogo do seed", () => {
    for (const goal of goalSeeds) for (const service of goal.services) expect(known.has(service), `${goal.slug} → ${service}`).toBe(true);
  });
  it("tem slugs únicos e ao menos um tipo por objetivo", () => {
    expect(new Set(goalSeeds.map((goal) => goal.slug)).size).toBe(goalSeeds.length);
    for (const goal of goalSeeds) expect(goal.services.length).toBeGreaterThan(0);
  });
});

describe("Triagem de Propostas (ticket 06)", () => {
  it("compara o prazo da Proposta com o desejado", () => {
    expect(compareDeadline(15, 20)).toEqual({ tone: "antes", text: "5 dias antes do desejado" });
    expect(compareDeadline(29, 30)).toEqual({ tone: "antes", text: "1 dia antes do desejado" });
    expect(compareDeadline(30, 30)).toEqual({ tone: "no-prazo", text: "Dentro do prazo" });
    expect(compareDeadline(40, 30)).toEqual({ tone: "alem", text: "10 dias além do desejado" });
    expect(compareDeadline(31, 30)).toEqual({ tone: "alem", text: "1 dia além do desejado" });
    expect(compareDeadline(90, null)).toEqual({ tone: "flexivel", text: "Prazo desejado flexível" });
  });
  it("posiciona o valor único de uma Proposta na faixa", () => {
    expect(posicaoValor("499.99", faixa)).toBe("ABAIXO");
    expect(posicaoValor("500.00", faixa)).toBe("DENTRO");
    expect(posicaoValor("5000.00", faixa)).toBe("DENTRO");
    expect(posicaoValor("5000.01", faixa)).toBe("ACIMA");
    expect(posicaoValor("1000.00", null)).toBe("INDEFINIDO");
    expect(positionSentence("ACIMA", "proposta")).toBe("O valor da proposta está acima da faixa anunciada.");
    expect(positionSentence("ABAIXO", "valor")).toBe("Seu valor está abaixo da faixa anunciada.");
  });
  it("aceita só as ordens conhecidas; o resto cai na ordem padrão", () => {
    expect(parseTriageOrder("valor")).toBe("valor");
    expect(parseTriageOrder("reputacao")).toBe("reputacao");
    for (const invalid of [undefined, "", "VALOR", "valor; DROP TABLE proposta", ["valor"], 1]) expect(parseTriageOrder(invalid)).toBeUndefined();
  });
});
