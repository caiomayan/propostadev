import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { confirmEmail } from "./support";

const password = "Proposta-test-password-2026";
const triageUrl = "/triagem?tipo=landing-page&titulo=Site+de+lan%C3%A7amento+do+curso&descricao=Preciso+de+uma+p%C3%A1gina+de+vendas+com+depoimentos+e+formul%C3%A1rio+de+contato+integrado.&orcamento=ATE&max=2000&prazo=30";

async function register(page: Page, name: string, email: string, type: "CLIENTE" | "PRESTADOR") {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: type === "CLIENTE" ? /Quero contratar/ : /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel/);
}

// A oferta e o projeto criados aqui não podem vazar para outras specs (a busca conta prestadores por tipo).
async function cleanup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { await pool.query(`DELETE FROM "user" WHERE email LIKE 'prestador-convite-%@test.example' OR email LIKE 'cliente-convite-%@test.example'`); } finally { await pool.end(); }
}
test.beforeAll(cleanup);
test.afterAll(cleanup);

test("Cliente publica e convida; Prestador vê o selo Convite, envia Proposta; Cliente vê o contador", async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const providerName = `Dev Convite ${stamp}`;
  const errors: string[] = [];

  // Prestador: perfil e oferta ativa em Landing Page
  const providerContext = await browser.newContext();
  const provider = await providerContext.newPage();
  provider.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(provider, "Prestador Convite", `prestador-convite-${stamp}@test.example`, "PRESTADOR");
  await provider.goto("/painel/oportunidades");
  await expect(provider.getByRole("heading", { name: "Crie seu perfil para ver oportunidades" })).toBeVisible();
  await provider.goto("/painel/perfil");
  await provider.getByLabel("Nome de exibição").fill(providerName);
  await provider.getByLabel("Descrição", { exact: true }).fill("Desenvolvimento de páginas e sistemas para pequenos negócios com cuidado e comunicação clara.");
  await provider.getByLabel("Anos de experiência").fill("4");
  await provider.getByLabel("Autorizo a publicação").check();
  await provider.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(provider.getByRole("status")).toContainText("Perfil salvo");
  await provider.goto("/painel/ofertas/nova");
  await provider.getByLabel("Tipo de serviço", { exact: true }).selectOption({ label: "Landing Page" });
  await provider.getByLabel("Título", { exact: true }).fill("Landing pages rápidas");
  await provider.getByLabel("Descrição", { exact: true }).fill("Uma página responsiva para apresentar seu negócio com conteúdo organizado e identidade visual.");
  await provider.getByLabel("Modelo de preço").selectOption("FIXO");
  await provider.getByLabel("Preço anunciado").fill("1500.00");
  await provider.getByLabel("Modelo de prazo").selectOption("FIXO");
  await provider.getByLabel("Prazo anunciado (dias)").fill("15");
  await provider.getByLabel("Publicar oferta").check();
  await provider.getByRole("button", { name: "Salvar oferta" }).click();
  await expect(provider).toHaveURL(/\/painel\/ofertas\/[a-f0-9-]+\/editar$/);
  const nav = provider.getByRole("navigation", { name: "Painel" });
  await expect(nav.getByRole("link", { name: "Oportunidades" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Propostas" })).toBeVisible();

  // Cliente: publica e convida
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  client.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(client, "Cliente Convite", `cliente-convite-${stamp}@test.example`, "CLIENTE");
  await client.goto(triageUrl);
  await expect(client.getByText("Depois de publicar, você poderá convidar")).toBeVisible();
  await expect(client.getByRole("button", { name: /^Convidar/ })).toHaveCount(0);
  await client.getByRole("button", { name: "Publicar projeto" }).click();
  await expect(client).toHaveURL(/\/painel\/projetos\/[0-9a-f-]{36}\?publicado=1/);
  const projectPath = new URL(client.url()).pathname;
  await expect(client.getByRole("heading", { name: "0 propostas ativas" })).toBeVisible();
  await client.getByRole("button", { name: `Convidar ${providerName}` }).click();
  await expect(client.getByRole("status").filter({ hasText: "Convidado" })).toBeVisible();
  await expect(client.getByText(/1 de 10 convites usados/)).toBeVisible();

  // Prestador: Oportunidades com o selo Convite, sem dados privados do Cliente
  await provider.goto("/painel/oportunidades");
  const card = provider.locator("li.panel", { hasText: "Site de lançamento do curso" }).first(); // convidados vêm primeiro
  await expect(card).toBeVisible();
  await expect(card.getByText("Convite", { exact: true })).toBeVisible();
  await expect(card).toContainText("Cliente: Cliente");
  await expect(card).not.toContainText("@test.example");
  await expect(card.locator(".data-ruler")).toBeVisible();
  await card.getByRole("link", { name: "Ver projeto e propor" }).click();
  await expect(provider.getByRole("heading", { name: "Enviar proposta" })).toBeVisible();

  // O valor posiciona-se na régua antes de enviar
  await provider.getByLabel("Valor da proposta (R$)").fill("1800");
  await expect(provider.getByText(/Seu valor está (dentro da|abaixo da|acima da) faixa anunciada/).first()).toBeVisible();
  await provider.getByLabel("Prazo (dias)").fill("20");
  await provider.getByLabel("Mensagem para o Cliente").fill("Entrego a página com testes de formulário, ajustes de conteúdo e uma semana de acompanhamento.");
  await provider.getByRole("button", { name: "Enviar proposta" }).click();
  await expect(provider).toHaveURL(/enviada=1/);
  await expect(provider.getByRole("status").filter({ hasText: "Proposta enviada" })).toBeVisible();
  await expect(provider.getByRole("heading", { name: /R\$\s*1\.800,00 em 20 dias/ })).toBeVisible();

  // Editar e conferir em Minhas propostas
  await provider.getByLabel("Valor da proposta (R$)").fill("1750,50");
  await provider.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(provider.getByRole("status").filter({ hasText: "Proposta atualizada" })).toBeVisible();
  await provider.goto("/painel/propostas");
  const row = provider.locator(".project-row", { hasText: "Site de lançamento do curso" });
  await expect(row).toContainText("R$ 1.750,50");
  await expect(row).toContainText("Enviada");
  await expect(row).toContainText("Projeto: Aberto");

  // Cliente: contador em Meus projetos, no painel e no detalhe
  await client.goto("/painel/projetos");
  await expect(client.locator(".project-row", { hasText: "Site de lançamento do curso" })).toContainText("1 proposta recebida");
  await client.goto("/painel");
  await expect(client.getByText("1 proposta recebida")).toBeVisible();
  await client.goto(projectPath);
  await expect(client.getByRole("heading", { name: "1 proposta ativa" })).toBeVisible();
  await expect(client.getByText(providerName).first()).toBeVisible();
  await expect(client.locator(".proposal-card .figure", { hasText: "R$ 1.750,50" })).toBeVisible();
  await expect(client.getByText(/prestador-convite-.*@test\.example/)).toHaveCount(0);

  // Retirar: some do contador; a página do Prestador continua acessível, só leitura
  await provider.goto(`/painel/oportunidades/${projectPath.split("/").pop()}`);
  await provider.getByText("Retirar proposta", { exact: true }).click();
  await provider.getByRole("button", { name: "Confirmar retirada" }).click();
  await expect(provider.locator("#minha ~ p .status, #minha + p .status").first()).toHaveText("Retirada");
  await expect(provider.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
  await client.goto("/painel/projetos");
  await expect(client.locator(".project-row", { hasText: "Site de lançamento do curso" })).toContainText("0 propostas recebidas");

  // Cliente não acessa as telas do Prestador; Prestador não acessa as do Cliente
  await client.goto("/painel/oportunidades");
  await expect(client).toHaveURL(/\/painel$/);
  await provider.goto("/painel/projetos");
  await expect(provider).toHaveURL(/\/painel$/);

  expect(errors.filter((text) => !/favicon/i.test(text))).toEqual([]);
  await providerContext.close();
  await clientContext.close();
});
