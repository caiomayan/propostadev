import { describe, expect, it } from "vitest";
import { isPlataformaUser, parsePlataformaEmails } from "../../src/lib/auth/plataforma-emails";

describe("PLATAFORMA_EMAILS", () => {
  it("vazia ou ausente não libera ninguém", () => {
    for (const raw of [undefined, null, "", "   ", " , ,"]) expect(parsePlataformaEmails(raw)).toEqual([]);
    expect(isPlataformaUser({ email: "a@b.example", emailVerified: true }, "")).toBe(false);
  });
  it("ignora espaços e vírgulas sobrando", () => {
    expect(parsePlataformaEmails("  a@b.example ,c@d.example,, ")).toEqual(["a@b.example", "c@d.example"]);
  });
  it("compara sem caixa nos dois lados", () => {
    expect(parsePlataformaEmails("Equipe@Demo.Example")).toEqual(["equipe@demo.example"]);
    expect(isPlataformaUser({ email: "EQUIPE@demo.example", emailVerified: true }, "equipe@Demo.example")).toBe(true);
  });
  it("exige e-mail confirmado e estar na lista", () => {
    expect(isPlataformaUser({ email: "equipe@demo.example", emailVerified: false }, "equipe@demo.example")).toBe(false);
    expect(isPlataformaUser({ email: "equipe@demo.example", emailVerified: null }, "equipe@demo.example")).toBe(false);
    expect(isPlataformaUser({ email: "outro@demo.example", emailVerified: true }, "equipe@demo.example")).toBe(false);
    expect(isPlataformaUser(null, "equipe@demo.example")).toBe(false);
  });
});
