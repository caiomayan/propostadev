import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { confirmEmail } from "./support";

const password = "Proposta-test-password-2026";
const emailLike = "prestador-vip-%@test.example";

async function withPool<T>(run: (pool: Pool) => Promise<T>) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { return await run(pool); } finally { await pool.end(); }
}
// Os perfis criados aqui não podem vazar para outras specs (a busca conta prestadores por tipo).
const cleanup = () => withPool((pool) => pool.query(`DELETE FROM "user" WHERE email LIKE '${emailLike}'`));
test.beforeAll(cleanup);
test.afterAll(cleanup);

async function register(page: Page, name: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("radio", { name: /Quero oferecer serviços/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await confirmEmail(page, email);
  await expect(page).toHaveURL(/\/painel/);
}

test("Prestador registra Interesse no VIP; ao virar VIP (pela plataforma) aparece no Destaque VIP da busca", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `prestador-vip-${stamp}@test.example`;
  const name = `Dev Destaque ${stamp}`;
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await register(page, "Prestador VIP", email);

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

  // Sem VIP, este Prestador não entra na faixa (o seed demo já tem outros VIP em Landing Page)
  await page.goto("/buscar?tipo=landing-page");
  await expect(page.getByRole("region", { name: "Destaque VIP" }).getByText(name)).toHaveCount(0);

  // Página do VIP: aviso, interesse registrado uma única vez
  await page.goto("/painel");
  await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: "VIP" }).click();
  await expect(page).toHaveURL(/\/painel\/vip$/);
  await expect(page.getByText("Nesta versão não há assinatura nem cobrança")).toBeVisible();
  await page.getByRole("button", { name: "Tenho interesse" }).click();
  await expect(page.getByRole("status")).toContainText("Interesse registrado em");
  await expect(page.getByRole("button", { name: "Tenho interesse" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Interesse registrado em");

  // A plataforma marca VIP (nenhuma ação do usuário escreve a coluna)
  await withPool((pool) => pool.query(`UPDATE perfil_prestador SET vip = true WHERE usuario_id = (SELECT id FROM "user" WHERE email = $1)`, [email]));
  await page.goto("/painel/vip");
  await expect(page.getByRole("status")).toContainText("Você já é Prestador VIP");
  await page.goto("/buscar?tipo=landing-page");
  const highlight = page.getByRole("region", { name: "Destaque VIP" });
  await expect(highlight).toContainText(name);
  await expect(highlight.getByText("VIP", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
