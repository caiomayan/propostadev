import Link from "next/link";
export default function NotFound(){return <div className="container section empty"><h1>Página não encontrada</h1><p>Este perfil pode estar desativado ou o endereço não existe.</p><Link href="/buscar" className="button">Buscar desenvolvedores</Link></div>}
