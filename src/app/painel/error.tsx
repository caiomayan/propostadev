"use client";
import Link from "next/link";
export default function PanelError({ reset }: { reset: () => void }) {
  return <div className="empty state-screen" role="alert"><h2>Não foi possível carregar esta área</h2><p>Suas informações não foram alteradas. Tente novamente em alguns instantes.</p><div className="inline state-actions"><button type="button" className="button" onClick={reset}>Tentar novamente</button><Link href="/painel" className="button secondary">Voltar ao painel</Link></div></div>;
}
