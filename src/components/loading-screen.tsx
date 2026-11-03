import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto na forma do conteúdo (título, texto e cartões) com anúncio para leitores de tela.
export function LoadingScreen({ label = "Carregando…", cards = 3, contained = true }: { label?: string; cards?: number; contained?: boolean }) {
  const content = <div className="loading-screen stack" aria-busy="true"><p role="status" className="sr-only">{label}</p><div className="ruler-loader" aria-hidden="true"/>
    <div aria-hidden="true" className="stack"><Skeleton className="skeleton-title" /><Skeleton className="skeleton-line" /><div className="skeleton-grid">{Array.from({ length: cards }, (_, index) => <Skeleton key={index} className="skeleton-card" />)}</div></div>
  </div>;
  return contained ? <section className="container section">{content}</section> : content;
}
