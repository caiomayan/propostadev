import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteHeader() {
  return <header className="site-header"><div className="container header-inner"><Wordmark/><nav className="site-nav" aria-label="Principal"><Link href="/buscar">Buscar desenvolvedores</Link><Link href="/painel/perfil">Oferecer serviços</Link><Link href="/comparar">Comparar</Link></nav><div className="header-account"><Link href="/painel" className="button">Minha conta</Link></div></div></header>;
}
