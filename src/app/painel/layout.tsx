import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <div className="container dashboard-wrapper stack"><nav className="dashboard-nav" aria-label="Painel"><Link href="/painel">Visão geral</Link><Link href="/painel/perfil">Meu perfil</Link><Link href="/painel/ofertas">Minhas ofertas</Link><Link href="/painel/conta">Minha conta</Link><form action={signOut}><button className="button secondary">Sair</button></form></nav>{children}</div>;
}
