import { LogOut } from "lucide-react";
import { requireAccount } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { emailAvailable } from "@/lib/email/mailer";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { PanelLinks, type PanelLink } from "@/components/panel-nav";
import { ProviderAvatar } from "@/components/provider-avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, accountType } = await requireAccount();
  const provider = accountType === "PRESTADOR";
  const links: PanelLink[] = [
    { href: "/painel", label: provider ? "Visão geral" : "Início", icon: "home" },
    ...(provider
      ? [{ href: "/painel/perfil", label: "Perfil", icon: "profile" }, { href: "/painel/ofertas", label: "Ofertas", icon: "offers" }, { href: "/painel/oportunidades", label: "Oportunidades", icon: "opportunities" }, { href: "/painel/propostas", label: "Propostas", icon: "proposals" }] as PanelLink[]
      : [{ href: "/painel/projetos", label: "Projetos", icon: "projects" }, { href: "/triagem", label: "Nova triagem", icon: "triage" }] as PanelLink[]),
    { href: "/painel/conta", label: "Conta", icon: "account" },
  ];
  return <div className="container dashboard-wrapper">
    <aside className="dashboard-side">
      <div className="dashboard-who"><ProviderAvatar name={session.user.name}/><div><strong>{session.user.name}</strong><small>{provider ? "Prestador" : "Cliente"}</small></div></div>
      <nav className="dashboard-nav" aria-label="Painel"><PanelLinks links={links}/><form action={signOut}><button className="sign-out"><LogOut aria-hidden="true"/><span>Sair</span></button></form></nav>
    </aside>
    <div className="dashboard-main">{!session.user.emailVerified && emailAvailable() && <EmailVerificationNotice />}{children}</div>
  </div>;
}
