// Capas dos produtos da loja: uma por Oferta, com o avatar do Prestador e o Tipo de serviço, na identidade do Proposta.dev.
// Também gera uma capa por Tipo de serviço (usada nas categorias). Rodar: node ecommerce/gerar-capas.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("@playwright/test");

const root = new URL("../", import.meta.url).pathname;
const out = new URL("./seed/capas/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const catalog = JSON.parse(readFileSync(new URL("./seed/catalogo.json", import.meta.url)));
// Fundo, tinta, destaque e fundo do avatar por Categoria (tokens do site: forest, foreground, muted, lime, cream).
const themes = {
  web: { bg: "#0f3d2e", ink: "#f1f3ec", soft: "#bccabf", accent: "#d4f25a", disc: "#f1f3ec" },
  "backend-e-apis": { bg: "#10231a", ink: "#f1f3ec", soft: "#bccabf", accent: "#d4f25a", disc: "#d4f25a" },
  default: { bg: "#e4e8dc", ink: "#10231a", soft: "#46574d", accent: "#0f3d2e", disc: "#fafbf6" },
};
const font = `<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=block" rel="stylesheet">`;
const avatar = (url) => {
  const file = url && url.match(/\/demo\/avatars\/([\w-]+\.svg)$/)?.[1];
  return file ? readFileSync(`${root}public/demo/avatars/${file}`, "utf8").replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') : "";
};
const art = (t, tipo, categoria, avatarSvg) => `<html><head>${font}</head><body style="margin:0;width:800px;height:800px;background:${t.bg};color:${t.ink};font-family:'Bricolage Grotesque';position:relative;overflow:hidden">
  ${avatarSvg ? `<div style="position:absolute;right:-40px;top:-40px;width:520px;height:520px;border-radius:50%;background:${t.disc};overflow:hidden"><div style="position:absolute;left:0;top:0;width:520px;height:520px">${avatarSvg}</div></div>` : `<svg style="position:absolute;left:72px;top:72px" width="84" height="84" viewBox="0 0 28 28"><rect fill="${t.ink}" x="0" y="4" width="28" height="20" rx="6"/><rect fill="${t.accent === t.ink ? t.bg : t.accent}" x="8" y="9" width="12" height="10" rx="3"/></svg>`}
  <div style="position:absolute;left:72px;right:72px;bottom:72px">
    <div style="font-weight:600;font-size:32px;color:${t.soft};letter-spacing:-.01em">${categoria}</div>
    <div style="font-weight:800;font-size:${tipo.length > 16 ? 88 : 108}px;line-height:.96;letter-spacing:-.045em;margin-top:12px">${tipo}</div>
    <div style="margin-top:36px;height:12px;width:180px;border-radius:6px;background:${t.accent}"></div>
  </div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
const render = async (html, file) => { await page.setContent(html, { waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: out + file }); };
const types = new Map();
for (const o of catalog.ofertas) {
  const t = themes[o.categoria_slug] ?? themes.default;
  await render(art(t, o.tipo, o.categoria, avatar(o.foto_url)), `oferta-${o.id}.png`);
  types.set(o.tipo_slug, o);
}
for (const [slug, o] of types) await render(art(themes[o.categoria_slug] ?? themes.default, o.tipo, o.categoria, ""), `${slug}.png`);
await browser.close();
console.log(`Capas geradas: ${catalog.ofertas.length} Ofertas e ${types.size} Tipos de serviço.`);
