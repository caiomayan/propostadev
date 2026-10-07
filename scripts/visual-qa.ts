import { chromium, type Page } from "@playwright/test";
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://localhost:3100";
const outputDir = path.resolve("artifacts/visual-qa");
const widths = [375, 768, 1440];
const password = process.env.DEMO_PASSWORD ?? "Demo-local-2026!";

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report: { width: number; page: string; screenshot: string; overflow: boolean; status: number | null }[] = [];
  async function capture(page: Page, name: string, url: string, width: number) {
    const response = await page.goto(url);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    const filename = `${name}-${width}.png`;
    await page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
    report.push({ width, page: url, screenshot: filename, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), status: response?.status() ?? null });
  }
  try {
    for (const width of widths) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 960 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      for (const [name, url] of [["home", "/"], ["search", "/buscar"], ["search-filtered", "/buscar?tipo=landing-page&modelo_preco=FIXO"], ["profile", "/prestadores/prestador-demo-1"], ["profile-consultation", "/prestadores/prestador-demo-7"], ["login", "/entrar"], ["registration", "/cadastro"]]) await capture(page, name, url, width);
      await page.goto("/buscar");
      for (const name of ["Aurora Web — Demo", "Horizonte Digital — Demo", "Clara Código — Demo"]) {
        await page.locator(".provider-result").filter({ has: page.getByRole("heading", { name, exact: true }) }).getByRole("button", { name: "Comparar", exact: true }).click();
        await page.locator(".provider-result").filter({ has: page.getByRole("heading", { name, exact: true }) }).getByRole("button", { name: "Remover da comparação" }).waitFor();
      }
      const ids = await page.evaluate(() => JSON.parse(localStorage.getItem("proposta-comparison-offers") ?? "[]") as string[]);
      await capture(page, "comparison", `/comparar?ofertas=${ids.join(",")}`, width);
      if (width === 375) {
        await page.goto("/buscar");
        await page.getByRole("button", { name: "Filtros e ordenação", exact: true }).click();
        await page.getByRole("dialog", { name: "Filtros e ordenação" }).waitFor();
        await page.screenshot({ path: path.join(outputDir, "search-filter-sheet-375.png"), fullPage: true });
      }
      await page.goto("/entrar");
      await page.getByLabel("E-mail", { exact: true }).fill("prestador1@demo.example");
      await page.getByLabel("Senha", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL("**/painel");
      for (const [name, url] of [["dashboard", "/painel"], ["profile-editor", "/painel/perfil"], ["offers", "/painel/ofertas"], ["new-offer", "/painel/ofertas/nova"], ["account", "/painel/conta"]]) await capture(page, name, url, width);
      await context.close();
    }
    await writeFile(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
    const failures = report.filter((item) => item.overflow || (item.status ?? 500) >= 400);
    console.info(`Capturadas ${report.length + 1} telas em ${outputDir}. Problemas automáticos: ${failures.length}.`);
    if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
  } finally { await browser.close(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha na revisão visual."); process.exitCode = 1; });
