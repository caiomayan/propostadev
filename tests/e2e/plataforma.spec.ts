import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";

const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
// Prestador da demo que pede o VIP no seed (plataforma.ts), achado pelo e-mail de login e não pelo nome.
const requesterEmail = "prestador4@demo.example";

async function withPool<T>(run: (pool: Pool) => Promise<T>) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
  try { return await run(pool); } finally { await pool.end(); }
}
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
// Deixa o Prestador como o seed o entrega: pediu o VIP e ainda não é VIP.
const prepare = () => withPool(async (pool) => {
  const { rows } = await pool.query<{ id: string; slug: string; name: string }>(`SELECT p.id, p.slug, p.nome_exibicao AS name FROM perfil_prestador p JOIN "user" u ON u.id = p.usuario_id WHERE u.email = $1`, [requesterEmail]);
  await pool.query("UPDATE perfil_prestador SET vip = false WHERE id = $1", [rows[0].id]);
  await pool.query("INSERT INTO interesse_vip(prestador_id) VALUES($1) ON CONFLICT DO NOTHING", [rows[0].id]);
  return rows[0];
});
const restore = () => withPool((pool) => pool.query(`UPDATE perfil_prestador SET vip = false WHERE usuario_id = (SELECT id FROM "user" WHERE email = $1)`, [requesterEmail]));
test.afterAll(restore);

test("a Equipe concede VIP a quem pediu e o selo aparece no Perfil; retirar devolve o pedido ao estado anterior", async ({ page }) => {
  test.setTimeout(120_000);
  const provider = await prepare();
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await login(page, "plataforma@demo.example");

  await page.getByRole("button", { name: "Menu da conta de Equipe Proposta.dev" }).click();
  await page.getByRole("menuitem", { name: "Plataforma" }).click();
  await expect(page).toHaveURL(/\/plataforma$/);
  await expect(page.getByRole("heading", { level: 1, name: "Plataforma" })).toBeVisible();

  const requests = page.getByRole("heading", { name: /Pediram o VIP/ }).locator("xpath=ancestor::div[contains(@class,'panel')]");
  const current = page.getByRole("heading", { name: /VIP agora/ }).locator("xpath=ancestor::div[contains(@class,'panel')]");
  await expect(requests.getByRole("link", { name: provider.name })).toBeVisible();
  await expect(requests.getByText(/Pediu em/).first()).toBeVisible();
  await expect(current.getByRole("link", { name: provider.name })).toHaveCount(0);

  await requests.getByRole("button", { name: `Conceder VIP a ${provider.name}` }).click();
  await expect(current.getByRole("link", { name: provider.name })).toBeVisible();
  await expect(requests.getByRole("link", { name: provider.name })).toHaveCount(0);

  await page.goto(`/prestadores/${provider.slug}`);
  await expect(page.locator(".profile-hero").getByText("VIP", { exact: true })).toBeVisible();

  await page.goto("/plataforma");
  await current.getByRole("button", { name: `Retirar VIP a ${provider.name}` }).click();
  await expect(requests.getByRole("link", { name: provider.name })).toBeVisible(); // o Interesse no VIP continua registrado
  await expect(current.getByRole("link", { name: provider.name })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("visitante e Prestador recebem 404 em /plataforma e não veem o link no menu", async ({ page }) => {
  const visitor = await page.goto("/plataforma");
  expect(visitor?.status()).toBe(404);
  await login(page, "prestador1@demo.example");
  const provider = await page.goto("/plataforma");
  expect(provider?.status()).toBe(404);
  await page.goto("/painel");
  await page.getByRole("button", { name: /Menu da conta de/ }).click();
  await expect(page.getByRole("menuitem", { name: "Plataforma" })).toHaveCount(0);
});
