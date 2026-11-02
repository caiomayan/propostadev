import { test, expect, type Browser, type Page } from "@playwright/test";
import { Pool } from "pg";

const password = "Proposta-test-password-2026";
const triageUrl = "/triagem?tipo=landing-page&titulo=Site+para+triagem+de+propostas&descricao=Preciso+de+uma+p%C3%A1gina+de+vendas+com+depoimentos+e+formul%C3%A1rio+de+contato+integrado.&orcamento=ATE&max=2000&prazo=30";

async function register(page: Page, name: string, email: string, type: "CLIENTE" | "PRESTADOR") {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: type === "CLIENTE" ? /Quero contratar/ : /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/);
}

async function providerWithLandingOffer(browser: Browser, errors: string[], name: string, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(page, "Prestador Aceite", email, "PRESTADOR");
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome de exibição").fill(name);
  await page.getByLabel("Descrição", { exact: true }).fill("Desenvolvimento de páginas e sistemas para pequenos negócios com cuidado e comunicação clara.");
  await page.getByLabel("Anos de experiência").fill("4");
  await page.getByLabel("Autorizo a publicação").check();
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil salvo");
  await page.goto("/painel/ofertas/nova");
  await page.getByLabel("Tipo de serviço", { exact: true }).selectOption({ label: "Landing Page" });
  await page.getByLabel("Título", { exact: true }).fill("Landing pages rápidas");
  await page.getByLabel("Descrição", { exact: true }).fill("Uma página responsiva para apresentar seu negócio com conteúdo organizado e identidade visual.");
  await page.getByLabel("Modelo de preço").selectOption("FIXO");
  await page.getByLabel("Preço anunciado").fill("1500.00");
  await page.getByLabel("Modelo de prazo").selectOption("FIXO");
  await page.getByLabel("Prazo anunciado (dias)").fill("15");
  await page.getByLabel("Publicar oferta").check();
  await page.getByRole("button", { name: "Salvar oferta" }).click();
  await expect(page).toHaveURL(/\/painel\/ofertas\/[a-f0-9-]+\/editar$/);
  return { context, page };
}

async function propose(page: Page, projectId: string, valor: string, prazo: string, mensagem: string) {
  await page.goto(`/painel/oportunidades/${projectId}`);
  await page.getByLabel("Valor da proposta (R$)").fill(valor);
  await page.getByLabel("Prazo (dias)").fill(prazo);
  await page.getByLabel("Mensagem para o Cliente").fill(mensagem);
  await page.getByRole("button", { name: "Enviar proposta" }).click();
  await expect(page).toHaveURL(/enviada=1/);
}

// Os dados criados aqui não podem vazar para outras specs (a busca conta prestadores por tipo).
async function cleanup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { await pool.query(`DELETE FROM "user" WHERE email LIKE 'prestador-aceite-%@test.example' OR email LIKE 'cliente-aceite-%@test.example'`); } finally { await pool.end(); }
}
test.beforeAll(cleanup);
test.afterAll(cleanup);

