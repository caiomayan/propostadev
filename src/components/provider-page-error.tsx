"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicPageError({ reset }: { reset: () => void }) {
  return <section className="container section"><div className="empty state-screen" role="alert"><h1>Não foi possível carregar esta página</h1><p>Tente novamente em instantes para acessar os serviços e prestadores.</p><div className="inline state-actions"><Button className="button" onClick={reset}>Tentar novamente</Button><Button asChild variant="outline" className="button secondary"><Link href="/buscar">Voltar à busca</Link></Button></div></div></section>;
}
