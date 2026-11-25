import { describe, expect, it } from "vitest";
import { avisoHref, avisoTitles, unreadLabel } from "@/modules/avisos/links";
import { avisoTypes } from "@/lib/db/schema";

const project = "8f2c1d7e-3b4a-4c5d-9e6f-0a1b2c3d4e5f";

describe("Aviso: destino e rótulos", () => {
  it("o Cliente vai ao Projeto; o Prestador, à Oportunidade", () => {
    expect(avisoHref("PROPOSTA_RECEBIDA", project)).toBe(`/painel/projetos/${project}`);
    for (const type of ["CONVITE_RECEBIDO", "PROPOSTA_PRE_SELECIONADA", "PROPOSTA_ACEITA", "PROPOSTA_RECUSADA"] as const) expect(avisoHref(type, project)).toBe(`/painel/oportunidades/${project}`);
  });
  it("sem Projeto, cai na lista de Avisos", () => {
    for (const type of avisoTypes) expect(avisoHref(type, null)).toBe("/painel/avisos");
  });
  it("todo tipo tem título", () => {
    for (const type of avisoTypes) expect(avisoTitles[type].length).toBeGreaterThan(5);
  });
  it("rótulo do sino: só traz o número quando há não lidos", () => {
    expect(unreadLabel(0)).toBe("Avisos");
    expect(unreadLabel(1)).toBe("1 aviso não lido");
    expect(unreadLabel(7)).toBe("7 avisos não lidos");
  });
});
