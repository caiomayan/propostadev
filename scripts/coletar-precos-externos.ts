// Coleta manual de preços externos (mesma coleta do Cron). Uso: pnpm precos:coletar
// Lê FIRECRAWL_API_KEY e DATABASE_URL do ambiente (.env). Nunca imprime a chave.
import { pool } from "../src/lib/db";
import { createFirecrawlClient } from "../src/modules/external-prices/client";
import { collectExternalPrices } from "../src/modules/external-prices/collector";

async function main() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY não definida.");
  const outcomes = await collectExternalPrices(createFirecrawlClient(apiKey));
  for (const o of outcomes) console.info(`${o.status === "OK" ? "OK   " : "FALHA"} ${o.serviceSlug} · ${o.source}${o.error ? ` — ${o.error}` : ""}`);
  console.info(`${outcomes.filter((o) => o.status === "OK").length}/${outcomes.length} fontes coletadas.`);
  await pool.end();
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
