import { PriceRuler } from "@/components/price-ruler";

/** Autenticação em duas metades: o pôster da marca e o formulário. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell"><aside className="auth-poster on-forest"><p>Preço na mesa antes da conversa.</p><PriceRuler/></aside>{children}</div>;
}
