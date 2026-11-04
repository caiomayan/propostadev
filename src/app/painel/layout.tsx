import { requireAccount } from "@/lib/auth/session";
import { accountSummary } from "@/lib/auth/account-summary";
import { panelLinks } from "@/lib/account-nav";
import { PanelLinks } from "@/components/panel-nav";
import { ProviderAvatar } from "@/components/provider-avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, accountType } = await requireAccount();
  const account = await accountSummary(session.user);
  return <div className="container dashboard-wrapper">
    <aside className="dashboard-side">
      <div className="dashboard-who"><ProviderAvatar name={account.name} photoUrl={account.photoUrl}/><div><strong>{account.name}</strong><small>{account.role}</small></div></div>
      <nav className="dashboard-nav" aria-label="Painel"><PanelLinks links={panelLinks(accountType)}/><SignOutButton icon/></nav>
    </aside>
    <div className="dashboard-main">{children}</div>
  </div>;
}
