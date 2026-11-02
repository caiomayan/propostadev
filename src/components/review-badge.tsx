import { Check } from "lucide-react";
import { PREVIOUS_REVIEW_NOTE, VERIFIED_SEAL } from "@/modules/reviews/rules";

/** Selo da Avaliação verificada; as anteriores recebem só uma nota discreta. Nunca mostra as duas. */
export function ReviewBadge({ verified }: { verified: boolean }) {
  return verified
    ? <span className="verified-seal"><Check size={14} aria-hidden="true"/>{VERIFIED_SEAL}</span>
    : <span className="previous-note">{PREVIOUS_REVIEW_NOTE}</span>;
}
