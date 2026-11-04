import { test, expect, type Page } from "@playwright/test";

const demoPassword = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";
async function login(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
const prices = async (page: Page) => (await page.locator(".provider-actions strong").allInnerTexts()).filter((text) => !text.includes("/hora") && /\d/.test(text)).map((text) => Number(text.match(/[\d.]+,\d{2}/)![0].replace(/\./g, "").replace(",", ".")));

test("busca ordena em um clique, sem exigir modelo de preço, e mantém os filtros", async ({ page }) => {
  await page.goto("/buscar?q=site");
  const sort = page.getByRole("navigation", { name: "Ordenar prestadores" });
  await expect(sort.getByRole("link", { name: "Nome" })).toHaveAttribute("aria-current", "true");
  await sort.getByRole("link", { name: "Menor preço" }).click();
  await expect(page).toHaveURL(/q=site.*ordenar=preco/);
  await expect(page.locator(".filter-error")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Ordenar prestadores" }).getByRole("link", { name: "Menor preço" })).toHaveAttribute("aria-current", "true");
  const seen = await prices(page);
  expect(seen.length).toBeGreaterThan(1);
  expect(seen).toEqual([...seen].sort((a, b) => a - b));
  await page.getByRole("button", { name: "Buscar serviços" }).click();
  await expect(page).toHaveURL(/ordenar=preco/);
});

test("ordem por preço não mistura R$/hora com R$/projeto", async ({ page }) => {
  await page.goto("/buscar?ordenar=preco");
  await expect(page.locator(".filter-error")).toHaveCount(0);
  const texts = await page.locator(".provider-actions strong").allInnerTexts();
  expect(texts.some((text) => text.includes("/hora"))).toBe(false);
});

test("o foco volta à opção escolhida depois de ordenar pelo teclado", async ({ page }) => {
  await page.goto("/buscar");
  const link = page.getByRole("navigation", { name: "Ordenar prestadores" }).getByRole("link", { name: "Maior experiência" });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/ordenar=experiencia/);
  await expect(page.getByRole("navigation", { name: "Ordenar prestadores" }).getByRole("link", { name: "Maior experiência" })).toBeFocused();
});

test("avaliações do perfil ordenam por nota", async ({ page }) => {
  await page.goto("/buscar?q=sistema%20agil");
  await page.locator(".provider-result h2 a").first().click();
  await expect(page).toHaveURL(/\/prestadores\//);
  const sort = page.getByRole("navigation", { name: "Ordenar avaliações" });
  await sort.getByRole("link", { name: "Pior nota" }).click();
  await expect(page).toHaveURL(/avaliacoes=piores#avaliacoes$/);
  const ratings = await page.locator(".review-item [role=img]").evaluateAll((items) => items.map((item) => Number(item.getAttribute("aria-label")?.match(/\d/)?.[0])));
  expect(ratings).toEqual([...ratings].sort((a, b) => a - b));
});

test("Cliente ordena projetos; Prestador ordena ofertas, oportunidades e propostas", async ({ page }) => {
  await login(page, "cliente1@demo.example");
  await page.goto("/painel/projetos");
  await page.getByRole("navigation", { name: "Ordenar projetos" }).getByRole("link", { name: "Mais propostas" }).click();
  await expect(page).toHaveURL(/\/painel\/projetos\?ordem=propostas$/);
  await expect(page.locator(".project-row").first()).toBeVisible();
  await page.context().clearCookies();
  await login(page, "prestador1@demo.example");
  for (const [path, name, option] of [["ofertas", "ofertas", "Ativas primeiro"], ["propostas", "propostas", "Maior valor"]] as const) {
    await page.goto(`/painel/${path}`);
    const nav = page.getByRole("navigation", { name: `Ordenar ${name}` });
    if (await nav.count()) {
      await nav.getByRole("link", { name: option }).click();
      await expect(page).toHaveURL(/\?ordem=/);
    }
  }
});

test("Triagem ordena os compatíveis e mantém o rascunho", async ({ page }) => {
  const draft = "/triagem?tipo=landing-page&titulo=Meu+projeto+de+teste&descricao=Descri%C3%A7%C3%A3o+longa+o+bastante+para+passar+na+valida%C3%A7%C3%A3o+do+servidor.&orcamento=ATE&max=3000&prazo=30";
  await page.goto(draft);
  await page.getByRole("navigation", { name: "Ordenar prestadores compatíveis" }).getByRole("link", { name: "Menor preço" }).click();
  await expect(page).toHaveURL(/titulo=Meu.*ordem=preco.*#compativeis$/);
  await expect(page.getByRole("heading", { name: "Meu projeto de teste" })).toBeVisible();
});
