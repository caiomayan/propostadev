import { test, expect } from "@playwright/test";

const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";

test("Selo de confiança aparece no Perfil, na busca e explica os critérios; quem não cumpre não tem selo", async ({ page }) => {
  await page.goto("/prestadores/prestador-demo-4");
  const seal = page.locator(".profile-hero .trust-seal");
  await expect(seal).toBeVisible();
  await seal.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(seal.getByText("Média das Avaliações verificadas de 4,0 ou mais")).toBeVisible();
  await expect(seal.getByText("E-mail da conta confirmado")).toBeVisible();

  await page.goto("/buscar?q=Clara%20C%C3%B3digo");
  await expect(page.locator(".search-results .provider-result .trust-seal")).toHaveCount(1);

  // Sem Avaliação verificada (só uma Avaliação anterior) → sem selo.
  await page.goto("/prestadores/prestador-demo-1");
  await expect(page.getByRole("heading", { name: "Aurora Web — Demo" })).toBeVisible();
  await expect(page.locator(".trust-seal")).toHaveCount(0);
});

test("o Prestador vê o checklist dos critérios do selo no painel", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("prestador1@demo.example");
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  const checklist = page.getByRole("list", { name: "Critérios do selo" });
  await expect(checklist).toBeVisible();
  await expect(checklist.getByRole("listitem")).toHaveCount(3);
  await expect(checklist.getByRole("listitem").nth(0)).toContainText("Cumprido");
  await expect(checklist.getByRole("listitem").nth(1)).toContainText("Pendente");
});
