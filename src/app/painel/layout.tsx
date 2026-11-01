import Link from "next/link";
import { requireAccount } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { emailAvailable } from "@/lib/email/mailer";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, accountType } = await requireAccount();
  return <div className="container dashboard-wrapper stack"><nav className="dashboard-nav" aria-label="Painel"><Link href="/painel">{accountType === "PRESTADOR" ? "Visão geral" : "Início"}</Link>{accountType === "PRESTADOR" && <><Link href="/painel/perfil">Perfil</Link><Link href="/painel/ofertas">Ofertas</Link></>}{accountType === "CLIENTE" && <><Link href="/painel/projetos">Projetos</Link><Link href="/triagem">Nova triagem</Link></>}<Link href="/painel/conta">Conta</Link><form action={signOut}><button className="button secondary">Sair</button></form></nav>{!session.user.emailVerified && emailAvailable() && <EmailVerificationNotice />}{children}</div>;
}
