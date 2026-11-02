"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="container section"><div className="empty state-screen" role="alert"><h1>Não foi possível carregar esta página</h1><p>Algo falhou do nosso lado. Tente novamente; se continuar, volte ao início.</p><div className="inline state-actions"><button type="button" className="button" onClick={reset}>Tentar novamente</button><Link href="/" className="button secondary">Ir para o início</Link></div></div></section>;
}
