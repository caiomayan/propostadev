import { accountTypes, type AccountType } from "@/lib/auth/user-fields";

const options: Record<AccountType, { title: string; description: string }> = {
  CLIENTE: { title: "Cliente", description: "Quero contratar: descreva seu projeto e receba propostas" },
  PRESTADOR: { title: "Prestador", description: "Quero oferecer serviços: publique seu perfil e envie propostas" },
};

export function AccountTypePicker({ name = "accountType", defaultValue }: { name?: string; defaultValue?: AccountType }) {
  return <fieldset className="account-choice"><legend>Tipo de conta</legend>{accountTypes.map((value) => <label key={value} className="choice-card"><input type="radio" name={name} value={value} required defaultChecked={value === defaultValue} /><span><strong>{options[value].title}</strong><span className="muted">{options[value].description}</span></span></label>)}</fieldset>;
}
