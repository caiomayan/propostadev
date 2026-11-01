// Campos adicionais do usuário do Better Auth. Compartilhado entre a configuração
// do app e a configuração usada só pela CLI de geração do schema (sem server-only).
export const accountTypes = ["CLIENTE", "PRESTADOR"] as const;
export type AccountType = (typeof accountTypes)[number];

export const userAdditionalFields = {
  // input: false → nunca aceito em sign-up nem em update-user vindos do cliente.
  // Só o servidor define o tipo (src/lib/auth/account-type.ts).
  accountType: { type: "string", required: false, input: false, fieldName: "tipo_conta" },
} as const;
