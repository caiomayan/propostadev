import { eq } from "drizzle-orm";
import { requirePrestador } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { saveProvider } from "@/modules/providers/actions";
import { ProviderVisibility } from "@/components/forms/provider-visibility";
import { ActionForm } from "@/components/forms/action-form";
import { Field, SelectField, TextAreaField } from "@/components/forms/field";

type Pair = readonly [name: "photoUrl" | "city" | "state" | "country" | "phone" | "whatsapp" | "siteUrl" | "githubUrl" | "linkedinUrl", label: string, hint?: string];
const location: Pair[] = [["city", "Cidade"], ["state", "UF", "Duas letras, como PB."], ["country", "País", "Duas letras, como BR."]];
const phones: Pair[] = [["phone", "Telefone internacional", "Exemplo: +5583999999999"], ["whatsapp", "WhatsApp internacional", "Exemplo: +5583999999999"]];
const links: Pair[] = [["photoUrl", "URL da foto", "Endereço HTTPS de uma imagem. Em branco, usamos a foto da sua conta Google, se houver."], ["siteUrl", "Site", "Endereço HTTPS."], ["githubUrl", "GitHub", "Endereço HTTPS."], ["linkedinUrl", "LinkedIn", "Endereço HTTPS."]];

export default async function ProviderPage() {
  const session = await requirePrestador();
  const [p] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  const render = (list: Pair[]) => list.map(([name, label, hint]) => <Field key={name} name={name} label={label} hint={hint} defaultValue={p?.[name] ?? (name === "country" ? "BR" : "")} maxLength={name.endsWith("Url") ? 2048 : name === "state" || name === "country" ? 2 : 100} />);
  return <section className="stack form-page">
    <header className="dash-heading"><h1>{p ? "Meu perfil" : "Criar perfil de prestador"}</h1><p className="muted">É a primeira coisa que o cliente vê. Experiência e tipo de pessoa são autodeclarados.</p></header>
    <div className="panel"><ActionForm action={saveProvider} label="Salvar perfil">
      <fieldset className="form-section"><legend>Sobre você</legend>
        <div className="form-grid">
          <SelectField name="type" label="Tipo de pessoa" defaultValue={p?.type}><option value="PESSOA_FISICA">Pessoa física</option><option value="PESSOA_JURIDICA">Pessoa jurídica</option></SelectField>
          <Field name="yearsExperience" label="Anos de experiência" type="number" required min={0} max={80} defaultValue={p?.yearsExperience ?? 0} />
          <div className="full"><Field name="displayName" label="Nome de exibição" required minLength={2} maxLength={100} defaultValue={p?.displayName} hint="Como seu nome aparece na busca e no perfil." /></div>
          <div className="full"><TextAreaField label="Descrição" name="description" required minLength={30} maxLength={5000} rows={6} defaultValue={p?.description} /><small className="form-note">Mínimo de 30 caracteres. Explique o que você faz, para quem e como trabalha.</small></div>
        </div>
      </fieldset>
      <fieldset className="form-section"><legend>Onde você atua</legend><div className="form-grid three">{render(location)}</div></fieldset>
      <fieldset className="form-section"><legend>Contatos públicos</legend>
        <div className="form-grid">
          <div className="full"><Field name="contactEmail" label="E-mail público de contato" required type="email" maxLength={254} defaultValue={p?.contactEmail ?? session.user.email} /></div>
          {render(phones)}
        </div>
      </fieldset>
      <fieldset className="form-section"><legend>Foto e links</legend><div className="form-grid">{render(links)}</div></fieldset>
      <label className="checkbox consent"><input name="contactConsent" type="checkbox" required defaultChecked={Boolean(p)} /> Autorizo a publicação dos contatos informados no meu perfil.</label>
    </ActionForm></div>
    {p && <div className="panel stack"><h2>Visibilidade do perfil</h2><p>{p.active ? "Desativar retira seu perfil da busca, da comparação e da página pública. Suas ofertas e avaliações ficam preservadas. Ao reativar, as ofertas ainda ativas voltam a aparecer." : "Reativar torna seu perfil público novamente. As ofertas ainda ativas voltam a aparecer."}</p><div><ProviderVisibility active={p.active} /></div></div>}
  </section>;
}
