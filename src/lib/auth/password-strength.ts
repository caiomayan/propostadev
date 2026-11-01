// Regra do produto: 12 a 128 caracteres. O indicador só mede acima desse mínimo.
export const passwordMin = 12;
export const passwordMax = 128;
export type PasswordStrength = { level: 0 | 1 | 2 | 3 | 4; label: string; valid: boolean; hint: string };

export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { level: 0, label: "Informe uma senha", valid: false, hint: `Use de ${passwordMin} a ${passwordMax} caracteres.` };
  if (value.length > passwordMax) return { level: 0, label: "Senha longa demais", valid: false, hint: `O máximo é ${passwordMax} caracteres.` };
  if (value.length < passwordMin) { const missing = passwordMin - value.length; return { level: 1, label: "Muito curta", valid: false, hint: `Faltam ${missing} ${missing === 1 ? "caractere" : "caracteres"} para o mínimo de ${passwordMin}.` }; }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  const distinct = new Set(value).size;
  if (distinct < 5 || (classes === 1 && value.length < 16)) return { level: 2, label: "Razoável", valid: true, hint: "Misture letras, números e símbolos ou use uma frase mais longa." };
  if (value.length >= 20 || (classes >= 3 && value.length >= 16)) return { level: 4, label: "Forte", valid: true, hint: "Boa senha." };
  return { level: 3, label: "Boa", valid: true, hint: "Quanto mais longa, mais forte." };
}
