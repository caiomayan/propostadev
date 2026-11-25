import { timingSafeEqual } from "node:crypto";
import { createFirecrawlClient } from "@/modules/external-prices/client";
import { collectExternalPrices } from "@/modules/external-prices/collector";

export const dynamic = "force-dynamic";
// Plano Hobby da Vercel: até 300 s por função (docs de duração, 24/11/2026). Cada scrape tem 90 s de timeout e as fontes rodam em paralelo.
export const maxDuration = 300;

const authorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`), given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
};

/** Cron semanal da Vercel (vercel.json). A Vercel envia `Authorization: Bearer ${CRON_SECRET}`; sem o segredo a coleta não roda. */
export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return Response.json({ error: "FIRECRAWL_API_KEY não configurada" }, { status: 503 });
  const outcomes = await collectExternalPrices(createFirecrawlClient(apiKey));
  return Response.json({ coletadas: outcomes.filter((o) => o.status === "OK").length, falhas: outcomes.filter((o) => o.status === "FALHA").length, fontes: outcomes });
}
