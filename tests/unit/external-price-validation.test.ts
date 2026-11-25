import { describe, expect, it } from "vitest";
import { amountsInExcerpt, validateExtraction } from "@/modules/external-prices/collector";

describe("amountsInExcerpt", () => {
  it("lê valores no formato brasileiro, com milhar, centavos e 'mil'", () => {
    expect(amountsInExcerpt("Landing page | R$ 800 - R$ 2.000")).toEqual([800, 2000]);
    expect(amountsInExcerpt("Site completo | R$ 2.500,00 - R$ 10.000,00")).toEqual([2500, 10000]);
    expect(amountsInExcerpt("de R$ 15 mil a R$ 40 mil")).toEqual([15000, 40000]);
    expect(amountsInExcerpt("entre R$ 1,5 mil e R$ 3 mil")).toEqual([1500, 3000]);
  });
});

describe("validateExtraction", () => {
  const ok = (valor_min: number, valor_max: number, trecho: string) => validateExtraction({ encontrado: true, valor_min, valor_max, trecho });

  it("aceita quando os dois valores aparecem no trecho", () => {
    expect(ok(800, 2000, "Landing page | R$ 800 - R$ 2.000")).toEqual({ ok: true, price: { min: "800.00", max: "2000.00", excerpt: "Landing page | R$ 800 - R$ 2.000" } });
    expect(ok(15000, 40000, "Sistema simples: R$ 15 mil a R$ 40 mil").ok).toBe(true);
  });

  it("recusa milhar lido como decimal (R$ 1.000 virando 1)", () => {
    expect(ok(1, 100000, "de R$ 1.000 a R$ 10.000 para um site simples, ou mais de R$ 50.000")).toEqual({ ok: false, reason: "Valores extraídos não aparecem no trecho citado" });
  });

  it("limpa negrito de markdown do trecho", () => {
    expect(ok(30, 25000, "variam de **R$ 30 a R$ 25.000 ou mais por mês**.")).toEqual({ ok: true, price: { min: "30.00", max: "25000.00", excerpt: "variam de R$ 30 a R$ 25.000 ou mais por mês." } });
  });

  it("recusa quando não há trecho para conferir", () => {
    expect(validateExtraction({ encontrado: true, valor_min: 800, valor_max: 2000, trecho: null })).toEqual({ ok: false, reason: "Valores extraídos não aparecem no trecho citado" });
  });
});
