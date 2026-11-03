import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-inner">
    <div className="footer-brand"><Wordmark href={null}/><p>Diga o que você precisa, veja quanto costuma custar e receba propostas de quem desenvolve.</p></div>
    <nav className="footer-col" aria-label="Para clientes"><h2>Para clientes</h2><ul><li><Link href="/triagem">Começar a Triagem</Link></li><li><Link href="/buscar">Buscar desenvolvedores</Link></li><li><Link href="/comparar">Comparar prestadores</Link></li></ul></nav>
    <nav className="footer-col" aria-label="Para prestadores"><h2>Para prestadores</h2><ul><li><Link href="/painel/perfil">Criar meu perfil</Link></li><li><Link href="/entrar">Entrar</Link></li></ul></nav>
    <p className="footer-legal">Preços e prazos são anunciados pelos prestadores. Pagamento e contrato são combinados diretamente entre Cliente e Prestador. <Link href="/privacidade">Política de Privacidade</Link></p>
  </div><p className="footer-giant" aria-hidden="true">Proposta.dev</p></footer>;
}
