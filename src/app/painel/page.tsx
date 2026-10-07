import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
export default async function DashboardPage() {
  const session = await requireSession();
  const [provider] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  return <section className="stack"><p className="eyebrow">SEU ESPAÇO</p><h1>Olá, {session.user.name}.</h1><div className="panel stack"><h2>{provider ? "Continue construindo sua presença." : "Apresente o que você faz."}</h2><p>{provider ? "Atualize seu perfil e gerencie suas ofertas de serviço." : "Crie seu perfil de prestador para publicar suas primeiras ofertas. Você também pode buscar e avaliar profissionais."}</p><Link className="button" href="/painel/perfil">{provider ? "Editar meu perfil" : "Criar meu perfil"}</Link>{provider && <><p>Perfil {provider.active ? "ativo" : "desativado"}.</p><Link href="/painel/ofertas">Gerenciar ofertas →</Link>{provider.active && <Link href={`/prestadores/${provider.slug}`}>Ver meu perfil público →</Link>}</>}<Link href="/buscar">Explorar prestadores →</Link></div></section>;
}
