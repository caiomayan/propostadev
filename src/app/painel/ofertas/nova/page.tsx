import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { categories, providers, serviceTypes } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { OfferForm } from "@/components/forms/offer-form";
export default async function NewOfferPage() {
  const session = await requireSession();
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  if (!provider) redirect("/painel/perfil");
  const catalog = await db.select({ id: serviceTypes.id, name: serviceTypes.name }).from(serviceTypes).innerJoin(categories, eq(categories.id, serviceTypes.categoryId)).where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(serviceTypes.name);
  return <section className="stack"><h1>Nova oferta</h1><p>Uma oferta ativa por tipo de serviço. Você pode manter outras ofertas pausadas.</p><div className="panel"><OfferForm catalog={catalog} /></div></section>;
}
