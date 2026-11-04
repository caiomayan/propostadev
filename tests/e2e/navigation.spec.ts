import { test, expect, type Page } from "@playwright/test";

const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

test("visitante vê Entrar e o caminho de Prestador já marcado no cadastro", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal", exact: true });
  await expect(page.getByRole("link", { name: "Entrar", exact: true }).first()).toBeVisible();
  await nav.getByRole("link", { name: "Oferecer serviços" }).click();
  await expect(page).toHaveURL(/\/cadastro\?tipo=PRESTADOR$/);
  await expect(page.getByRole("radio", { name: /Quero oferecer serviços/ })).toBeChecked();
});

test("menu do avatar funciona por teclado e cada conta vê o que pode usar", async ({ page }) => {
  await login(page, "prestador1@demo.example");
  await page.goto("/buscar");
  const nav = page.getByRole("navigation", { name: "Principal", exact: true });
  await expect(nav.getByRole("link", { name: "Oferecer serviços" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Oportunidades" })).toBeVisible();

  const trigger = page.getByRole("button", { name: /^Menu da conta de/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Ofertas" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Ver meu perfil público" })).toHaveAttribute("href", /\/prestadores\//);
  await expect(menu).toContainText("prestador1@demo.example");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await menu.getByRole("menuitem", { name: "Propostas" }).click();
  await expect(page).toHaveURL(/\/painel\/propostas$/);

  await trigger.click();
  await menu.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /^Menu da conta de/ })).toHaveCount(0);
});

test("o menu do avatar aparece no celular sem estourar a largura", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await login(page, "cliente1@demo.example");
  const trigger = page.getByRole("button", { name: /^Menu da conta de/ });
  await expect(trigger).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: "Projetos" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("clique em link marca o destino e esmaece a página até a rota mudar", async ({ page }) => {
  await login(page, "cliente1@demo.example");
  // Rota de detalhe: sem loading.tsx, a espera acontece com a página anterior na tela.
  await page.route("**/painel/projetos/**", async (route) => { await new Promise((resolve) => setTimeout(resolve, 900)); await route.continue(); });
  const link = page.locator(".project-row a").first();
  await link.click();
  await expect(page.locator("html")).toHaveAttribute("data-nav", "loading");
  await expect(link).toHaveAttribute("data-nav-pending", "");
  await expect(page).toHaveURL(/\/painel\/projetos\/[0-9a-f-]{36}$/);
  await expect(page.locator("html")).toHaveAttribute("data-nav", "done");
  await expect(page.locator("main")).not.toHaveAttribute("aria-busy", "true");
});

test("botão do formulário mostra a espera sem perder o foco", async ({ page }) => {
  await page.route("**/entrar", async (route) => { if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 700)); await route.continue(); });
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("ninguem@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("uma-senha-qualquer-1");
  const button = page.getByRole("button", { name: "Entrar", exact: true });
  await button.click();
  await expect(page.getByRole("button", { name: "Entrando…" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: "Entrando…" })).toBeFocused();
  await expect(page.locator(".form-error")).toBeVisible();
});
