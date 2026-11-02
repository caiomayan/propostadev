"use client";
import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { acceptProposal, preselectProposal, rejectProposal, unselectProposal } from "@/modules/proposals/actions";

/** Pré-selecionar e desmarcar: um formulário de um botão. O servidor confere dono, Projeto ABERTO e estado de origem. */
function QuickAction({ action, proposalId, label, providerName, pendingLabel }: { action: typeof preselectProposal; proposalId: string; label: string; providerName: string; pendingLabel: string }) {
  const [state, submit, pending] = useActionState(action, {});
  return <form action={submit} className="quick-action"><input type="hidden" name="propostaId" value={proposalId}/>
    <button type="submit" className="button secondary" disabled={pending} aria-label={`${label}: ${providerName}`}>{pending ? pendingLabel : label}</button>
    {state.error && <p role="alert" className="field-error">{state.error}</p>}</form>;
}

/**
 * Ações do Cliente sobre uma Proposta ativa de um Projeto aberto. A decisão é sempre do servidor; aqui só há formulários.
 * Aceitar e recusar pedem confirmação, no mesmo padrão de "Cancelar projeto".
 */
export function ProposalActions({ proposalId, status, providerName }: { proposalId: string; status: "ENVIADA" | "PRE_SELECIONADA"; providerName: string }) {
  return <div className="proposal-actions">
    <div className="actions">
      {status === "ENVIADA"
        ? <QuickAction action={preselectProposal} proposalId={proposalId} label="Pré-selecionar" pendingLabel="Pré-selecionando…" providerName={providerName}/>
        : <QuickAction action={unselectProposal} proposalId={proposalId} label="Desmarcar pré-seleção" pendingLabel="Desmarcando…" providerName={providerName}/>}
    </div>
    <details className="confirm accept">
      <summary>Aceitar proposta de {providerName}</summary>
      <div className="stack">
        <p><strong>Aceitar encerra o projeto e recusa todas as outras propostas.</strong> Você passa a ver os contatos de {providerName}, e o prestador vê o seu nome e e-mail. A decisão não pode ser desfeita. O combinado, o contrato e o pagamento acontecem fora da Proposta.dev.</p>
        <ActionForm action={acceptProposal} label="Confirmar aceite"><input type="hidden" name="propostaId" value={proposalId}/></ActionForm>
      </div>
    </details>
    <details className="confirm">
      <summary>Recusar proposta de {providerName}</summary>
      <div className="stack">
        <p>A recusa é definitiva: a proposta não volta para a disputa.</p>
        <ActionForm action={rejectProposal} label="Confirmar recusa"><input type="hidden" name="propostaId" value={proposalId}/></ActionForm>
      </div>
    </details>
  </div>;
}
