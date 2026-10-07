import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { saveProvider } from "@/modules/providers/actions";
import { ProviderVisibility } from "@/components/forms/provider-visibility";
import { ActionForm } from "@/components/forms/action-form";
import { Field, SelectField, TextAreaField } from "@/components/forms/field";
export default async function ProviderPage() {
  const session = await requireSession();
  const [p] = await db.select().from(providers).where(eq(providers.userId, session.user.id)).limit(1);
  return <section className="stack"><h1>{p ? "Meu perfil" : "Criar perfil de prestador"}</h1><p>Experiência e tipo de pessoa são autodeclarados. Informe contatos que você autoriza publicar.</p><div className="panel"><ActionForm action={saveProvider} label="Salvar perfil"><SelectField name="type" label="Tipo de pessoa" defaultValue={p?.type}><option value="PESSOA_FISICA">Pessoa física</option><option value="PESSOA_JURIDICA">Pessoa jurídica</option></SelectField><Field name="displayName" label="Nome de exibição" required minLength={2} maxLength={100} defaultValue={p?.displayName} /><TextAreaField label="Descrição" name="description" required minLength={30} maxLength={5000} rows={6} defaultValue={p?.description} /><Field name="yearsExperience" label="Anos de experiência" type="number" required min={0} max={80} defaultValue={p?.yearsExperience ?? 0} /><Field name="contactEmail" label="E-mail público de contato" required type="email" maxLength={254} defaultValue={p?.contactEmail ?? session.user.email} />{([['photoUrl','URL da foto'],['city','Cidade'],['state','UF'],['country','País (duas letras)'],['phone','Telefone internacional'],['whatsapp','WhatsApp internacional'],['siteUrl','Site HTTPS'],['githubUrl','GitHub HTTPS'],['linkedinUrl','LinkedIn HTTPS']] as const).map(([name,label]) => <Field key={name} name={name} label={label} defaultValue={p?.[name] ?? (name === 'country' ? 'BR' : '')} maxLength={name.endsWith('Url') ? 2048 : name === 'state' || name === 'country' ? 2 : 100} hint={name === 'phone' || name === 'whatsapp' ? 'Exemplo: +5583999999999' : undefined} />)}<label className="checkbox"><input name="contactConsent" type="checkbox" required defaultChecked={Boolean(p)} /> Autorizo a publicação dos contatos informados no meu perfil.</label></ActionForm></div>{p && <div className="panel stack"><h2>Visibilidade do perfil</h2><p>{p.active ? "Desativar retira seu perfil da busca, da comparação e da página pública. Suas ofertas e avaliações ficam preservadas. Ao reativar, as ofertas ainda ativas voltam a aparecer." : "Reativar torna seu perfil público novamente. As ofertas ainda ativas voltam a aparecer."}</p><ProviderVisibility active={p.active} /></div>}</section>;
}


