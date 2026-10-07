import { ActionForm } from "@/components/forms/action-form";
import { saveReview, deleteReview } from "@/modules/reviews/actions";
import { SelectField, TextAreaField } from "@/components/forms/field";

export function ReviewForm({ providerId, own }: { providerId: string; own: { id: string; rating: number; comment: string | null } | null }) {
  return <div className="panel review-form"><h3>{own ? "Sua avaliação" : "Avalie este prestador"}</h3><p className="muted">Seu nome será público. A avaliação é declarada por você e não comprova uma contratação.</p><ActionForm action={saveReview} label={own ? "Atualizar avaliação" : "Publicar avaliação"}><input type="hidden" name="providerId" value={providerId}/><SelectField label="Nota" name="rating" defaultValue={own?.rating ?? ""} required><option value="" disabled>Selecione uma nota</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} de 5</option>)}</SelectField><TextAreaField label="Comentário (opcional)" name="comment" maxLength={2000} rows={4} defaultValue={own?.comment ?? ""}/><p className="muted">Até 2.000 caracteres. Evite publicar dados pessoais.</p></ActionForm>{own && <div className="section"><ActionForm action={deleteReview} label="Excluir minha avaliação"><input type="hidden" name="providerId" value={providerId}/></ActionForm></div>}</div>;
}
