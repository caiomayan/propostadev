import { StarRating } from "@/components/star-rating";
import { reputation } from "@/lib/format";

/** Nota do Prestador em estrelas e em texto. Sem avaliações não há estrelas: vazio não é nota zero. */
export function Reputation({ rating, count, verified }: { rating: string | null; count: number; verified?: number }) {
  const value = rating && count > 0 ? Number(rating) : null;
  return <span className="reputation">{value !== null && <StarRating value={value}/>}<span>{reputation(rating, count, verified)}</span></span>;
}
