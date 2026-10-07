import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./buscar/public.css";
import { ComparisonTray } from "@/components/comparison-selection";

export const metadata: Metadata = { title: { default: "Proposta.dev — encontre desenvolvedores", template: "%s | Proposta.dev" }, description: "Descubra prestadores de desenvolvimento, compare serviços e converse diretamente." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a>{process.env.DEMO_MODE === "true" && <div className="demo-banner">Ambiente de demonstração · perfis e ofertas fictícios</div>}<header className="site-header"><div className="container header-inner"><Link href="/" className="wordmark" aria-label="Proposta.dev início">Proposta<span>.dev</span></Link><nav className="site-nav" aria-label="Principal"><Link href="/buscar">Buscar desenvolvedores</Link><Link href="/painel/perfil">Oferecer serviços</Link><Link href="/comparar">Comparar</Link></nav><div className="header-account"><Link href="/painel" className="button secondary">Minha conta</Link></div></div></header><main id="conteudo">{children}</main><ComparisonTray/><footer className="site-footer"><div className="container footer-inner"><span className="wordmark">Proposta<span>.dev</span></span><p>Descubra, compare, converse. A negociação acontece diretamente com o prestador.</p></div></footer></body></html>;
}
