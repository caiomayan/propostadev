import { describe, expect, it } from "vitest";
import { lojaReturnPath, signLojaToken, verifyLojaToken } from "../../src/lib/loja/sso";

const secret = "segredo-de-teste-com-tamanho-bom";
const now = Date.UTC(2026, 10, 25, 12);

describe("token de login da loja", () => {
  it("carrega e-mail e nome e vale por 2 minutos", () => {
    const token = signLojaToken({ email: "mariana@demo.example", name: "Mariana Costa" }, secret, now);
    expect(verifyLojaToken(token, secret, now)).toEqual({ email: "mariana@demo.example", name: "Mariana Costa" });
    expect(verifyLojaToken(token, secret, now + 121_000)).toBeNull();
  });
  it("recusa assinatura de outro segredo ou dados alterados", () => {
    const token = signLojaToken({ email: "a@demo.example", name: "A" }, secret, now);
    expect(verifyLojaToken(token, "outro-segredo-qualquer-aqui", now)).toBeNull();
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ e: "admin@demo.example", n: "X", x: 9999999999, j: "1" })).toString("base64url");
    expect(verifyLojaToken(`${forged}.${signature}`, secret, now)).toBeNull();
  });
  it("cada token é diferente (uso único na loja)", () => {
    expect(signLojaToken({ email: "a@demo.example", name: "A" }, secret, now)).not.toBe(signLojaToken({ email: "a@demo.example", name: "A" }, secret, now));
  });
});

describe("volta para a loja", () => {
  it("aceita só caminhos internos", () => {
    expect(lojaReturnPath("/servico/x/")).toBe("/servico/x/");
    for (const bad of [null, "", "https://evil.example/", "//evil.example", "/\\evil", "/a\nb"]) expect(lojaReturnPath(bad)).toBe("/minha-conta/");
  });
});
