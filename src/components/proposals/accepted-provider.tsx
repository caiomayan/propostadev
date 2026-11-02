import Link from "next/link";
import { ProviderContacts } from "@/components/provider-contacts";
import type { AcceptedProvider } from "@/modules/proposals/queries";

/** Depois do Aceite: o Prestador escolhido em destaque, com os contatos públicos dele e o link para o Perfil. */
export function AcceptedProviderBlock({ provider }: { provider: AcceptedProvider }) {
  return <section className="panel tone stack accepted-provider" aria-labelledby="escolhido">
    <div><p className="eyebrow">Prestador escolhido</p><h2 id="escolhido">{provider.displayName}</h2>
      <p>Você aceitou esta proposta e o projeto foi encerrado. Combine o trabalho, o contrato e o pagamento direto com o prestador: isso acontece fora da Proposta.dev.</p></div>
    <ProviderContacts provider={provider}/>
    <p className="muted">E-mail de contato: <a href={`mailto:${provider.contactEmail}`}>{provider.contactEmail}</a>{provider.active && <> · <Link href={`/prestadores/${provider.slug}`}>Ver perfil público</Link></>}</p>
  </section>;
}
