import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { MobileMenu } from "@/components/mobile-menu";
import { getSession } from "@/lib/auth/session";

export const siteLinks = [
  { href: "/triagem", label: "Triagem" },
  { href: "/buscar", label: "Buscar desenvolvedores" },
  { href: "/painel/perfil", label: "Oferecer serviços" },
  { href: "/comparar", label: "Comparar" },
] as const;

export async function SiteHeader() {
  // Sem sessão legível (por exemplo, banco indisponível), o cabeçalho cai para "Entrar" em vez de quebrar a página.
  const session = await getSession().catch(() => null);
  const account = session ? { href: "/painel", label: "Minha conta" } : { href: "/entrar", label: "Entrar" };
  return <header className="site-header"><div className="container header-inner"><Wordmark/>
    <nav className="site-nav" aria-label="Principal">{siteLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    <div className="header-account"><Link href={account.href} className="button">{account.label}</Link></div>
    <MobileMenu links={siteLinks} account={account}/>
  </div></header>;
}
