import Link from "next/link";
export default function NotFound() {
  return <section className="container section"><div className="empty state-screen"><h1>Prestador indisponível</h1><p>Este perfil não está disponível para consulta pública. Ele pode ter sido desativado.</p><Link className="button" href="/buscar">Buscar outros prestadores</Link></div></section>;
}
