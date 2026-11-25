import { describe, expect, it } from "vitest";
import { demoPasswordForNewAccount, LOCAL_DEMO_PASSWORD } from "../../scripts/demo-mvp3/senha";

describe("senha da conta demo da Equipe", () => {
  it("usa DEMO_PASSWORD quando definido, em qualquer banco", () => {
    expect(demoPasswordForNewAccount("postgres://u:p@db.prod.example:5432/x", "segredo-forte")).toBe("segredo-forte");
  });
  it("só usa a senha padrão pública em banco local", () => {
    expect(demoPasswordForNewAccount("postgres://u:p@localhost:5434/x", undefined)).toBe(LOCAL_DEMO_PASSWORD);
    expect(demoPasswordForNewAccount("postgres://u:p@127.0.0.1/x", "")).toBe(LOCAL_DEMO_PASSWORD);
  });
  it("recusa fora do banco local sem DEMO_PASSWORD (e sem DATABASE_URL)", () => {
    expect(() => demoPasswordForNewAccount("postgres://u:p@db.prod.example:5432/x", undefined)).toThrow(/Defina DEMO_PASSWORD/);
    expect(() => demoPasswordForNewAccount(undefined, undefined)).toThrow(/Defina DEMO_PASSWORD/);
  });
});
