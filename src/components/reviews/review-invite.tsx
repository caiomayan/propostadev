import { ActionForm } from "@/components/forms/action-form";
import { ReviewBadge } from "@/components/review-badge";
import { ReviewForm } from "@/components/review-form";
import { deleteReview } from "@/modules/reviews/actions";
import type { OwnReview } from "@/modules/reviews/queries";

/**
 * Projeto ENCERRADO do Cliente: convite para avaliar o Prestador escolhido. Se a Avaliação já existe, mostra-a com
 * editar e excluir. A autorização é do servidor (saveReview/deleteReview); aqui só se apresenta o estado.
 */
export function ReviewInvite({ providerId, providerName, providerActive, own }: { providerId: string; providerName: string; providerActive: boolean; own: OwnReview | null }) {
  return <section className="stack project-review" aria-labelledby="avaliar-prestador">
    <div><p className="eyebrow">Avaliação</p><h2 id="avaliar-prestador">{own ? `Sua avaliação de ${providerName}` : `Avalie ${providerName}`}</h2></div>
    {!providerActive
      ? <p className="panel muted">O perfil de {providerName} está desativado no momento. A avaliação volta a ficar disponível quando o perfil for reativado.</p>
      : own ? <>
        <article className="own-review"><p><strong aria-label={`Nota ${own.rating} de 5`}>{own.rating}/5</strong></p><p><ReviewBadge verified={own.verified}/></p>{own.comment && <p>{own.comment}</p>}</article>
        <div className="review-manage">
          <details className="confirm edit"><summary>Editar avaliação</summary><ReviewForm providerId={providerId} own={own} showDelete={false} bare/></details>
          <details className="confirm"><summary>Excluir avaliação</summary><div className="stack"><p>A avaliação deixa de aparecer no perfil de {providerName}. Você pode avaliar de novo depois.</p><ActionForm action={deleteReview} label="Confirmar exclusão"><input type="hidden" name="providerId" value={providerId}/></ActionForm></div></details>
        </div></>
      : <div className="stack"><p>Você aceitou a proposta de {providerName}. Conte como foi: sua avaliação ajuda outros Clientes e aparece no perfil com o selo “Contratado pela Proposta.dev”.</p><ReviewForm providerId={providerId} own={null} heading={`Avalie ${providerName}`} bare/></div>}
  </section>;
}
