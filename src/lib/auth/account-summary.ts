import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { panelLinks, type PanelLink } from "@/lib/account-nav";
import { needsEmailConfirmation } from "./email-gate";
import type { AccountType } from "./user-fields";

export type AccountSummary = { name: string; email: string; role: string | null; photoUrl: string | null; links: PanelLink[] };
type SessionUser = { id: string; name: string; email: string; image?: string | null; emailVerified?: boolean | null; accountType?: string | null };

// Cabeçalho e painel pedem o mesmo dado na mesma requisição.
const providerIdentity = cache(async (userId: string) => {
  const [row] = await db.select({ photoUrl: providers.photoUrl, slug: providers.slug, active: providers.active }).from(providers).where(eq(providers.userId, userId)).limit(1);
  return row ?? null;
});

/** Quem está logado e para onde pode ir. Prestador usa a foto do Perfil; os demais, a foto da conta (Google). */
export async function accountSummary(user: SessionUser): Promise<AccountSummary> {
  const type = user.accountType === "CLIENTE" || user.accountType === "PRESTADOR" ? user.accountType as AccountType : null;
  const provider = type === "PRESTADOR" ? await providerIdentity(user.id).catch(() => null) : null;
  const pending = needsEmailConfirmation(user);
  const links: PanelLink[] = pending ? [{ href: "/confirmar-email", label: "Confirmar e-mail", icon: "mail" }]
    : !type ? [{ href: "/boas-vindas", label: "Escolher tipo de conta", icon: "account" }]
    : [...panelLinks(type), ...(provider?.active ? [{ href: `/prestadores/${provider.slug}`, label: "Ver meu perfil público", icon: "public" } as PanelLink] : [])];
  return { name: user.name, email: user.email, role: type && (type === "PRESTADOR" ? "Prestador" : "Cliente"), photoUrl: provider?.photoUrl ?? user.image ?? null, links };
}
