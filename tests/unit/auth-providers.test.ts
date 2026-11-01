import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({ socialSignIn: vi.fn() }));
import { enabledSocialProviders, socialProviderConfig } from "../../src/lib/auth/providers";
import { SocialButtons } from "../../src/components/auth/social-buttons";

describe("provedores sociais", () => {
  it("sem variáveis, nenhum provedor é ativado e nenhum botão é renderizado", () => {
    expect(enabledSocialProviders({})).toEqual([]);
    expect(socialProviderConfig({})).toEqual({});
    expect(renderToStaticMarkup(createElement(SocialButtons, { providers: enabledSocialProviders({}) }))).toBe("");
  });
  it("ID sem segredo (ou o contrário) não ativa o provedor", () => {
    expect(enabledSocialProviders({ GITHUB_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "segredo", GOOGLE_CLIENT_ID: " " })).toEqual([]);
  });
  it("com ID e segredo, ativa só o provedor completo e renderiza o botão dele", () => {
    const env = { GITHUB_CLIENT_ID: "gh-id", GITHUB_CLIENT_SECRET: "gh-secret" };
    expect(enabledSocialProviders(env)).toEqual(["github"]);
    expect(socialProviderConfig(env)).toEqual({ github: { clientId: "gh-id", clientSecret: "gh-secret" } });
    const html = renderToStaticMarkup(createElement(SocialButtons, { providers: enabledSocialProviders(env) }));
    expect(html).toContain("GitHub");
    expect(html).not.toContain("Google");
  });
  it("com os dois conjuntos, ativa GitHub e Google", () => {
    expect(enabledSocialProviders({ GITHUB_CLIENT_ID: "a", GITHUB_CLIENT_SECRET: "b", GOOGLE_CLIENT_ID: "c", GOOGLE_CLIENT_SECRET: "d" })).toEqual(["github", "google"]);
  });
});