test("Cliente pré-seleciona, filtra e aceita com confirmação; vê os contatos do Prestador; o Prestador vê o e-mail do Cliente", async ({ browser }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();
  const errors: string[] = [];
  const nameA = `Dev Aceite A ${stamp}`, nameB = `Dev Aceite B ${stamp}`;
  const emailA = `prestador-aceite-a-${stamp}@test.example`, emailB = `prestador-aceite-b-${stamp}@test.example`;
  const clientEmail = `cliente-aceite-${stamp}@test.example`;

  const a = await providerWithLandingOffer(browser, errors, nameA, emailA);
  const b = await providerWithLandingOffer(browser, errors, nameB, emailB);

  // Cliente publica o Projeto
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  client.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(client, "Cliente Aceite Souza", clientEmail, "CLIENTE");
  await client.goto(triageUrl);
  await client.getByRole("button", { name: "Publicar projeto" }).click();
  await expect(client).toHaveURL(/\/painel\/projetos\/[0-9a-f-]{36}\?publicado=1/);
  const projectPath = new URL(client.url()).pathname;
  const projectId = projectPath.split("/").pop()!;

  // A: mais caro e mais rápido. B: mais barato e além do prazo desejado (30 dias).
  await propose(a.page, projectId, "1900", "20", "Entrego a página com testes de formulário, ajustes de conteúdo e uma semana de acompanhamento.");
  await propose(b.page, projectId, "1200", "45", "Posso entregar a página com calma, incluindo revisão de textos, testes em celulares e acompanhamento.");

  // Triagem: cartões, régua, prazo comparado e ordenação por link
  await client.goto(projectPath);
  await expect(client.getByRole("heading", { name: "2 propostas ativas" })).toBeVisible();
  const cardA = client.locator("article.proposal-card", { hasText: nameA });
  const cardB = client.locator("article.proposal-card", { hasText: nameB });
  await expect(cardA).toContainText("R$ 1.900,00");
  await expect(cardA).toContainText("10 dias antes do desejado");
  await expect(cardB).toContainText("15 dias além do desejado");
  await expect(cardA.getByRole("link", { name: nameA })).toHaveAttribute("href", /\/prestadores\//);
  await expect(cardA.locator(".data-ruler")).toBeVisible();
  await expect(cardA).toContainText("Ainda não recebeu avaliações");
  const firstCard = client.locator("article.proposal-card").first();
  await client.getByRole("link", { name: "Menor valor" }).click();
  await expect(client).toHaveURL(/ordem=valor/);
  await expect(client.getByRole("link", { name: "Menor valor" })).toHaveAttribute("aria-current", "true");
  await expect(firstCard).toContainText(nameB);
  await client.getByRole("link", { name: "Menor prazo" }).click();
  await expect(client).toHaveURL(/ordem=prazo/);
  await expect(firstCard).toContainText(nameA);

  // Pré-seleciona A, filtra e desmarca/volta
  await cardA.getByRole("button", { name: /^Pré-selecionar/ }).click();
  await expect(cardA).toContainText("Pré-selecionada");
  await expect(client.locator("article.proposal-card").first()).toContainText(nameA);
  await client.getByRole("link", { name: "Só pré-selecionadas" }).click();
  await expect(client).toHaveURL(/pre=1/);
  await expect(client.locator("article.proposal-card")).toHaveCount(1);
  await expect(client.locator("article.proposal-card")).toContainText(nameA);
  await expect(client.getByRole("link", { name: "Menor prazo" })).toHaveAttribute("href", /pre=1/);
  await client.getByRole("link", { name: "Todas" }).click();
  await expect(client.locator("article.proposal-card")).toHaveCount(2);

  // Aceitar pede confirmação explícita; abrir não aceita nada
  await cardA.getByText(`Aceitar proposta de ${nameA}`).click();
  await expect(cardA.getByText("Aceitar encerra o projeto e recusa todas as outras propostas.")).toBeVisible();
  await expect(client.locator("section.accepted-provider")).toHaveCount(0);
  await cardA.getByRole("button", { name: "Confirmar aceite" }).click();

  // Depois do Aceite: Prestador escolhido em destaque, contatos e lista somente leitura
  await expect(client.locator("section.accepted-provider").getByText("Prestador escolhido", { exact: true })).toBeVisible();
  const chosen = client.locator("section.accepted-provider");
  await expect(chosen).toContainText(nameA);
  await expect(chosen.getByRole("link", { name: "E-mail de contato" })).toHaveAttribute("href", `mailto:${emailA}`);
  await expect(chosen.getByRole("link", { name: "Ver perfil público" })).toHaveAttribute("href", /\/prestadores\//);
  await expect(client.locator(".status", { hasText: "Encerrado" })).toBeVisible();
  await expect(client.getByRole("button", { name: /Pré-selecionar|Aceitar|Recusar|Confirmar/ })).toHaveCount(0);
  await expect(client.locator("article.proposal-card", { hasText: nameB })).toContainText("Recusada");
  await expect(client.getByRole("heading", { name: "Convide prestadores compatíveis" })).toHaveCount(0);
  await client.reload();
  await expect(client.locator("section.accepted-provider").getByText("Prestador escolhido", { exact: true })).toBeVisible();

  // Prestador aceito vê nome e e-mail do Cliente; o recusado, não
  await a.page.goto("/painel/propostas");
  const rowA = a.page.locator(".project-row", { hasText: "Site para triagem de propostas" });
  await expect(rowA).toContainText("Aceita");
  await expect(rowA).toContainText("Cliente Aceite Souza");
  await expect(rowA.getByRole("link", { name: clientEmail })).toHaveAttribute("href", `mailto:${clientEmail}`);
  await b.page.goto("/painel/propostas");
  const rowB = b.page.locator(".project-row", { hasText: "Site para triagem de propostas" });
  await expect(rowB).toContainText("Recusada");
  await expect(b.page.locator("body")).not.toContainText(clientEmail);
  await expect(b.page.locator("body")).not.toContainText("Souza");
  await b.page.goto(`/painel/oportunidades/${projectId}`);
  await expect(b.page.locator("body")).not.toContainText(clientEmail);

  expect(errors.filter((text) => !/favicon/i.test(text))).toEqual([]);
  await a.context.close();
  await b.context.close();
  await clientContext.close();
});
