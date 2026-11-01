import { test, expect } from "@playwright/test";

const password = "Proposta-test-password-2026";

test("visitante faz a Triagem, cria conta de Cliente, publica e vê o projeto em Meus projetos", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  // Entrada na home
  await page.goto("/");
  await expect(page.locator(".triage-slot")).toContainText("O que você precisa?");
  await page.locator(".triage-slot").getByRole("link", { name: "Começar a Triagem" }).click();

  // Objetivo → Tipo de serviço
  await expect(page).toHaveURL(/\/triagem$/);
  await expect(page.getByRole("link", { name: /Já sei o que preciso/ })).toBeVisible();
  await page.getByRole("link", { name: /Quero divulgar um produto ou campanha/ }).click();
  await page.getByRole("link", { name: /Landing Page/ }).click();

  // Detalhes: dados inválidos voltam com erros, sem 500
  await expect(page.getByRole("heading", { name: "Conte sobre o seu projeto" })).toBeVisible();
  await page.goto("/triagem?tipo=landing-page&titulo=abc&descricao=curta&orcamento=ATE&max=&prazo=0");
  await expect(page.getByRole("heading", { name: "Conte sobre o seu projeto" })).toBeVisible();
  await expect(page.locator("#erro-titulo")).toContainText("pelo menos 5");
  await page.goto("/triagem?tipo=landing-page");
  await page.getByLabel("Título do projeto").fill("Página de lançamento do meu curso");
  await page.getByLabel("Descreva o que você precisa").fill("Preciso de uma página de vendas com depoimentos, formulário de contato e integração com meu e-mail.");
  await page.getByLabel("Uma faixa").check();
  await page.getByLabel("Valor mínimo (R$)").fill("900");
  await page.getByLabel("Valor máximo (R$)").fill("1500,00");
  await page.getByLabel("Prazo desejado (dias)").fill("30");
  await page.getByRole("button", { name: /Ver preço de referência/ }).click();

  // Resultado sem login: Preço de referência + Prestadores compatíveis
  await expect(page).toHaveURL(/\/triagem\?.*orcamento=FAIXA/);
  await expect(page.getByRole("heading", { name: "Página de lançamento do meu curso" })).toBeVisible();
  await expect(page.locator("#referencia")).toBeVisible();
  await expect(page.getByText("R$ 1.000,00").first()).toBeVisible();
  await expect(page.getByText(/Seu orçamento: /)).toBeVisible();
  const cards = page.locator(".compatible-card");
  await expect(cards.first()).toBeVisible();
  await expect(page.getByText("Dentro do orçamento").first()).toBeVisible();
  await expect(page.getByText("Prazo compatível").first()).toBeVisible();
  await expect(cards.first().getByRole("link", { name: "Ver perfil" })).toHaveAttribute("href", /\/prestadores\//);
  await expect(page.getByRole("link", { name: "Entrar para publicar" })).toHaveAttribute("href", /\/entrar\?next=%2Ftriagem/);

  // Cadastro como Cliente; o rascunho é retomado no painel
  await page.getByRole("link", { name: "Criar conta de Cliente" }).click();
  await expect(page).toHaveURL(/\/cadastro/);
  const email = `cliente-triagem-${Date.now()}@test.example`;
  await page.getByLabel("Nome", { exact: true }).fill("Cliente da Triagem");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/);
  await page.getByRole("link", { name: "Continuar a Triagem" }).click();
  await expect(page.getByRole("heading", { name: "Página de lançamento do meu curso" })).toBeVisible();

  // Publicar
  await page.getByRole("button", { name: "Publicar projeto" }).click();
  await expect(page).toHaveURL(/\/painel\/projetos\/[0-9a-f-]{36}\?publicado=1/);
  await expect(page.getByRole("status").filter({ hasText: "Projeto publicado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Página de lançamento do meu curso" })).toBeVisible();
  await expect(page.locator(".status")).toHaveText("Aberto");

  // Meus projetos
  await page.getByRole("link", { name: "Projetos", exact: true }).click();
  await expect(page).toHaveURL(/\/painel\/projetos$/);
  const row = page.locator(".project-row", { hasText: "Página de lançamento do meu curso" });
  await expect(row).toContainText("Aberto");
  await expect(row).toContainText("R$ 900,00 a R$ 1.500,00");

  // Cancelar com confirmação
  await row.getByRole("link", { name: "Página de lançamento do meu curso" }).click();
  await page.getByText("Cancelar projeto", { exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.locator(".status")).toHaveText("Cancelado");
  await expect(page.getByText("Cancelar projeto", { exact: true })).toHaveCount(0);

  expect(errors.filter((text) => !/favicon/i.test(text))).toEqual([]);
});

test("Prestador vê explicação em vez de publicar; tipo inválido volta ao início; projetos exigem login", async ({ page }) => {
  await page.goto("/triagem?tipo=nao-existe&titulo=x");
  await expect(page.getByRole("heading", { name: "O que você precisa?" })).toBeVisible();
  await page.goto("/painel/projetos");
  await expect(page).toHaveURL(/\/entrar/);

  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill("Prestador da Triagem");
  await page.getByLabel("E-mail", { exact: true }).fill(`prestador-triagem-${Date.now()}@test.example`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/);
  await page.goto("/triagem?tipo=landing-page&titulo=Meu+projeto+de+teste&descricao=Descri%C3%A7%C3%A3o+longa+o+bastante+para+passar+na+valida%C3%A7%C3%A3o+do+servidor.&orcamento=NAO_SEI&flexivel=1");
  await expect(page.getByText("Contas de Prestador não publicam projetos")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar projeto" })).toHaveCount(0);
  await page.goto("/painel/projetos");
  await expect(page).toHaveURL(/\/painel$/);
});
