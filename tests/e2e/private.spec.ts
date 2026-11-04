import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { confirmEmail } from "./support";

const password = "Proposta-test-password-2026";
const changedPassword = "Proposta-changed-password-2026";
async function login(page: Page, email: string, secret = password) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
async function register(page: Page, name: string, email: string, type: "CLIENTE" | "PRESTADOR" = "PRESTADOR") {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: type === "CLIENTE" ? /Quero contratar/ : /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel$/);
}
async function createProfile(page: Page, name: string) {
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome de exibição").fill(name);
  await page.getByLabel("Descrição", { exact: true }).fill("Desenvolvimento de páginas e sistemas para pequenos negócios com cuidado e comunicação clara.");
  await page.getByLabel("Anos de experiência").fill("3");
  await page.getByLabel("Autorizo a publicação").check();
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil salvo");
}
async function createOffer(page: Page, title: string) {
  await page.goto("/painel/ofertas/nova");
  const select = page.getByLabel("Tipo de serviço", { exact: true });
  await expect(select.locator("option")).not.toHaveCount(1);
  const value = await select.locator("option").nth(1).getAttribute("value");
  await select.selectOption(value!);
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Descrição", { exact: true }).fill("Uma página responsiva para apresentar seu negócio com conteúdo organizado e identidade visual.");
  await page.getByLabel("Modelo de preço").selectOption("FIXO");
  await page.getByLabel("Preço anunciado").fill("900.00");
  await page.getByLabel("Modelo de prazo").selectOption("FIXO");
  await page.getByLabel("Prazo anunciado (dias)").fill("10");
  await page.getByLabel("Publicar oferta").check();
  await page.getByRole("button", { name: "Salvar oferta" }).click();
  await expect(page).toHaveURL(/\/painel\/ofertas\/[a-f0-9-]+\/editar$/);
  return new URL(page.url()).pathname;
}

