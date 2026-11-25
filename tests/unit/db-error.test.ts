import { describe, expect, it } from "vitest";
import { describeDbError } from "../../scripts/db-error";

describe("describeDbError", () => {
  it("mostra o código do Postgres que vem embrulhado no cause", () => {
    const driver = Object.assign(new Error('password authentication failed for user "postgres"'), { code: "28P01" });
    const wrapped = new Error("Failed query: CREATE SCHEMA IF NOT EXISTS drizzle", { cause: driver });
    expect(describeDbError(wrapped)).toContain("28P01 password authentication failed");
  });

  it("nunca imprime a connection string", () => {
    const error = Object.assign(new Error("connect failed postgresql://user:segredo@db.example:6543/postgres?sslmode=require"), { code: "ECONNREFUSED" });
    const text = describeDbError(error);
    expect(text).toContain("ECONNREFUSED");
    expect(text).not.toContain("segredo");
  });

  it("aceita valores que não são Error", () => {
    expect(describeDbError(undefined)).toBe("erro sem detalhes");
    expect(describeDbError("falhou")).toBe("falhou");
  });
});
