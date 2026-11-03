import { Globe, Mail, Phone } from "lucide-react";
import { GithubIcon, LinkedinIcon, WhatsappIcon } from "@/components/brand-icons";

type Contacts = { contactEmail: string; phone: string | null; whatsapp: string | null; siteUrl: string | null; githubUrl: string | null; linkedinUrl: string | null };
export function ProviderContacts({ provider }: { provider: Contacts }) {
  const safeUrl = (url: string | null) => { try { return url && new URL(url).protocol === "https:" ? url : null; } catch { return null; } };
  const links = [["Site", provider.siteUrl, <Globe key="site" aria-hidden="true"/>], ["GitHub", provider.githubUrl, <GithubIcon key="github"/>], ["LinkedIn", provider.linkedinUrl, <LinkedinIcon key="linkedin"/>]] as const;
  return <div className="inline contact-links"><a className="button" href={`mailto:${provider.contactEmail}`}><Mail aria-hidden="true"/>E-mail de contato</a>
    {provider.whatsapp && /^\+[1-9]\d{7,14}$/.test(provider.whatsapp) && <a className="button secondary" href={`https://wa.me/${provider.whatsapp.slice(1)}`} target="_blank" rel="noopener noreferrer"><WhatsappIcon/>WhatsApp</a>}
    {provider.phone && /^\+[1-9]\d{7,14}$/.test(provider.phone) && <a className="button secondary" href={`tel:${provider.phone}`}><Phone aria-hidden="true"/>Telefone</a>}
    {links.map(([label, value, icon]) => safeUrl(value) && <a key={label} className="button secondary" href={safeUrl(value)!} target="_blank" rel="noopener noreferrer">{icon}{label}</a>)}
  </div>;
}
