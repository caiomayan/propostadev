import { test, expect } from "@playwright/test";

// Dados do seed demo (banco local de teste): "Fonte de demonstração", sem chamar o Firecrawl.
test("resultado da Triagem mostra o preço externo com fonte, data e aviso, separado do Preço de referência", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/triagem?tipo=landing-page&titulo=Página de lançamento do meu curso&descricao=Preciso de uma página de vendas com depoimentos, formulário de contato e integração com meu e-mail.&orcamento=FAIXA&min=900&max=1500&prazo=30");
  const external = page.getByRole("region", { name: /Quanto cobram fora da plataforma/ });
  await expect(external).toBeVisible();
  await expect(external).toContainText("R$ 800,00 – R$ 2.000,00");
  await expect(external.getByRole("link", { name: /Fonte de demonstração/ })).toHaveAttribute("href", "https://example.com/demonstracao/landing-page");
  await expect(external.getByRole("link", { name: /Fonte de demonstração/ })).toHaveAttribute("rel", "noopener noreferrer");
  await expect(external).toContainText(/coletado em \d{2}\/\d{2}\/\d{4}/);
  await expect(external).toContainText("Preço fora da plataforma; não entra no Preço de referência.");
  await expect(page.locator("#referencia")).not.toContainText("Fonte de demonstração");
  expect(errors).toEqual([]);
});

test("Tipo de serviço sem fonte mostra a mensagem honesta", async ({ page }) => {
  await page.goto("/triagem?tipo=api&titulo=API para integrar a loja&descricao=Preciso de uma API para integrar minha loja ao sistema de estoque com autenticação.&orcamento=ATE&max=5000&prazo=30");
  await expect(page.getByText("Ainda não há preço externo para este Tipo de serviço.")).toBeVisible();
});
