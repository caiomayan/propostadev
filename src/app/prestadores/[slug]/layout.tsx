import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";

export default async function PublicProviderLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [provider] = await db.select({ id: providers.id }).from(providers).where(and(eq(providers.slug, slug), eq(providers.active, true))).limit(1);
  if (!provider) notFound();
  return children;
}
