import { ShieldCheck } from "lucide-react";
import { TRUST_CRITERIA, TRUST_SEAL } from "@/modules/reviews/rules";

/**
 * Selo de confiança com o "por quê". Usa <details>: abre por teclado (Enter/Espaço) e é lido como controle expansível.
 * Só renderize quando o selo vale (`trusted`): o componente não decide nada.
 */
export function TrustSeal() {
  return <details className="trust-seal">
    <summary><ShieldCheck size={15} aria-hidden="true"/>{TRUST_SEAL}<span className="sr-only">: ver por que este prestador tem o selo</span></summary>
    <div className="trust-why">
      <p>Este prestador cumpre os três critérios, calculados automaticamente (o selo não é vendido nem concedido à mão):</p>
      <ul>{TRUST_CRITERIA.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
    </div>
  </details>;
}
