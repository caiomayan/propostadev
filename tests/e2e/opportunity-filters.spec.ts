import { test, expect, type Page } from "@playwright/test";

// Usa os dados do seed demo (scripts/demo-mvp3/oportunidades.ts): prestador1 oferece Landing Page.
const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
const card = (page: Page, title: string) => page.locator(".project-list > li").filter({ has: page.getByRole("heading", { name: title }) });

test.describe("Filtros de Oportunidades", () => {
  test.beforeEach(async ({ page }) => { await login(page, "prestador1@demo.example"); });

  test("a página abre com o recorte da URL e mostra a contagem", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/painel/oportunidades?q=ateli%C3%AA");
    await expect(page.getByRole("status").filter({ hasText: "1 oportunidade encontrada" })).toBeVisible();
    await expect(card(page, "Página de vendas para ateliê de bolsas")).toBeVisible();
    await expect(page.getByRole("list", { name: "Filtros ativos" })).toContainText("Busca: ateliê");
    await expect(page.getByLabel("Buscar no título e na descrição")).toHaveValue("ateliê");
    expect(errors).toEqual([]);
  });

  test("Convite e prazo combinam; orçamento mantém 'ainda não sei' com a marca", async ({ page }) => {
    await page.goto("/painel/oportunidades?situacao=convidado&prazo_ate=7");
    await expect(card(page, "Página rápida para evento de música")).toBeVisible();
    await expect(card(page, "Página de vendas para ateliê de bolsas")).toHaveCount(0); // sem Convite
    await expect(card(page, "Landing page para consultoria contábil")).toHaveCount(0); // prazo de 15 dias
    await page.goto("/painel/oportunidades?orcamento_min=50000");
    const unknown = card(page, "Página para academia de bairro");
    await expect(unknown).toBeVisible();
    await expect(unknown.getByText("Orçamento não informado")).toBeVisible();
    await expect(card(page, "Landing page para consultoria contábil")).toHaveCount(0); // teto de R$ 1.800
  });

  test("a ordenação mantém os filtros na URL", async ({ page }) => {
    await page.goto("/painel/oportunidades?situacao=sem_proposta&prazo_ate=30");
    await page.getByRole("navigation", { name: "Ordenar oportunidades" }).getByRole("link", { name: "Mais recentes" }).click();
    await expect(page).toHaveURL(/situacao=sem_proposta/);
    await expect(page).toHaveURL(/prazo_ate=30/);
    await expect(page).toHaveURL(/ordem=recentes/);
  });

  test("sem resultado: mensagem clara e 'Limpar filtros' volta à lista inteira", async ({ page }) => {
    await page.goto("/painel/oportunidades?q=zzzxxxnaoexiste");
    await expect(page.getByRole("heading", { name: "Nenhuma oportunidade com esses filtros" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Limpar filtros" }).last().click();
    await expect(page).toHaveURL(/\/painel\/oportunidades$/);
    await expect(page.locator(".project-list > li").first()).toBeVisible();
  });

  test("valores inválidos são ignorados com aviso, sem quebrar a página", async ({ page }) => {
    await page.goto("/painel/oportunidades?prazo_ate=-3&orcamento_min=abc&q=ateli%C3%AA");
    await expect(page.getByRole("alert").filter({ hasText: "Ignoramos filtros inválidos" })).toContainText("Orçamento mínimo");
    await expect(card(page, "Página de vendas para ateliê de bolsas")).toBeVisible();
  });

  test("o formulário aplica os filtros pela URL", async ({ page }) => {
    await page.goto("/painel/oportunidades");
    await page.getByText("Filtrar oportunidades").click();
    await page.getByLabel("Orçamento a partir de (R$)").fill("2500");
    await page.getByLabel("Situação").selectOption("sem_proposta");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/orcamento_min=2500/);
    await expect(page).toHaveURL(/situacao=sem_proposta/);
    await expect(card(page, "Landing page para workshop de fotografia")).toBeVisible();
    await expect(card(page, "Página de vendas para ateliê de bolsas")).toHaveCount(0); // teto de R$ 900
  });
});