test("account, provider and offers persist; ownership is enforced across accounts", async ({ page, browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const firstEmail = `owner-${suffix}@example.test`;
  await register(page, "Prestador de teste", firstEmail);
  await createProfile(page, `Perfil ${suffix}`);
  const firstEdit = await createOffer(page, `Oferta original ${suffix}`);
  await page.getByLabel("Título", { exact: true }).fill(`Oferta editada ${suffix}`);
  await page.getByLabel("Publicar oferta").uncheck();
  await page.getByRole("button", { name: "Salvar oferta" }).click();
  await expect(page.getByRole("status")).toContainText("Oferta salva");
  await page.goto("/painel/ofertas");
  await expect(page.getByRole("heading", { name: `Oferta editada ${suffix}` })).toBeVisible();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();

  const secondContext = await browser.newContext({ baseURL });
  const second = await secondContext.newPage();
  await register(second, "Outra conta", `other-${suffix}@example.test`);
  const denied = await second.goto(firstEdit);
  expect(denied?.status()).toBe(404);
  await createProfile(second, `Outro perfil ${suffix}`);
  await createOffer(second, `Outra oferta ${suffix}`);
  const firstId = firstEdit.split("/")[3];
  await second.locator('input[name="id"]').evaluate((input, id) => { (input as HTMLInputElement).value = id; }, firstId);
  await second.getByLabel("Título", { exact: true }).fill("Tentativa de modificar outra oferta");
  await second.getByRole("button", { name: "Salvar oferta" }).click();
  await expect(second.locator("main").getByRole("alert")).toContainText("sem permissão");
  await page.goto(firstEdit);
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(`Oferta editada ${suffix}`);
  await secondContext.close();

  await page.goto("/painel");
  const publicProfile = await page.getByRole("link", { name: "Ver meu perfil público" }).getAttribute("href");
  expect(publicProfile).toBeTruthy();
  await page.goto("/painel/perfil");
  await page.getByRole("button", { name: "Desativar perfil", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Ofertas e avaliações ficam preservadas");
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar: desativar perfil", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reativar perfil", exact: true })).toBeVisible();
  const hiddenProfile = await page.goto(publicProfile!);
  expect(hiddenProfile?.status()).toBe(404);
  await page.goto("/painel/perfil");
  await page.getByRole("button", { name: "Reativar perfil", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar: reativar perfil", exact: true }).click();
  await expect(page.getByRole("button", { name: "Desativar perfil", exact: true })).toBeVisible();
  const visibleProfile = await page.goto(publicProfile!);
  expect(visibleProfile?.status()).toBe(200);

  const otherSessionContext = await browser.newContext({ baseURL });
  const otherSession = await otherSessionContext.newPage();
  await login(otherSession, firstEmail);

  await page.goto("/painel/conta");
  await page.getByLabel("Nome", { exact: true }).fill("Nome atualizado");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Nome atualizado" })).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill(password);
  await page.getByLabel("Nova senha", { exact: true }).fill(changedPassword);
  await page.getByRole("button", { name: "Alterar senha", exact: true }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: "Senha alterada" })).toBeVisible();
  await otherSession.goto("/painel");
  await expect(otherSession).toHaveURL(/\/entrar$/);
  await otherSessionContext.close();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/painel/ofertas");
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByLabel("E-mail", { exact: true }).fill(firstEmail);
  await page.getByLabel("Senha", { exact: true }).fill(changedPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(page.getByRole("heading", { name: "Olá, Nome." })).toBeVisible();
  await page.goto("/painel/ofertas");
  await expect(page.getByRole("heading", { name: `Oferta editada ${suffix}` })).toBeVisible();
  await page.getByText("Excluir oferta", { exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
  await expect(page.getByRole("heading", { name: `Oferta editada ${suffix}` })).toHaveCount(0);
  const deletedOffer = await page.goto(firstEdit);
  expect(deletedOffer?.status()).toBe(404);
});

test("login returns a generic error and rejects an external destination", async ({ page }) => {
  await page.goto("/entrar?next=https://attacker.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/painel");
  await page.getByLabel("E-mail", { exact: true }).fill(`missing-${Date.now()}@example.test`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Não foi possível entrar");
});


test("cadastro como Cliente leva ao painel de Cliente, sem Perfil nem Ofertas", async ({ page }) => {
  await register(page, "Cliente de teste", `cliente-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`, "CLIENTE");
  await expect(page.getByRole("heading", { name: "Comece descrevendo o que você precisa" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Descrever um projeto" })).toHaveAttribute("href", "/triagem");
  const nav = page.getByRole("navigation", { name: "Painel" });
  await expect(nav.getByRole("link", { name: "Conta", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Perfil", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Ofertas", exact: true })).toHaveCount(0);
  await page.goto("/painel/perfil");
  await expect(page).toHaveURL(/\/painel$/);
  await page.goto("/painel/ofertas/nova");
  await expect(page).toHaveURL(/\/painel$/);
});

test("cadastro como Prestador leva ao painel de Prestador", async ({ page }) => {
  await register(page, "Prestador de painel", `prestador-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`, "PRESTADOR");
  const nav = page.getByRole("navigation", { name: "Painel" });
  for (const name of ["Perfil", "Ofertas", "Conta"]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Apresente o que você faz." })).toBeVisible();
  await page.goto("/boas-vindas");
  await expect(page).toHaveURL(/\/painel$/);
});

test("conta sem tipo é enviada para /boas-vindas e escolhe uma única vez", async ({ page }) => {
  const email = `semtipo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`;
  await register(page, "Conta sem tipo", email, "CLIENTE");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try {
    // Simula a entrada via OAuth (ticket 08): usuário existente com tipo nulo.
    await pool.query('ALTER TABLE "user" DISABLE TRIGGER user_tipo_conta_imutavel');
    await pool.query('UPDATE "user" SET tipo_conta=NULL WHERE email=$1', [email]);
    await pool.query('ALTER TABLE "user" ENABLE TRIGGER user_tipo_conta_imutavel');
  } finally { await pool.end(); }
  await page.goto("/painel/conta");
  await expect(page).toHaveURL(/\/boas-vindas$/);
  await page.getByRole("radio", { name: /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "Ofertas", exact: true })).toBeVisible();
});
