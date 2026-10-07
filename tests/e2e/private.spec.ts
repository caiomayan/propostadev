import { test, expect, type Page } from "@playwright/test";

const password = "Proposta-test-password-2026";
const changedPassword = "Proposta-changed-password-2026";
async function login(page: Page, email: string, secret = password) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
async function register(page: Page, name: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
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
  await expect(page.getByRole("status")).toContainText("Nome atualizado");
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
  await expect(page.getByRole("heading", { name: "Olá, Nome atualizado." })).toBeVisible();
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

