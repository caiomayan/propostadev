type Contacts = { contactEmail: string; phone: string | null; whatsapp: string | null; siteUrl: string | null; githubUrl: string | null; linkedinUrl: string | null };
export function ProviderContacts({ provider }: { provider: Contacts }) {
  const safeUrl = (url: string | null) => { try { return url && new URL(url).protocol === "https:" ? url : null; } catch { return null; } };
  return <div className="inline contact-links"><a className="button" href={`mailto:${provider.contactEmail}`}>E-mail de contato</a>
    {provider.whatsapp && /^\+[1-9]\d{7,14}$/.test(provider.whatsapp) && <a className="button secondary" href={`https://wa.me/${provider.whatsapp.slice(1)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
    {provider.phone && /^\+[1-9]\d{7,14}$/.test(provider.phone) && <a className="button secondary" href={`tel:${provider.phone}`}>Telefone</a>}
    {([['Site', provider.siteUrl], ['GitHub', provider.githubUrl], ['LinkedIn', provider.linkedinUrl]] as const).map(([label, value]) => safeUrl(value) && <a key={label} className="button secondary" href={safeUrl(value)!} target="_blank" rel="noopener noreferrer">{label}</a>)}
  </div>;
}
