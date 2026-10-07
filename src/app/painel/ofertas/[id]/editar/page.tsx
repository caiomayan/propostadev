import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, offers, providers, serviceTypes } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { OfferForm } from "@/components/forms/offer-form";
export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [row] = await db.select({ offer: offers }).from(offers).innerJoin(providers, eq(providers.id, offers.providerId)).where(and(eq(offers.id, id), eq(providers.userId, session.user.id), isNull(offers.deletedAt))).limit(1);
  if (!row) notFound();
  const catalog = await db.select({ id: serviceTypes.id, name: serviceTypes.name }).from(serviceTypes).innerJoin(categories, eq(categories.id, serviceTypes.categoryId)).where(and(eq(serviceTypes.active, true), eq(categories.active, true))).orderBy(serviceTypes.name);
  return <section className="stack"><h1>Editar oferta</h1><div className="panel"><OfferForm offer={row.offer} catalog={catalog} /></div></section>;
}
