import { getComparison } from "@/modules/search/queries";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ofertas") ?? "").slice(0, 150).split(",").filter(Boolean);
  const { offers } = await getComparison(ids);
  return Response.json(offers.map(({ id, providerId }) => ({ id, providerId })), { headers: { "Cache-Control": "no-store" } });
}
