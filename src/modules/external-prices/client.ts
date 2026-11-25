import "server-only";

/** Resposta bruta do Firecrawl no formato JSON pedido pelo prompt. Tudo é `unknown` até passar pela validação do coletor. */
export type ExtractedPrice = { encontrado?: unknown; valor_min?: unknown; valor_max?: unknown; trecho?: unknown };
export type PriceExtractionRequest = { url: string; serviceDescription: string };
/** Interface pequena do cliente: os testes usam um cliente falso; só `createFirecrawlClient` chama a rede. */
export interface PriceExtractor { extract(request: PriceExtractionRequest): Promise<ExtractedPrice> }

const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const SCRAPE_TIMEOUT_MS = 90_000;

const schema = {
  type: "object",
  properties: {
    encontrado: { type: "boolean" },
    valor_min: { type: ["number", "null"] },
    valor_max: { type: ["number", "null"] },
    trecho: { type: ["string", "null"], description: "frase exata da página com os valores" },
  },
  required: ["encontrado", "valor_min", "valor_max", "trecho"],
};

const prompt = (serviceDescription: string) => `Extraia a faixa de preço em reais (BRL) que a página informa especificamente para o serviço: ${serviceDescription}. Use só números escritos na página para esse serviço. Se a página só traz preço de outro serviço ou de outro tipo de site, ou não traz preço, devolva encontrado=false. Os valores estão no formato brasileiro, em que o ponto separa milhares e a vírgula separa centavos: "R$ 1.000" é mil reais (1000), "R$ 2.500,00" é 2500 e "R$ 10 mil" é 10000. Devolva valor_min e valor_max como números em reais, sem separador de milhar. Em trecho, copie a frase da página que contém os dois valores.`;

/** Cliente real da API HTTP v2 do Firecrawl (scrape com formato JSON, 5 créditos por página). A chave nunca é impressa nem entra em mensagens de erro. */
export function createFirecrawlClient(apiKey: string): PriceExtractor {
  return {
    async extract({ url, serviceDescription }) {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url, onlyMainContent: true, timeout: SCRAPE_TIMEOUT_MS, location: { country: "BR", languages: ["pt-BR"] },
          formats: [{ type: "json", prompt: prompt(serviceDescription), schema }],
        }),
        signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS + 15_000),
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as { success?: boolean; error?: unknown; data?: { json?: ExtractedPrice } } | null;
      if (!response.ok || !body?.success) throw new Error(`Firecrawl respondeu ${response.status}${typeof body?.error === "string" ? `: ${body.error.slice(0, 200)}` : ""}`);
      if (!body.data?.json || typeof body.data.json !== "object") throw new Error("Firecrawl não devolveu JSON");
      return body.data.json;
    },
  };
}
