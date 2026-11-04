import { describe, expect, it, vi } from "vitest";
import { fetchGooglePicture } from "../../src/lib/auth/google-photo";

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

describe("foto da conta Google", () => {
  it("devolve a foto HTTPS e envia o token de acesso", async () => {
    const request = reply({ picture: "https://lh3.googleusercontent.com/a/foto" });
    expect(await fetchGooglePicture("token", request)).toBe("https://lh3.googleusercontent.com/a/foto");
    expect(vi.mocked(request).mock.calls[0][1]?.headers).toEqual({ authorization: "Bearer token" });
  });
  it("recusa endereço sem HTTPS", async () => { expect(await fetchGooglePicture("token", reply({ picture: "http://exemplo.test/a.png" }))).toBeNull(); });
  it("sem foto na resposta, devolve null", async () => { expect(await fetchGooglePicture("token", reply({}))).toBeNull(); });
  it("resposta de erro não quebra o login", async () => { expect(await fetchGooglePicture("token", reply({}, false))).toBeNull(); });
  it("falha de rede não quebra o login", async () => {
    const request = vi.fn(async () => { throw new Error("rede"); }) as unknown as typeof fetch;
    expect(await fetchGooglePicture("token", request)).toBeNull();
  });
});
