import { eq } from "drizzle-orm";
import { requireAccount } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PanelLinks, type PanelLink } from "@/components/panel-nav";
import { ProviderAvatar } from "@/components/provider-avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, accountType } = await requireAccount();
  const provider = accountType === "PRESTADOR";
  // Prestador usa a foto do Perfil; Cliente que entrou com o Google usa a foto da conta.
  const [profile] = provider ? await db.select({ photoUrl: providers.photoUrl }).from(providers).where(eq(providers.userId, session.user.id)).limit(1) : [];
  const photoUrl = profile?.photoUrl ?? session.user.image;
  const links: PanelLink[] = [
    { href: "/painel", label: provider ? "Visão geral" : "Início", icon: "home" },
    ...(provider
      ? [{ href: "/painel/perfil", label: "Perfil", icon: "profile" }, { href: "/painel/ofertas", label: "Ofertas", icon: "offers" }, { href: "/painel/oportunidades", label: "Oportunidades", icon: "opportunities" }, { href: "/painel/propostas", label: "Propostas", icon: "proposals" }] as PanelLink[]
      : [{ href: "/painel/projetos", label: "Projetos", icon: "projects" }, { href: "/triagem", label: "Nova triagem", icon: "triage" }] as PanelLink[]),
    { href: "/painel/conta", label: "Conta", icon: "account" },
  ];
  return <div className="container dashboard-wrapper">
    <aside className="dashboard-side">
      <div className="dashboard-who"><ProviderAvatar name={session.user.name} photoUrl={photoUrl}/><div><strong>{session.user.name}</strong><small>{provider ? "Prestador" : "Cliente"}</small></div></div>
      <nav className="dashboard-nav" aria-label="Painel"><PanelLinks links={links}/><SignOutButton icon/></nav>
    </aside>
    <div className="dashboard-main">{children}</div>
  </div>;
}
