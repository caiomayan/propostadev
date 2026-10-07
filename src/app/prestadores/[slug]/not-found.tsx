import Link from "next/link";
export default function NotFound() {
  return <section className="container section empty"><h1>Prestador indisponível</h1><p className="muted">Este perfil não está disponível para consulta pública.</p><Link className="button" href="/buscar">Buscar outros prestadores</Link></section>;
}
