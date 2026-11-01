import { accountTypes, type AccountType } from "@/lib/auth/user-fields";

const options: Record<AccountType, { title: string; description: string }> = {
  CLIENTE: { title: "Cliente", description: "Quero contratar: descreva seu projeto e receba propostas" },
  PRESTADOR: { title: "Prestador", description: "Quero oferecer serviços: publique seu perfil e envie propostas" },
};

export function AccountTypePicker({ name = "accountType" }: { name?: string }) {
  return <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><legend className="eyebrow" style={{ padding: 0, marginBottom: 12 }}>Tipo de conta</legend>{accountTypes.map((value) => <label key={value} className="panel" style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}><input type="radio" name={name} value={value} required style={{ marginTop: 4 }} /><span className="stack" style={{ gap: 4 }}><strong>{options[value].title}</strong><span className="muted">{options[value].description}</span></span></label>)}</fieldset>;
}
