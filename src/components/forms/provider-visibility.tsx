"use client";
import { useRef } from "react";
import { setProviderActive } from "@/modules/providers/actions";
import { ActionForm } from "./action-form";
export function ProviderVisibility({ active }: { active: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = active ? "Desativar perfil" : "Reativar perfil";
  return <><button className="button secondary" type="button" onClick={() => dialog.current?.showModal()}>{label}</button><dialog ref={dialog} aria-labelledby="visibility-title" className="panel"><div className="stack"><h2 id="visibility-title">{label}?</h2><p>{active ? "O perfil sairá da busca, da comparação e da página pública. Ofertas e avaliações ficam preservadas. Ao reativar, as ofertas ainda ativas voltarão a aparecer." : "O perfil ficará público novamente. As ofertas ainda ativas voltarão a aparecer."}</p><ActionForm action={async (state, data) => { const result = await setProviderActive(state, data); if (result.success) dialog.current?.close(); return result; }} label={`Confirmar: ${label.toLowerCase()}`}><input name="active" type="hidden" value={active ? "false" : "true"} /></ActionForm><button className="button secondary" type="button" onClick={() => dialog.current?.close()}>Cancelar</button></div></dialog></>;
}
