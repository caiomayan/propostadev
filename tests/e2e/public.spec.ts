import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { grantAcceptance } from "../integration/support";
import { confirmEmail } from "./support";

const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
function testPool() {
  if (!process.env.DATABASE_URL_TEST) throw new Error("DATABASE_URL_TEST é obrigatório para alterações de fixtures E2E.");
  const url = new URL(process.env.DATABASE_URL_TEST);
  if (!url.pathname.includes("test")) throw new Error("Fixtures E2E exigem um banco com test no nome.");
  return new Pool({ connectionString: url.toString() });
}

test("busca sem acento, filtros, preço médio por tipo e estados vazios", async ({ page }) => {
  await page.goto("/buscar?q=clara%20codigo");
  await expect(page.getByRole("heading", { name: "Clara Código — Demo" })).toBeVisible();
  await expect(page.locator(".provider-result")).toHaveCount(1);
  await page.goto("/buscar?tipo=landing-page");
  await expect(page.locator(".price-statistic")).toContainText("R$ 1.000,00");
  await expect(page.locator(".price-statistic")).toContainText("3 prestadores na amostra");
  await expect(page.locator(".provider-result")).toHaveCount(3);
  const form = page.locator(".desktop-filters");
  await form.getByLabel("Modelo de preço", { exact: true }).selectOption("FIXO");
  await form.getByLabel("Preço mínimo", { exact: true }).fill("900");
  await form.getByLabel("Preço máximo", { exact: true }).fill("1100");
  await form.getByRole("button", { name: "Buscar serviços", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Horizonte Digital — Demo" })).toBeVisible();
  await expect(page.locator(".provider-result")).toHaveCount(1);
  await expect(page.locator(".price-statistic")).toContainText("3 prestadores na amostra");
  await page.goto("/buscar?tipo=integracao-de-sistemas");
  await expect(page.locator(".price-statistic")).toContainText("Dados insuficientes");
  await page.goto("/buscar?modelo_preco=POR_HORA&ordenar=preco");
  await expect(page.locator(".provider-result")).toHaveCount(1);
  await expect(page.locator(".provider-result")).toContainText("R$ 90,00/hora");
  await page.goto("/buscar?prazo_ate=10");
  await expect(page.locator(".provider-result").filter({ hasText: "— Demo" })).toHaveCount(3);
  await page.goto("/buscar?q=consulta-inexistente-23891");
  await expect(page.getByRole("heading", { name: "Nenhum prestador encontrado" })).toBeVisible();
  await page.getByRole("link", { name: "Remover filtros", exact: true }).click();
  await expect(page.locator(".provider-result").first()).toBeVisible();
  await page.goto("/buscar?modelo_preco=SOB_CONSULTA&preco_min=10");
  await expect(page.locator("main").getByRole("alert")).toContainText("Alguns filtros são inválidos");
});

test("comparação limita três, persiste após reload, substitui contexto e remove pausada", async ({ page }) => {
  const pool = testPool();
  const extraId = randomUUID();
  let pausedId: string | undefined;
  try {
    await pool.query(`INSERT INTO oferta_servico(id,prestador_id,tipo_servico_id,titulo,descricao,tipo_preco,preco_minimo,tipo_prazo,prazo_minimo_dias,ativo)
      SELECT $1,p.id,t.id,'Z API adicional para comparação','Oferta temporária de API para validar substituição de contexto na comparação.','FIXO',2500,'FIXO',15,true
      FROM perfil_prestador p CROSS JOIN tipo_servico t WHERE p.slug='prestador-demo-1' AND t.slug='api'`, [extraId]);
    await page.goto("/buscar");
    for (const name of ["Aurora Web — Demo", "Horizonte Digital — Demo", "Nexo Studio — Demo"]) {
      await page.locator(".provider-result").filter({ has: page.getByRole("heading", { name, exact: true }) }).getByRole("button", { name: "Comparar", exact: true }).click();
      await expect(page.locator(".provider-result").filter({ has: page.getByRole("heading", { name, exact: true }) }).getByRole("button", { name: "Remover da comparação" })).toBeVisible();
    }
    await page.locator(".provider-result").filter({ has: page.getByRole("heading", { name: "Clara Código — Demo", exact: true }) }).getByRole("button", { name: "Comparar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("até três prestadores");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("proposta-comparison-offers") ?? "[]") as string[]);
    expect(stored).toHaveLength(3);
    expect(stored.every((id) => typeof id === "string" && /^[\da-f-]{36}$/i.test(id))).toBe(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "Remover da comparação" })).toHaveCount(3);
    await page.goto("/prestadores/prestador-demo-1");
    await page.locator(".profile-offer").filter({ has: page.getByRole("heading", { name: "Z API adicional para comparação", exact: true }) }).getByRole("button", { name: "Comparar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("substituída");
    await page.getByRole("link", { name: "Ver comparação", exact: true }).click();
    await expect(page.locator(".comparison-table thead th")).toHaveCount(4);
    await expect(page.locator(".comparison-table")).toContainText("Z API adicional para comparação");
    const paused = await pool.query<{ id: string }>("SELECT o.id FROM oferta_servico o JOIN perfil_prestador p ON p.id=o.prestador_id WHERE p.slug='prestador-demo-2' AND o.ativo");
    pausedId = paused.rows[0].id;
    await pool.query("UPDATE oferta_servico SET ativo=false WHERE id=$1", [pausedId]);
    await page.reload();
    await expect(page.getByRole("status")).toContainText("Algumas ofertas foram removidas");
    await expect(page.locator(".comparison-table thead th")).toHaveCount(3);
    await expect(page.locator(".comparison-table")).not.toContainText("Horizonte Digital — Demo");
    await page.goto("/comparar?ofertas=invalido");
    await expect(page.getByRole("heading", { name: "Sua comparação começa na busca" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Algumas ofertas foram removidas");
  } finally {
    if (pausedId) await pool.query("UPDATE oferta_servico SET ativo=true WHERE id=$1", [pausedId]);
    await pool.query("DELETE FROM oferta_servico WHERE id=$1", [extraId]);
    await pool.end();
  }
});

test("usuário cria, edita e exclui avaliação sem publicar e-mail privado", async ({ page }) => {
  const id = randomUUID();
  const privateEmail = `review-private-${id}@example.test`;
  const name = `Autora pública ${id.slice(0, 8)}`;
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(privateEmail);
  await page.getByLabel("Senha", { exact: true }).fill("Proposta-test-password-2026");
  await page.getByRole("radio", { name: /Quero contratar/ }).check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await confirmEmail(page, privateEmail);
  await expect(page).toHaveURL(/\/painel$/);
  await page.goto("/prestadores/prestador-demo-3");
  // Sem Aceite do Prestador, o Cliente não vê o formulário
  await expect(page.getByRole("button", { name: "Publicar avaliação", exact: true })).toHaveCount(0);
  await expect(page.locator(".review-section")).toContainText("Só quem contratou este prestador por uma Proposta aceita pode avaliar");
  const pool = testPool();
  try {
    const author = await pool.query<{ id: string }>('SELECT id FROM "user" WHERE email=$1', [privateEmail]);
    const target = await pool.query<{ id: string }>("SELECT id FROM perfil_prestador WHERE slug='prestador-demo-3'");
    await grantAcceptance(pool, author.rows[0].id, target.rows[0].id);
  } finally { await pool.end(); }
  await page.reload();
  await page.getByLabel("Nota", { exact: true }).selectOption("5");
  await page.getByLabel("Comentário (opcional)").fill("Avaliação inicial do fluxo completo.");
  await page.getByRole("button", { name: "Publicar avaliação", exact: true }).click();
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("Avaliação inicial do fluxo completo.");
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("5/5");
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("Contratado pela Proposta.dev");
  await page.reload();
  await page.getByLabel("Nota", { exact: true }).selectOption("3");
  await page.getByLabel("Comentário (opcional)").fill("Comentário revisado sem dados pessoais.");
  await page.getByRole("button", { name: "Atualizar avaliação", exact: true }).click();
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("Comentário revisado sem dados pessoais.");
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("3/5");
  await expect(page.locator(".review-item").filter({ hasText: name })).toContainText("Editada");
  await expect(page.locator("body")).not.toContainText(privateEmail);
  expect(await page.content()).not.toContain(privateEmail);
  await page.getByText("Excluir minha avaliação", { exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
  await expect(page.locator(".review-item").filter({ hasText: name })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publicar avaliação", exact: true })).toBeVisible();
  const cleanup = testPool();
  try { await cleanup.query('DELETE FROM "user" WHERE email=$1', [privateEmail]); } finally { await cleanup.end(); }
});

test("perfil próprio impede autoavaliação e Prestador não avalia outros", async ({ page }) => {
  await login(page, "prestador1@demo.example");
  await page.goto("/prestadores/prestador-demo-1");
  await expect(page.getByText("Você pode acompanhar as avaliações do seu perfil aqui.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar avaliação", exact: true })).toHaveCount(0);
  await page.goto("/prestadores/prestador-demo-2");
  await expect(page.locator(".review-section")).toContainText("Contas de Prestador não avaliam outros prestadores");
  await expect(page.getByRole("button", { name: "Publicar avaliação", exact: true })).toHaveCount(0);
});

test("mobile abre filtros em modal sem overflow horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/buscar");
  await page.getByRole("button", { name: "Filtros e ordenação", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Filtros e ordenação" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Modelo de preço", { exact: true }).selectOption("SOB_CONSULTA");
  await expect(dialog.getByLabel("Preço mínimo", { exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("foto HTTPS indisponível mantém iniciais no perfil e na busca", async ({ page }) => {
  const pool = testPool();
  const photoUrl = "https://photo-fixture.example.test/unavailable.png";
  const original = await pool.query<{ photoUrl: string | null }>("SELECT foto_url AS \"photoUrl\" FROM perfil_prestador WHERE slug='prestador-demo-3'");
  try {
    await pool.query("UPDATE perfil_prestador SET foto_url=$1 WHERE slug='prestador-demo-3'", [photoUrl]);
    await page.route(photoUrl, (route) => route.abort("failed"));
    await page.goto("/prestadores/prestador-demo-3");
    await expect(page.locator(".profile-hero span.provider-avatar")).toHaveText("NS");
    await expect(page.locator(".profile-hero img.provider-avatar")).toHaveCount(0);
    await page.goto("/buscar?q=nexo");
    const result = page.locator(".provider-result").filter({ has: page.getByRole("heading", { name: "Nexo Studio — Demo", exact: true }) });
    await expect(result.locator("span.provider-avatar")).toHaveText("NS");
    await expect(result.locator("img.provider-avatar")).toHaveCount(0);
  } finally {
    await pool.query("UPDATE perfil_prestador SET foto_url=$1 WHERE slug='prestador-demo-3'", [original.rows[0]?.photoUrl ?? null]);
    await pool.end();
  }
});

test("a Política de Privacidade abre pelo rodapé e explica o login com Google", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Política de Privacidade" }).click();
  await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();
  await expect(page.locator("main")).toContainText("Login com Google");
});
