import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { confirmEmail } from "./support";

const password = "Proposta-test-password-2026";
const triageUrl = (title: string) => `/triagem?tipo=landing-page&titulo=${encodeURIComponent(title)}&descricao=${encodeURIComponent("Preciso de uma página de vendas com depoimentos e formulário de contato integrado.")}&orcamento=ATE&max=2000&prazo=30`;

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

// Perfil e oferta criados aqui não podem vazar para outras specs (a busca conta prestadores por tipo).
async function cleanup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { await pool.query(`DELETE FROM "user" WHERE email LIKE 'prestador-aviso-%@test.example' OR email LIKE 'cliente-aviso-%@test.example'`); } finally { await pool.end(); }
}
test.beforeAll(cleanup);
test.afterAll(cleanup);

test("Cliente convida; Prestador vê o número no sino, abre o Aviso e o número diminui; Cliente não vê Avisos alheios", async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const providerName = `Dev Aviso ${stamp}`;
  const errors: string[] = [];

  const providerContext = await browser.newContext();
  const provider = await providerContext.newPage();
  provider.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(provider, "Prestador Aviso", `prestador-aviso-${stamp}@test.example`, "PRESTADOR");
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
  await expect(provider.getByRole("link", { name: "Avisos", exact: true })).toBeVisible(); // sino sem número

  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  client.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(client, "Cliente Aviso", `cliente-aviso-${stamp}@test.example`, "CLIENTE");
  for (const title of ["Primeiro projeto de aviso", "Segundo projeto de aviso"]) {
    await client.goto(triageUrl(title));
    await client.getByRole("button", { name: "Publicar projeto" }).click();
    await expect(client).toHaveURL(/\/painel\/projetos\/[0-9a-f-]{36}\?publicado=1/);
    await client.getByRole("button", { name: `Convidar ${providerName}` }).click();
    await expect(client.getByRole("status").filter({ hasText: "Convidado" })).toBeVisible();
  }
  await expect(client.getByRole("link", { name: "Avisos", exact: true })).toBeVisible(); // Cliente não recebe Aviso de Convite

  // Prestador: o sino mostra 2, a lista destaca os não lidos, abrir um leva à Oportunidade e o número cai para 1.
  await provider.goto("/painel");
  await expect(provider.getByRole("link", { name: /^2 avisos não lidos$/ })).toBeVisible();
  await provider.getByRole("link", { name: /avisos? não lidos?$/ }).click();
  await expect(provider).toHaveURL(/\/painel\/avisos$/);
  const rows = provider.locator(".aviso-row");
  await expect(rows).toHaveCount(2);
  await expect(provider.locator(".aviso-row[data-unread]")).toHaveCount(2);
  await rows.first().getByRole("link", { name: /Você recebeu um convite/ }).click();
  await expect(provider).toHaveURL(/\/painel\/oportunidades\/[0-9a-f-]{36}$/);
  await expect(provider.getByRole("link", { name: /^1 aviso não lido$/ })).toBeVisible();
  await provider.goto("/painel/avisos");
  await expect(provider.locator(".aviso-row[data-unread]")).toHaveCount(1);
  await provider.getByRole("button", { name: "Marcar todos como lidos" }).click();
  await expect(provider.locator(".aviso-row[data-unread]")).toHaveCount(0);
  await expect(provider.getByRole("link", { name: "Avisos", exact: true })).toBeVisible();

  // O Cliente só vê os próprios Avisos (nenhum, até receber Proposta).
  await client.goto("/painel/avisos");
  await expect(client.getByRole("heading", { name: "Nenhum aviso por enquanto" })).toBeVisible();

  expect(errors.filter((text) => !/favicon/i.test(text))).toEqual([]);
  await providerContext.close();
  await clientContext.close();
});
