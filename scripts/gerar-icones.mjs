// Gera favicon.ico, apple-icon.png e opengraph-image.png a partir da marca (régua com a faixa de preço; src/components/wordmark.tsx).
// Rodar: node scripts/gerar-icones.mjs  (usa o Chromium do Playwright já instalado; precisa de internet para a fonte).
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");

const forest = "#0f3d2e", lime = "#d4f25a", cream = "#f1f3ec", muted = "#bccabf";
const mark = (bar, range) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect fill="${bar}" x="0" y="4" width="28" height="20" rx="6"/><rect fill="${range}" x="8" y="9" width="12" height="10" rx="3"/></svg>`;

const browser = await chromium.launch();
const shot = async (html, width, height, path, omitBackground = false) => { const page = await browser.newPage({ viewport: { width, height } }); await page.setContent(html, { waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready); const buf = await page.screenshot({ path, type: "png", omitBackground }); await page.close(); return buf; };

// favicon.ico com PNGs de 16, 32 e 48 px embutidos (formato ICO aceita PNG desde o Windows Vista).
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) pngs.push(await shot(`<body style="margin:0;background:transparent">${mark(forest, lime).replace("<svg ", `<svg width="${s}" height="${s}" style="display:block" `)}</body>`, s, s, undefined, true));
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = pngs.map((png, i) => { const e = Buffer.alloc(16); e.writeUInt8(sizes[i] % 256, 0); e.writeUInt8(sizes[i] % 256, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12); offset += png.length; return e; });
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));

const font = `<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@500&display=block" rel="stylesheet">`;

// Ícone do iOS: fundo creme, marca no centro (o sistema arredonda os cantos).
await shot(`<body style="margin:0;background:${cream};display:grid;place-items:center;height:180px">${mark(forest, lime).replace("<svg ", '<svg width="120" height="120" ')}</body>`, 180, 180, "src/app/apple-icon.png");

// Prévia de link (WhatsApp, Teams, redes): verde-floresta, marca, nome e a promessa da home.
await shot(`<html><head>${font}</head><body style="margin:0;width:1200px;height:630px;background:${forest};color:${cream};font-family:'Figtree',sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box">
<div style="display:flex;align-items:center;gap:28px">${mark(cream, lime).replace("<svg ", '<svg width="104" height="104" ')}<span style="font-family:'Bricolage Grotesque';font-weight:800;font-size:96px;letter-spacing:-.045em">Proposta<span style="color:${muted};font-weight:600">.dev</span></span></div>
<p style="font-family:'Bricolage Grotesque';font-weight:600;font-size:52px;line-height:1.12;letter-spacing:-.03em;margin:56px 0 0;max-width:960px">Descreva o que você precisa, veja quanto costuma custar e encontre desenvolvedores.</p>
<div style="margin-top:44px;height:10px;width:220px;border-radius:5px;background:${lime}"></div></body></html>`, 1200, 630, "src/app/opengraph-image.png");
await browser.close();
console.log("Ícones gerados em src/app/.");
