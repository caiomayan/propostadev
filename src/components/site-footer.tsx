import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-inner">
    <div className="footer-brand"><Wordmark href={null}/><p>Diga o que você precisa, veja quanto costuma custar e encontre quem desenvolve. A negociação acontece direto com o prestador.</p></div>
    <nav className="footer-col" aria-label="Para clientes"><h2>Para clientes</h2><ul><li><Link href="/buscar">Buscar desenvolvedores</Link></li><li><Link href="/comparar">Comparar prestadores</Link></li></ul></nav>
    <nav className="footer-col" aria-label="Para prestadores"><h2>Para prestadores</h2><ul><li><Link href="/painel/perfil">Criar meu perfil</Link></li><li><Link href="/entrar">Entrar</Link></li></ul></nav>
    <p className="footer-legal">Proposta.dev é um diretório. Preços e prazos são anunciados pelos prestadores e confirmados no contato.</p>
  </div></footer>;
}
