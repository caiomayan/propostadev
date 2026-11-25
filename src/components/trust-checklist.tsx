import { Check, Minus } from "lucide-react";
import { TRUST_CRITERIA, TRUST_SEAL } from "@/modules/reviews/rules";
import type { TrustCriteria } from "@/modules/reviews/queries";

/** Checklist dos três critérios do Selo de confiança, no painel do Prestador. */
export function TrustChecklist({ criteria }: { criteria: TrustCriteria }) {
  const average = criteria.verifiedAverage?.replace(".", ",") ?? null;
  const items = [
    { done: criteria.emailVerified, text: TRUST_CRITERIA[0], note: criteria.emailVerified ? "Confirmado." : "Confirme o e-mail da sua conta para cumprir este critério." },
    { done: criteria.verifiedCount >= 1, text: TRUST_CRITERIA[1], note: criteria.verifiedCount >= 1 ? `Você tem ${criteria.verifiedCount} ${criteria.verifiedCount === 1 ? "Avaliação verificada" : "Avaliações verificadas"}.` : "Ainda não há. Avaliações anteriores, sem contratação verificada, não contam." },
    { done: criteria.verifiedAverage !== null && Number(criteria.verifiedAverage) >= 4, text: TRUST_CRITERIA[2], note: average ? `Sua média nas verificadas é ${average}.` : "Sem Avaliações verificadas ainda, não há média." },
  ];
  return <div className="panel stack"><h2>{TRUST_SEAL}</h2>
    <p>{criteria.trusted ? "Você tem o selo: ele aparece no seu perfil, na busca e nos prestadores compatíveis." : "O selo é automático: aparece quando você cumprir os três critérios."} Ele sai sozinho se você deixar de cumprir algum.</p>
    <ul className="trust-checklist" aria-label="Critérios do selo">{items.map((item) => <li key={item.text} className={item.done ? "done" : ""}><span className="mark" aria-hidden="true">{item.done ? <Check size={14}/> : <Minus size={14}/>}</span><div><strong>{item.text}</strong><small><span className="sr-only">{item.done ? "Cumprido. " : "Pendente. "}</span>{item.note}</small></div></li>)}</ul>
  </div>;
}
