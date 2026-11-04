import { describe, expect, it } from "vitest";
import { applySort, compatibleSorts, myProposalSorts, offerSorts, opportunitySorts, projectSorts, sortOptions } from "../../src/lib/list-sorts";
import { searchSchema } from "../../src/modules/search/validation";

const project = (title: string, day: number, proposalCount: number, status = "ABERTO") => ({ title, createdAt: new Date(2026, 9, day), proposalCount, status });

describe("ordenação das listas", () => {
  const projects = [project("Bravo", 3, 1, "ENCERRADO"), project("Ágil", 2, 4), project("Casa", 1, 0)];
  it("sem pedido, mantém a ordem da consulta", () => {
    const result = applySort(projectSorts, undefined, projects);
    expect(result.items).toBe(projects);
    expect(result.isDefault).toBe(true);
  });
  it("valor inválido na URL cai na padrão", () => { expect(applySort(projectSorts, "x'; DROP", projects).current).toBe("recentes"); });
  it("não altera a lista original", () => {
    applySort(projectSorts, "antigos", projects);
    expect(projects[0].title).toBe("Bravo");
  });
  it.each([
    ["antigos", ["Casa", "Ágil", "Bravo"]],
    ["propostas", ["Ágil", "Bravo", "Casa"]],
    ["abertos", ["Ágil", "Casa", "Bravo"]],
    ["titulo", ["Ágil", "Bravo", "Casa"]],
  ])("projetos por %s", (value, expected) => { expect(applySort(projectSorts, value, projects).items.map((item) => item.title)).toEqual(expected); });

  it("preço compara valor numérico e deixa hora e sob consulta por último", () => {
    const offer = (title: string, priceType: string, priceMin: string | null) => ({ offer: { title, active: true, createdAt: new Date(), priceType, priceMin, deadlineMinDays: null } });
    const rows = [offer("hora", "POR_HORA", "90.00"), offer("mil", "FIXO", "1000.00"), offer("consulta", "SOB_CONSULTA", null), offer("novecentos", "A_PARTIR_DE", "900.00")];
    expect(applySort(offerSorts, "preco", rows).items.map((row) => row.offer.title)).toEqual(["novecentos", "mil", "hora", "consulta"]);
  });
  it("orçamento desconhecido fica por último mesmo em ordem decrescente", () => {
    const item = (max: string | null) => ({ createdAt: new Date(), desiredDays: null, budget: { max }, proposal: null });
    expect(applySort(opportunitySorts, "orcamento", [item(null), item("500.00"), item("3000.00")]).items.map((row) => row.budget.max)).toEqual(["3000.00", "500.00", null]);
  });
  it("valor da proposta nos dois sentidos", () => {
    const rows = [{ amount: "900.00", days: 5, createdAt: new Date() }, { amount: "10000.00", days: 9, createdAt: new Date() }];
    expect(applySort(myProposalSorts, "maior-valor", rows).items[0].amount).toBe("10000.00");
    expect(applySort(myProposalSorts, "menor-valor", rows).items[0].amount).toBe("900.00");
  });
  it("sem nota fica depois de quem tem nota", () => {
    const item = (rating: string | null) => ({ priceType: "FIXO", priceMin: "1.00", deadlineMinDays: 1, rating, yearsExperience: 1 });
    expect(applySort(compatibleSorts, "nota", [item(null), item("4.5"), item("5")]).items.map((row) => row.rating)).toEqual(["5", "4.5", null]);
  });
  it("a opção padrão gera URL sem parâmetro", () => {
    const links = sortOptions(projectSorts, "propostas", (value) => (value ? `/x?ordem=${value}` : "/x"));
    expect(links[0]).toEqual({ label: "Mais recentes", href: "/x", current: false });
    expect(links.find((link) => link.current)?.href).toBe("/x?ordem=propostas");
  });
});

describe("ordenação da busca", () => {
  it("aceita menor preço sem modelo: compara só preço por projeto", () => { expect(searchSchema.safeParse({ ordenar: "preco" }).success).toBe(true); });
  it("aceita as novas ordens", () => { for (const ordenar of ["avaliacoes", "prazo"]) expect(searchSchema.safeParse({ ordenar }).success).toBe(true); });
  it("sob consulta continua sem ordem por preço", () => { expect(searchSchema.safeParse({ ordenar: "preco", modelo_preco: "SOB_CONSULTA" }).success).toBe(false); });
  it("filtro de valor continua exigindo modelo", () => { expect(searchSchema.safeParse({ preco_min: "100" }).success).toBe(false); });
});
