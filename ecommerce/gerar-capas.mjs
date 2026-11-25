// Capas dos produtos da loja: uma por Tipo de serviço, na identidade do Proposta.dev. Rodar: node ecommerce/gerar-capas.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("@playwright/test");

const catalog = JSON.parse(readFileSync(new URL("./seed/catalogo.json", import.meta.url)));
const types = new Map(catalog.ofertas.map((o) => [o.tipo_slug, { tipo: o.tipo, categoria: o.categoria, categoria_slug: o.categoria_slug }]));
const themes = { web: ["#0f3d2e", "#f1f3ec", "#d4f25a"], "backend-e-apis": ["#10231a", "#f1f3ec", "#d4f25a"], default: ["#e4e8dc", "#10231a", "#0f3d2e"] };
const font = `<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=block" rel="stylesheet">`;
const browser = await chromium.launch();
for (const [slug, t] of types) {
  const [bg, ink, accent] = themes[t.categoria_slug] ?? themes.default;
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  await page.setContent(`<html><head>${font}</head><body style="margin:0;width:800px;height:800px;background:${bg};color:${ink};font-family:'Bricolage Grotesque';display:flex;flex-direction:column;justify-content:space-between;padding:72px;box-sizing:border-box">
  <svg width="84" height="84" viewBox="0 0 28 28"><rect fill="${ink}" x="0" y="4" width="28" height="20" rx="6"/><rect fill="${accent === ink ? bg : accent}" x="8" y="9" width="12" height="10" rx="3"/></svg>
  <div><div style="font-weight:600;font-size:34px;opacity:.72;letter-spacing:-.01em">${t.categoria}</div>
  <div style="font-weight:800;font-size:${t.tipo.length > 16 ? 86 : 104}px;line-height:.98;letter-spacing:-.045em;margin-top:14px">${t.tipo}</div>
  <div style="margin-top:40px;height:12px;width:180px;border-radius:6px;background:${accent}"></div></div></body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(`./seed/capas/${slug}.png`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
console.log(`Capas geradas: ${types.size}.`);
