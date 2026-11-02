import { ActionForm } from "@/components/forms/action-form";
import { saveReview, deleteReview } from "@/modules/reviews/actions";
import { SelectField, TextAreaField } from "@/components/forms/field";
import { VERIFIED_SEAL } from "@/modules/reviews/rules";

type Own = { id: string; rating: number; comment: string | null; verified?: boolean } | null;

/**
 * Formulário de Avaliação. O servidor decide quem pode criar (Proposta ACEITA do Prestador); este componente só é
 * renderizado para quem pode criar ou já tem Avaliação. `heading` troca o título; `showDelete` liga o botão de excluir.
 */
export function ReviewForm({ providerId, own, heading, showDelete = true, bare = false }: { providerId: string; own: Own; heading?: string; showDelete?: boolean; bare?: boolean }) {
  const previous = own !== null && own.verified === false;
  const intro = previous
    ? "Esta avaliação é anterior à verificação e continua sem o selo. Você pode editá-la ou excluí-la."
    : `Seu nome será público. Sua avaliação recebe o selo “${VERIFIED_SEAL}”, porque você aceitou uma proposta deste prestador.`;
  const body = <>
    {!bare && <h3>{heading ?? (own ? "Sua avaliação" : "Avalie este prestador")}</h3>}
    <p className="muted">{intro}</p>
    <ActionForm action={saveReview} label={own ? "Atualizar avaliação" : "Publicar avaliação"}><input type="hidden" name="providerId" value={providerId}/><SelectField label="Nota" name="rating" defaultValue={own?.rating ?? ""} required><option value="" disabled>Selecione uma nota</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} de 5</option>)}</SelectField><TextAreaField label="Comentário (opcional)" name="comment" maxLength={2000} rows={4} defaultValue={own?.comment ?? ""}/><p className="muted">Até 2.000 caracteres. Evite publicar dados pessoais.</p></ActionForm>
    {own && showDelete && <details className="confirm"><summary>Excluir minha avaliação</summary><div className="stack"><p>A avaliação sai do perfil e da média do prestador.</p><ActionForm action={deleteReview} label="Confirmar exclusão"><input type="hidden" name="providerId" value={providerId}/></ActionForm></div></details>}
  </>;
  return bare ? <div className="stack">{body}</div> : <div className="panel review-form" id="avaliar">{body}</div>;
}
