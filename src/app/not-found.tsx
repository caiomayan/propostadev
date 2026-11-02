import Link from "next/link";
import { PriceRuler } from "@/components/price-ruler";
export default function NotFound() {
  return <section className="container section"><div className="empty state-screen"><PriceRuler/><h1>Página não encontrada</h1><p>O endereço não existe, mudou de lugar ou o perfil foi desativado.</p><div className="inline state-actions"><Link href="/buscar" className="button">Buscar desenvolvedores</Link><Link href="/" className="button secondary">Ir para o início</Link></div></div></section>;
}
